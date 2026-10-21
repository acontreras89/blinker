import { expect, type Locator, type Page } from "@playwright/test";
import { defineParameterType } from "playwright-bdd";
import {
  Given,
  Then,
  When,
  documentPath,
  editor,
  expectAlert,
  expectSaveStatus,
  focusEditorEnd,
  registerSubscriber,
  save,
  saveCopy,
  seedDocument,
  type Billing,
  type Credentials,
  type Seeded,
} from "./fixtures";

// Copy for save feedback lives in fixtures.ts (`saveCopy`), shared with the
// steps that wait on a save. Control names stay plain.
const copy = {
  saveButton: "Save",
  reload: "Reload",
};

// Chrome. The header is where the Save button lives: shown ⇔ Save visible.
// Escape reveals it (editor.feature), so steps use it to reach header controls.
const saveButton = (page: Page) =>
  page.getByRole("button", { name: copy.saveButton, exact: true });
const toolbar = (page: Page) =>
  page.getByRole("toolbar", { name: "Formatting", exact: true });
const counters = (page: Page) => [
  page.getByLabel("words", { exact: true }),
  page.getByLabel("per minute", { exact: true }),
];
const wpm = (page: Page) => page.getByLabel("per minute", { exact: true });
const readWpm = async (page: Page) => Number(await wpm(page).textContent());

/** Reveals the header with Escape when the target is not on screen yet. */
async function reach(page: Page, target: Locator) {
  if (!(await target.isVisible())) await page.keyboard.press("Escape");
  await expect(target).toBeVisible();
  return target;
}

/** Runs a header menu action ("…" is the "More options" button). */
async function headerAction(page: Page, action: string) {
  await (
    await reach(
      page,
      page.getByRole("button", { name: "More options", exact: true }),
    )
  ).click();
  await page.getByRole("menuitem", { name: action, exact: true }).click();
}

// Setup: a seeded document, open in the editor. The page clock is faked (time
// still flows) so idle minutes can be skipped.
async function openDocument(
  page: Page,
  doc: Seeded,
  { touch = false }: { touch?: boolean } = {},
) {
  if (touch) {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setTouchEmulationEnabled", {
      enabled: true,
      maxTouchPoints: 5,
    });
  }
  await page.clock.install();
  await page.goto(documentPath(doc.id));
  // Ready once the editor is there: a key pressed before the page is
  // interactive would go nowhere.
  await expect(editor(page)).toBeVisible();
}

const editing = (seed: { title?: string; text?: string }, touch = false) =>
  async function ({
    page,
    user,
    docs,
    billing,
  }: {
    page: Page;
    user: Credentials;
    docs: { current?: Seeded };
    billing: Billing;
  }) {
    await registerSubscriber(page.request, user, billing);
    docs.current = await seedDocument(page.request, seed);
    await openDocument(page, docs.current, { touch });
  };

// "A document" is empty unless the phrase says otherwise, so typed text is
// the whole content.
Given("a logged-in user editing a document", editing({}));
Given("a logged-in user editing an empty document", editing({}));
Given(
  "a logged-in user editing a document on a touch device",
  editing({}, true),
);
Given(
  "a logged-in user editing a document containing {string}",
  async ({ page, user, docs, billing }, text: string) =>
    editing({ text })({ page, user, docs, billing }),
);
Given(
  "a logged-in user editing a document titled {string}",
  async ({ page, user, docs, billing }, title: string) =>
    editing({ title })({ page, user, docs, billing }),
);

// Saving

When("they save the document with the save button", async ({ page }) => {
  await save(page, async () => (await reach(page, saveButton(page))).click());
});

When("they save the document with the keyboard shortcut", async ({ page }) => {
  await save(page);
});

Then("they are told the document has unsaved changes", async ({ page }) => {
  await expectSaveStatus(page, saveCopy.unsaved);
});

Then("they are told the document is saved", async ({ page }) => {
  await expectSaveStatus(page, saveCopy.saved);
});

// Saves are Server Action POSTs (plan step 2): failing them in the page is a
// lost connection, with no backend switch.
Given("saving fails", async ({ page, saving }) => {
  saving.fails = true;
  await page.route("**/*", (route) =>
    saving.fails &&
    route.request().method() === "POST" &&
    route.request().headers()["next-action"]
      ? route.abort("internetdisconnected")
      : route.fallback(),
  );
});

When("saving works again", async ({ saving }) => {
  saving.fails = false;
});

Then("they are told the document was not saved", async ({ page }) => {
  await expectAlert(page, saveCopy.failed);
});

Then("they are warned the document was not saved", async ({ page }) => {
  await expectAlert(page, saveCopy.warned);
});

// Closing the tab runs `beforeunload`; dismissing the prompt keeps the page.
When("they try to leave the page", async ({ page, dialogs }) => {
  page.once("dialog", async (dialog) => {
    dialogs.push(dialog.type());
    await dialog.dismiss();
  });
  await page.close({ runBeforeUnload: true });
});

Then("they are asked to confirm leaving", async ({ dialogs }) => {
  await expect.poll(() => dialogs).toContain("beforeunload");
});

// NEGOTIABLE (plan step 6): autosave fires after AUTOSAVE_IDLE_MS = 1000 of
// quiet; the Then that follows waits on top.
When("they pause", async ({ page }) => {
  await page.waitForTimeout(1500);
});

// Two tabs: the first is the scenario's page, the second shares its session.

Given(
  "a logged-in user with a document open in two tabs",
  async ({ page, secondTab, user, docs, billing }) => {
    await registerSubscriber(page.request, user, billing);
    docs.current = await seedDocument(page.request);
    for (const tab of [page, secondTab]) {
      await tab.goto(documentPath(docs.current.id));
    }
  },
);

const tabOf = (which: string, page: Page, secondTab: Page) =>
  which === "first" ? page : secondTab;

When(
  /^they type "(.*)" in the (first|second) tab( and save it)?$/,
  async ({ page, secondTab }, text: string, which: string, andSave) => {
    const tab = tabOf(which, page, secondTab);
    await tab.bringToFront();
    await focusEditorEnd(tab);
    await tab.keyboard.type(text);
    if (andSave) await save(tab);
  },
);

Then(
  "the second tab is told its version replaced a newer one",
  async ({ secondTab }) => {
    await expectAlert(secondTab, saveCopy.overwrote);
  },
);

// AUTOSAVE NEVER OVERWRITES: only an explicit save wins over a newer version
// (ADR-0008).
Then(
  "the second tab is warned the document changed elsewhere",
  async ({ secondTab }) => {
    await expectAlert(secondTab, saveCopy.changedElsewhere);
  },
);

When("they reload the first tab", async ({ page }) => {
  await page.bringToFront();
  await page.reload();
});

Then(
  /^the first tab's editor (contains|does not contain) "(.*)"$/,
  async ({ page }, how: string, text: string) => {
    await expect(editor(page)).toBeVisible();
    if (how === "contains") await expect(editor(page)).toContainText(text);
    else await expect(editor(page)).not.toContainText(text);
  },
);

// NEGOTIABLE (plan step 6): coming back to a tab is bringing it to front.
When("they return to the second tab", async ({ secondTab }) => {
  await secondTab.bringToFront();
  await secondTab.evaluate(() => window.dispatchEvent(new Event("focus")));
});

Then(
  "the second tab is told the document changed elsewhere and offered to reload",
  async ({ secondTab }) => {
    const alert = secondTab
      .getByRole("alert")
      .filter({ hasText: saveCopy.changedElsewhere });
    await expect(alert).toBeVisible();
    await expect(
      secondTab.getByRole("button", { name: copy.reload, exact: true }),
    ).toBeVisible();
  },
);

// Managing the document

When(
  "they rename the document to {string}",
  async ({ page, docs }, title: string) => {
    const field = page.getByRole("textbox", { name: "Title", exact: true });
    // The title shows as itself; activating it gives the Title field.
    const control = field.or(
      page.getByRole("button", { name: docs.current!.title, exact: true }),
    );
    await (await reach(page, control.first())).click();
    await field.fill(title);
    await field.press("Enter");
    await expect(field).toBeHidden();
  },
);

When("they delete the document", async ({ page }) => {
  await headerAction(page, "Delete");
  await page
    .getByRole("alertdialog")
    .or(page.getByRole("dialog"))
    .getByRole("button", { name: "Delete", exact: true })
    .click();
});

// Chrome

Then("they see only the text and the counters", async ({ page }) => {
  await expect(editor(page)).toBeVisible();
  for (const counter of counters(page)) await expect(counter).toBeVisible();
  await expect(saveButton(page)).toBeHidden();
  await expect(toolbar(page)).toBeHidden();
  await expect(page.getByRole("link").filter({ visible: true })).toHaveCount(0);
});

Then(/^they (see|do not see) the header$/, async ({ page }, how: string) => {
  if (how === "see") await expect(saveButton(page)).toBeVisible();
  else await expect(saveButton(page)).toBeHidden();
});

When("they point at the top of the page", async ({ page }) => {
  const width = page.viewportSize()?.width ?? 1280;
  await page.mouse.move(width / 2, 300);
  await page.mouse.move(width / 2, 0, { steps: 5 });
});

When("they press Escape", async ({ page }) => {
  await page.keyboard.press("Escape");
});

const modes = {
  "on request": "On request",
  "until typing": "Until typing",
  always: "Always",
} as const;

// The mode is a choice named "Show header" whose options are named by mode;
// radio group, menu or select are the UI's.
When(
  /^they set the header to show (on request|until typing|always)$/,
  async ({ page }, mode: keyof typeof modes) => {
    const name = modes[mode];
    const option = page
      .getByRole("radio", { name, exact: true })
      .or(page.getByRole("menuitemradio", { name, exact: true }))
      .or(page.getByRole("option", { name, exact: true }))
      .first();
    const trigger = page
      .getByRole("button", { name: "Show header", exact: true })
      .or(page.getByRole("combobox", { name: "Show header", exact: true }))
      .first();
    if (!(await option.isVisible())) await (await reach(page, trigger)).click();
    await option.click();
  },
);

Then("they see the toolbar", async ({ page }) => {
  await expect(toolbar(page)).toBeVisible();
});

When("they open the toolbar", async ({ page }) => {
  if (await toolbar(page).isVisible()) return;
  await (
    await reach(
      page,
      page.getByRole("button", { name: "Toolbar", exact: true }),
    )
  ).click();
  await expect(toolbar(page)).toBeVisible();
});

When("they pin the toolbar", async ({ page }) => {
  await page.getByRole("button", { name: "Pin toolbar", exact: true }).click();
});

When("they unpin the counters", async ({ page }) => {
  const unpin = page
    .getByRole("button", { name: "Unpin counters", exact: true })
    .or(
      page.getByRole("button", {
        name: "Pin counters",
        exact: true,
        pressed: true,
      }),
    )
    .first();
  await (await reach(page, unpin)).click();
});

Then("they do not see the counters", async ({ page }) => {
  await expect(editor(page)).toBeVisible();
  for (const counter of counters(page)) await expect(counter).toBeHidden();
});

// Formats: shortcuts are Tiptap's defaults (plus ⌘K for links); each toolbar
// button is named by its format and describes its shortcut or Markdown rule.

type Format = keyof typeof formats;
const formats = {
  bold: { button: "Bold", keys: "ControlOrMeta+b" },
  italic: { button: "Italic", keys: "ControlOrMeta+i" },
  strikethrough: { button: "Strikethrough", keys: "ControlOrMeta+Shift+s" },
  "inline code": { button: "Inline code", keys: "ControlOrMeta+e" },
  "a heading 1": { button: "Heading 1", keys: "ControlOrMeta+Alt+1" },
  "a heading 2": { button: "Heading 2", keys: "ControlOrMeta+Alt+2" },
  "a heading 3": { button: "Heading 3", keys: "ControlOrMeta+Alt+3" },
  "a bulleted list": { button: "Bulleted list", keys: "ControlOrMeta+Shift+8" },
  "a numbered list": { button: "Numbered list", keys: "ControlOrMeta+Shift+7" },
  "a quote": { button: "Quote", keys: "ControlOrMeta+Shift+b" },
  "a code block": { button: "Code block", keys: "ControlOrMeta+Alt+c" },
} as const;

defineParameterType({
  name: "format",
  regexp: new RegExp(
    Object.keys(formats)
      .sort((a, b) => b.length - a.length)
      .join("|"),
  ),
  transformer: (format: string) => format as Format,
});

When(
  "they type {string} as {format} with its shortcut",
  async ({ page }, text: string, format: Format) => {
    await focusEditorEnd(page);
    await page.keyboard.press(formats[format].keys);
    await page.keyboard.type(text);
  },
);

// What the reader perceives: ARIA roles where HTML has them; otherwise the
// rendering (line-through, list markers, a code block's `pre`).
Then(
  "the editor shows {string} as {format}",
  async ({ page }, text: string, format: Format) => {
    const box = editor(page);
    const exact = new RegExp(`^${text.replace(/[*+?^$()[\]\\.]/g, "\\$&")}$`);
    const role = (r: "strong" | "emphasis" | "code" | "blockquote") =>
      expect(box.getByRole(r).filter({ hasText: exact })).toBeVisible();
    const list = async (marker: RegExp) => {
      const item = page.getByRole("listitem").filter({ hasText: exact });
      await expect(
        box.getByRole("listitem").filter({ hasText: exact }),
      ).toBeVisible();
      // `has` is relative to the list: the item locator must not start at the box.
      await expect(box.getByRole("list").filter({ has: item })).toHaveCSS(
        "list-style-type",
        marker,
      );
    };
    switch (format) {
      case "bold":
        return role("strong");
      case "italic":
        return role("emphasis");
      case "inline code":
        return role("code");
      case "a quote":
        return role("blockquote");
      case "strikethrough":
        return expect(box.getByText(text, { exact: true })).toHaveCSS(
          "text-decoration-line",
          "line-through",
        );
      case "a heading 1":
      case "a heading 2":
      case "a heading 3":
        return expect(
          box.getByRole("heading", {
            level: Number(format.at(-1)),
            name: text,
            exact: true,
          }),
        ).toBeVisible();
      case "a bulleted list":
        return list(/^(disc|circle|square)$/);
      case "a numbered list":
        return list(/^decimal$/);
      case "a code block":
        return expect(
          box.locator("pre").getByRole("code").filter({ hasText: exact }),
        ).toBeVisible();
    }
  },
);

Then("the editor shows a horizontal rule", async ({ page }) => {
  await expect(editor(page).getByRole("separator")).toBeVisible();
});

When(
  "they select {string} and link it to {string} with the link shortcut",
  async ({ page }, text: string, url: string) => {
    await editor(page).getByText(text, { exact: true }).selectText();
    await page.keyboard.press("ControlOrMeta+k");
    // The shortcut leaves the caret in the URL field, wherever it renders.
    await page.keyboard.type(url);
    await page.keyboard.press("Enter");
  },
);

Then(
  "{string} links to {string}",
  async ({ page }, text: string, url: string) => {
    await expect(
      editor(page).getByRole("link", { name: text, exact: true }),
    ).toHaveAttribute("href", url);
  },
);

When("they undo", async ({ page }) => {
  await editor(page).press("ControlOrMeta+z");
});

When("they redo", async ({ page }) => {
  await editor(page).press("ControlOrMeta+Shift+z");
});

// Each toolbar button's tooltip (its accessible description) shows the
// shortcut, as ⌘/Ctrl, ⇧/Shift and ⌥/Alt/Option plus the key, in any order
// and style; the rule shows its Markdown.
const MOD = "(⌘|Ctrl|Cmd)";
const SHIFT = "(⇧|Shift)";
const ALT = "(⌥|Alt|Option)";
const shortcut = (keys: string) => {
  const parts = keys.split("+");
  const key = parts.at(-1)!;
  const needs = [
    MOD,
    ...(parts.includes("Shift") ? [SHIFT] : []),
    ...(parts.includes("Alt") ? [ALT] : []),
  ];
  return new RegExp(
    `${needs.map((n) => `(?=.*${n})`).join("")}.*${key}\\s*$`,
    "i",
  );
};
const taught = [
  ["Undo", shortcut("ControlOrMeta+z")],
  ["Redo", shortcut("ControlOrMeta+Shift+z")],
  ["Link", shortcut("ControlOrMeta+k")],
  ...Object.values(formats).map((f) => [f.button, shortcut(f.keys)] as const),
  ["Horizontal rule", /---/],
] as const;

Then("every format in the toolbar shows its shortcut", async ({ page }) => {
  for (const [name, description] of taught) {
    const button = toolbar(page).getByRole("button", { name, exact: true });
    await button.hover();
    await expect(button).toHaveAccessibleDescription(description);
  }
});

// Counters

// THE IDLE HALF HOUR IS THE POINT: a page left open drags the speed down;
// resetting measures from now on. Words stay those in the document.
When(
  "they leave the page idle for {int} minutes",
  async ({ page, speed }, minutes: number) => {
    speed.beforeIdle = await readWpm(page);
    await page.clock.fastForward(minutes * 60_000);
  },
);

Then("the words per minute have dropped", async ({ page, speed }) => {
  await expect.poll(() => readWpm(page)).toBeLessThan(speed.beforeIdle!);
});

Then(
  "the words per minute are higher than before the reset",
  async ({ page, speed }) => {
    await expect.poll(() => readWpm(page)).toBeGreaterThan(speed.beforeReset!);
  },
);
