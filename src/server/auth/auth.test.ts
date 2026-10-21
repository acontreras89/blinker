import { describe, expect, it } from "vitest";
import { app } from "../app";

const post = (path: string, body: object) =>
  app.request(`http://localhost:3000/api/auth${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
    },
    body: JSON.stringify(body),
  });

const valid = {
  name: "Ada",
  email: "ada@example.com",
  password: "long enough",
};

describe("sign-up validation", () => {
  it.each([
    ["an empty name", { ...valid, name: "  " }],
    ["an invalid email", { ...valid, email: "not-an-email" }],
    ["a short password", { ...valid, password: "short" }],
  ])("rejects %s", async (_, body) => {
    expect((await post("/sign-up/email", body)).status).toBe(400);
  });

  it("registers valid details and starts a session", async () => {
    const res = await post("/sign-up/email", {
      ...valid,
      email: "grace@example.com",
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain("session_token");
  });
});

describe("sign-in validation", () => {
  it("rejects an invalid email", async () => {
    expect(
      (await post("/sign-in/email", { email: "nope", password: "x" })).status,
    ).toBe(400);
  });

  it("does not apply signup password rules", async () => {
    // A short password reaches the credential check: 401, not 400.
    expect(
      (
        await post("/sign-in/email", {
          email: "who@example.com",
          password: "x",
        })
      ).status,
    ).toBe(401);
  });
});

describe("session", () => {
  const session = (cookie = "") =>
    app.request("/session", { headers: { cookie } });

  it("is empty without a cookie", async () => {
    expect(await (await session()).json()).toEqual({ user: null });
  });

  it("returns only the user's id and name", async () => {
    const res = await post("/sign-up/email", {
      ...valid,
      email: "linus@example.com",
    });
    const cookie = res.headers.get("set-cookie")!.split(";")[0];
    const { user } = await (await session(cookie)).json();
    expect(Object.keys(user).sort()).toEqual(["id", "name"]);
    expect(user.name).toBe("Ada");
  });
});
