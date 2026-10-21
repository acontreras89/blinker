import { expect, type Locator, type Page } from "@playwright/test";
import { TITLE_MAX } from "@/server/documents/rules";
import {
  Given,
  Then,
  When,
  credentials,
  documentPath,
  editor,
  expectFieldError,
  focusEditorEnd,
  register,
  registerSubscriber,
  save,
  seedDocument,
  type Seeded,
} from "./fixtures";

// User-facing copy, in the product's voice (docs/DESIGN.md#voice); control
// names stay plain.
const copy = {
  titleTooLong: `Too long. ${TITLE_MAX} characters, tops. It's a title, not a chapter.`,
  goneForGood: "Gone for good. There is no undo.",
  updated: (ago: string) => `Updated ${ago}`,
  created: (ago: string) => `Created ${ago}`,
};

// A document's entry on the dashboard: the list item (or row) holding the
// link named by its title. Its actions sit in a "More options" menu.
const entry = (page: Page, title: string) =>
  page
    .getByRole("listitem")
    .or(page.getByRole("row"))
    .filter({ has: page.getByRole("link", { name: title, exact: true }) });

const titleField = (page: Page) =>
  page.getByRole("textbox", { name: "Title", exact: true });

const confirmation = (page: Page) =>
  page.getByRole("alertdialog").or(page.getByRole("dialog"));

/** Runs an entry's action, opening its menu first if the action is not shown. */
async function act(page: Page, scope: Locator, action: string) {
  const item = page
    .getByRole("menuitem", { name: action, exact: true })
    .or(scope.getByRole("button", { name: action, exact: true }))
    .first();
  if (!(await item.isVisible()))
    await scope
      .getByRole("button", { name: "More options", exact: true })
      .click();
  await item.click();
}

async function rename(page: Page, from: string, to: string) {
  await act(page, entry(page, from), "Rename");
  await titleField(page).fill(to);
  await titleField(page).press("Enter");
}

async function startDeleting(page: Page, title: string) {
  await act(page, entry(page, title), "Delete");
}

// Dates

Given(
  "a logged-in user with a document {string} created {int} days ago and last updated {int} hours ago",
  async (
    { page, user, docs, billing },
    title: string,
    days: number,
    hours: number,
  ) => {
    await registerSubscriber(page.request, user, billing);
    docs.byTitle[title] = await seedDocument(page.request, {
      title,
      createdAt: new Date(Date.now() - days * 24 * 3_600_000),
      updatedAt: new Date(Date.now() - hours * 3_600_000),
    });
  },
);

Then(
  "{string} shows it was last updated {int} hours ago",
  async ({ page }, title: string, hours: number) => {
    await expect(entry(page, title)).toContainText(
      copy.updated(`${hours} hours ago`),
    );
  },
);

Then(
  "{string} shows it was created {int} days ago",
  async ({ page }, title: string, days: number) => {
    await expect(entry(page, title)).toContainText(
      copy.created(`${days} days ago`),
    );
  },
);

// The exact date is the relative one's accessible description (a tooltip
// tied to it, or a title), reachable by keyboard focus. Only the day is
// pinned; the time and the rest of the format are the UI's.
const day = (date: Date) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);

Then("the exact date of each is available", async ({ page, docs }) => {
  const dated = Object.values(docs.byTitle).filter(
    (d): d is Required<Seeded> => !!d.createdAt && !!d.updatedAt,
  );
  for (const doc of dated) {
    for (const [at, ago] of [
      [doc.updatedAt, /\d+ hours? ago/],
      [doc.createdAt, /\d+ days? ago/],
    ] as const) {
      const relative = entry(page, doc.title).getByText(ago);
      await relative.focus();
      await expect(relative).toHaveAccessibleDescription(
        new RegExp(day(at).replace(/[.,]/g, "\\$&")),
      );
    }
  }
});

// Order

When("they edit {string}", async ({ page }, title: string) => {
  await page.getByRole("link", { name: title, exact: true }).click();
  await expect(editor(page)).toBeVisible();
  await focusEditorEnd(page);
  await page.keyboard.type(" touched");
  await save(page);
});

When(
  "they rename to {string} {string}",
  async ({ page }, to: string, from: string) => {
    await rename(page, from, to);
    await expect(titleField(page)).toBeHidden();
  },
);

// Renaming

// DUPLICATES ARE ALLOWED ON PURPOSE: a document's identity is its id, not its
// title (ADR-0008). "the dashboard lists" counts each title; do not add a
// uniqueness check.
When(
  "they rename {string} to {string} from the dashboard",
  async ({ page }, from: string, to: string) => {
    await rename(page, from, to);
    await expect(titleField(page)).toBeHidden();
  },
);

When(
  "they try to rename {string} to a 101-character title",
  async ({ page }, from: string) => {
    await rename(page, from, "x".repeat(TITLE_MAX + 1));
  },
);

Then("they are told the title is too long", async ({ page }) => {
  await expectFieldError(page, "Title", copy.titleTooLong);
});

Then("they are still editing the title", async ({ page }) => {
  await expect(titleField(page)).toBeVisible();
});

When("they cancel the rename", async ({ page }) => {
  await titleField(page).press("Escape");
});

// Deleting

When(
  "they start deleting {string} from the dashboard",
  async ({ page }, title: string) => {
    await startDeleting(page, title);
  },
);

Then(
  "they are asked to confirm deleting {string} for good",
  async ({ page }, title: string) => {
    await expect(confirmation(page)).toBeVisible();
    await expect(confirmation(page)).toContainText(title);
    await expect(confirmation(page)).toContainText(copy.goneForGood);
  },
);

When("they cancel", async ({ page }) => {
  await confirmation(page)
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await expect(confirmation(page)).toBeHidden();
});

When(
  "they delete {string} from the dashboard",
  async ({ page }, title: string) => {
    if (new URL(page.url()).pathname !== "/app") await page.goto("/app");
    await startDeleting(page, title);
    await confirmation(page)
      .getByRole("button", { name: "Delete", exact: true })
      .click();
    await expect(confirmation(page)).toBeHidden();
  },
);

When(
  "they open the address {string} had",
  async ({ page, docs }, title: string) => {
    await page.goto(documentPath(docs.byTitle[title].id));
  },
);

// Ownership

Given("another user has a document", async ({ request, docs }) => {
  await register(request, credentials());
  docs.other = (await seedDocument(request, { text: "not yours" })).id;
});

When("they open the other user's document", async ({ page, docs }) => {
  await page.goto(documentPath(docs.other!));
});

When("they open a document nobody has", async ({ page }) => {
  await page.goto(documentPath("nobody00"));
});

Given(
  "they have a document containing {string}",
  async ({ request, docs }, text: string) => {
    docs.current = await seedDocument(request, { text });
  },
);

When("they open that document", async ({ page, docs }) => {
  await page.goto(documentPath(docs.current!.id));
});
