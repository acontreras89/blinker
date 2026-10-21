import { randomUUID } from "node:crypto";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { app } from "../app";
import { fakeBilling } from "../billing/fake";
import { CONTENT_MAX_BYTES } from "./rules";

const doc = (text: string) => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});

async function signUp() {
  const res = await app.request(
    "http://localhost:3000/api/auth/sign-up/email",
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
      },
      body: JSON.stringify({
        name: "Ada",
        email: `${randomUUID()}@example.com`,
        password: "long enough",
      }),
    },
  );
  return res.headers.get("set-cookie")!.split(";")[0];
}

const billing = (cookie: string, path: string, body?: unknown) =>
  app.request(`/billing${path}`, {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

/** Pays Checkout on the fake and comes back: on the trial, or paying. */
async function subscribe(cookie: string, trial = false) {
  const { url } = await (await billing(cookie, "/checkout")).json();
  const sessionId = url.split("/").at(-1);
  fakeBilling.complete(sessionId);
  await billing(cookie, "/return", { sessionId });
  if (!trial) await billing(cookie, "/trial/end");
  return cookie;
}

const subscriber = async () => subscribe(await signUp());

// A tiny client bound to one user's cookie.
function as(cookie: string) {
  const call = (method: string, path: string, body?: unknown) =>
    app.request(`/documents${path}`, {
      method,
      headers: { cookie, "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  return {
    call,
    list: async () => (await (await call("GET", "")).json()).documents,
    titles: async () =>
      (await (await call("GET", "")).json()).documents.map(
        (d: { title: string }) => d.title,
      ),
    create: async (text = "") =>
      (await (await call("POST", "", { content: doc(text) })).json()).document,
    get: (id: string) => call("GET", `/${id}`),
    save: (id: string, text: string, revision: number, mode = "manual") =>
      call("PUT", `/${id}/content`, { content: doc(text), revision, mode }),
    rename: (id: string, title: string) => call("PATCH", `/${id}`, { title }),
    remove: (id: string) => call("DELETE", `/${id}`),
  };
}

let ada: ReturnType<typeof as>;
let eve: ReturnType<typeof as>;
beforeAll(async () => {
  ada = as(await subscriber());
  eve = as(await subscriber());
});
afterEach(() => vi.unstubAllEnvs());

describe("documents", () => {
  it("need a session", async () => {
    expect((await as("").call("GET", "")).status).toBe(401);
  });

  it("are numbered among the user's own titles", async () => {
    const user = as(await subscriber());
    await user.create();
    const second = await user.create();
    await eve.create();
    expect(second.title).toBe("Untitled (1)");
    expect(await user.titles()).toEqual(["Untitled (1)", "Untitled"]);
  });

  it("keep their content and revision", async () => {
    const { id, revision } = await ada.create("hello");
    const { document } = await (await ada.get(id)).json();
    expect(document).toMatchObject({ id, revision, content: doc("hello") });
  });

  it("refuse content that is not a ProseMirror doc", async () => {
    const res = await ada.call("POST", "", {
      content: { type: "paragraph" },
    });
    expect(res.status).toBe(400);
  });

  it("refuse content over 1 MB", async () => {
    const { id, revision } = await ada.create();
    const big = "x".repeat(CONTENT_MAX_BYTES);
    expect((await ada.save(id, big, revision)).status).toBe(413);
    expect((await ada.call("POST", "", { content: doc(big) })).status).toBe(
      413,
    );
  });

  it("list the most recently updated first", async () => {
    const user = as(await subscriber());
    const old = await user.create();
    await user.create();
    await user.save(old.id, "touched", old.revision);
    expect((await user.list())[0].id).toBe(old.id);
  });
});

describe("another user's document", () => {
  it("looks like a missing one, and stays untouched", async () => {
    const { id, title, revision } = await ada.create("mine");
    const missing = [
      await eve.get(id),
      await eve.save(id, "theirs", revision),
      await eve.rename(id, "theirs"),
      await eve.remove(id),
      await eve.get("nobody12"),
    ];
    expect(missing.map((r) => r.status)).toEqual([404, 404, 404, 404, 404]);
    const { document } = await (await ada.get(id)).json();
    expect(document).toMatchObject({ title, revision });
    expect(document.content).toEqual(doc("mine"));
  });
});

describe("saving", () => {
  it("from the latest revision does not overwrite anything", async () => {
    const { id, revision } = await ada.create();
    const res = await ada.save(id, "next", revision);
    expect(await res.json()).toMatchObject({
      revision: revision + 1,
      overwrote: false,
    });
  });

  it("manually from a stale revision wins and says so", async () => {
    const { id, revision } = await ada.create();
    await ada.save(id, "first tab", revision);
    const res = await ada.save(id, "second tab", revision);
    expect(await res.json()).toMatchObject({ overwrote: true });
    const { document } = await (await ada.get(id)).json();
    expect(document.content).toEqual(doc("second tab"));
  });

  it("automatically from a stale revision is refused", async () => {
    const { id, revision } = await ada.create();
    await ada.save(id, "first tab", revision);
    const res = await ada.save(id, "second tab", revision, "auto");
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ revision: revision + 1 });
    const { document } = await (await ada.get(id)).json();
    expect(document.content).toEqual(doc("first tab"));
  });

  it("automatically from the latest revision writes", async () => {
    const { id, revision } = await ada.create();
    expect((await ada.save(id, "auto", revision, "auto")).status).toBe(200);
  });
});

describe("renaming", () => {
  it("trims the title and bumps the update time", async () => {
    // Same-millisecond timestamps would make the bump invisible.
    vi.useFakeTimers({ toFake: ["Date"] });
    const { id, updatedAt } = await ada.create();
    vi.advanceTimersByTime(1000);
    const res = await ada.rename(id, "   Final   ");
    vi.useRealTimers();
    const body = await res.json();
    expect(body.title).toBe("Final");
    expect(body.updatedAt > updatedAt).toBe(true);
  });

  it("to an empty title keeps the previous one, untouched", async () => {
    const { id, title, updatedAt } = await ada.create();
    const res = await ada.rename(id, "   ");
    expect(await res.json()).toEqual({ title, updatedAt });
  });

  it("refuses over 100 characters", async () => {
    const { id } = await ada.create();
    expect((await ada.rename(id, "x".repeat(101))).status).toBe(400);
    expect((await ada.rename(id, "x".repeat(100))).status).toBe(200);
  });

  // Duplicates are allowed on purpose: identity is the id (ADR-0008).
  it("allows duplicate titles", async () => {
    const user = as(await subscriber());
    const a = await user.create();
    const b = await user.create();
    await user.rename(a.id, "Draft");
    await user.rename(b.id, "Draft");
    expect(await user.titles()).toEqual(["Draft", "Draft"]);
  });
});

describe("deleting", () => {
  it("removes the document for good", async () => {
    const { id } = await ada.create();
    expect((await ada.remove(id)).status).toBe(204);
    expect((await ada.get(id)).status).toBe(404);
    expect((await ada.remove(id)).status).toBe(404);
  });
});

describe("without access", () => {
  it("refuses writing but lets them read and delete", async () => {
    vi.stubEnv("E2E_SEED", "on");
    const cookie = await signUp();
    const user = as(cookie);
    const seeded = await app.request("/api/e2e/documents", {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ title: "Old notes" }),
    });
    const { id } = await seeded.json();
    const refused = { error: "no_access" };
    const create = await user.call("POST", "", { content: doc("new") });
    expect([create.status, await create.json()]).toEqual([403, refused]);
    expect((await user.save(id, "edited", 1)).status).toBe(403);
    expect((await user.rename(id, "Renamed")).status).toBe(403);
    expect((await user.get(id)).status).toBe(200);
    expect((await user.remove(id)).status).toBe(204);
  });

  it("on a trial, caps how many documents exist at once", async () => {
    const user = as(await subscribe(await signUp(), true));
    const { id } = await user.create("first");
    const second = await user.call("POST", "", { content: doc("second") });
    expect(second.status).toBe(403);
    expect(await second.json()).toEqual({ error: "trial_limit" });
    expect((await user.save(id, "edited", 1)).status).toBe(200);
    await user.remove(id);
    expect(
      (await user.call("POST", "", { content: doc("again") })).status,
    ).toBe(201);
  });
});

describe("e2e seeding", () => {
  const seed = (cookie: string, body: object) =>
    app.request("/api/e2e/documents", {
      method: "POST",
      headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  it("does not exist unless enabled", async () => {
    const cookie = await signUp();
    expect((await seed(cookie, { title: "Notes" })).status).toBe(404);
  });

  it("creates backdated documents for the cookie's user", async () => {
    vi.stubEnv("E2E_SEED", "on");
    const cookie = await signUp();
    const createdAt = "2026-01-01T00:00:00.000Z";
    const updatedAt = "2026-01-02T00:00:00.000Z";
    const res = await seed(cookie, {
      title: "Notes",
      text: "where was I",
      createdAt,
      updatedAt,
    });
    expect(res.status).toBe(201);
    expect(await as(cookie).list()).toEqual([
      { id: (await res.json()).id, title: "Notes", createdAt, updatedAt },
    ]);
  });
});
