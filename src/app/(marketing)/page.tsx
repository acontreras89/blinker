import Link from "next/link";
import { Cursor } from "@/components/cursor";
import { buttonVariants } from "@/components/ui/button";
import { Hero } from "./_components/hero";
import { OFFER, faq, finePrint } from "./_components/offer";
import { Pricing } from "./_components/pricing";

const section = "wrap border-t py-[clamp(64px,11vh,128px)]";
const h2 =
  "mb-[clamp(28px,5vh,48px)] max-w-[18ch] text-section font-extrabold tracking-[-0.04em]";

const reasons = [
  [
    "Blank page, instantly.",
    "No templates, no onboarding tour, no welcome video. You log in, the cursor blinks, you type.",
  ],
  [
    "It saves. You don't have to.",
    "Every change goes to our servers while you write. If a save fails, you'll know before you lose a word.",
  ],
  [
    "It keeps score.",
    "Words and words per minute, live. Numbers don't lie. Neither does Blinker.",
  ],
];

const features = [
  [
    "Keyboard first",
    <>
      <kbd>⌘B</kbd> <kbd>⌘I</kbd> <kbd>⌘K</kbd>, or just type Markdown:{" "}
      <kbd>#</kbd> <kbd>-</kbd> <kbd>&gt;</kbd>
    </>,
  ],
  ["Toolbar on request", "Hidden until you ask for it. Most people never do."],
  ["Autosave you can trust", "Saved, Saving, or exactly what went wrong."],
  ["Live stats", "Word count and typing speed. Fireworks optional."],
] as const;

const quotes = [
  ["I wrote a novel. My cat wrote two.", "Marta, novelist and cat owner"],
  [
    "I opened Blinker to write a tweet. Three hours later I had a business plan and no friends.",
    "Dev, founder",
  ],
  [
    "The cursor blinked at me for six minutes. I've never felt so seen.",
    "Anonymous, still drafting",
  ],
];

export default function Landing() {
  return (
    <>
      <Hero finePrint={finePrint(OFFER)} />

      <section className={section} aria-labelledby="h-reasons">
        <h2 id="h-reasons" className={h2}>
          Three reasons. Then back to work.
        </h2>
        <div className="grid gap-[clamp(24px,4vw,48px)] lg:grid-cols-3">
          {reasons.map(([title, text]) => (
            <div key={title}>
              <h3 className="mb-1.5 text-xl font-semibold">{title}</h3>
              <p className="max-w-[34ch] text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="editor" className={section} aria-labelledby="h-editor">
        <h2 id="h-editor" className={h2}>
          Everything you need. Nothing to hide behind.
        </h2>
        <div className="grid items-start gap-[clamp(32px,5vw,64px)] lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div
            aria-hidden="true"
            className="rounded-2xl border px-[clamp(24px,5vw,56px)] pt-[clamp(28px,5vw,56px)] pb-5 [&_p]:mb-3"
          >
            <p className="!mb-4 text-[1.9rem] leading-[1.1] font-extrabold tracking-[-0.02em]">
              Q3 plan (finally)
            </p>
            <p>
              Three months ago I said I&apos;d write this next week. This is
              next week, times twelve.
            </p>
            <blockquote className="mb-3 border-l-[3px] pl-3.5 text-muted-foreground">
              Ship the thing. Then write about the thing.
            </blockquote>
            <p>
              First: stop reorganising the folder called Ideas.
              <Cursor />
            </p>
            <div className="mt-9 flex items-center gap-5 text-[0.85rem] text-muted-foreground tabular-nums">
              <span>412 words</span>
              <span>61 per minute</span>
              <span className="ml-auto inline-flex items-center gap-2 before:size-[7px] before:rounded-full before:bg-success">
                Saved
              </span>
            </div>
          </div>
          <div>
            <ul className="border-t [&_kbd]:rounded-md [&_kbd]:border [&_kbd]:border-b-2 [&_kbd]:bg-muted [&_kbd]:px-[0.45em] [&_kbd]:py-[0.1em] [&_kbd]:text-[0.85em] [&_kbd]:font-semibold">
              {features.map(([title, text]) => (
                <li key={title} className="border-b py-3.5">
                  <strong className="block">{title}</strong>
                  <span className="text-muted-foreground">{text}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 font-semibold">
              Not included: AI, collaborators, export, excuses.
            </p>
          </div>
        </div>
      </section>

      <section id="pricing" className={section} aria-label="Pricing">
        <h2 className={h2}>Pay to type.</h2>
        <Pricing plans={OFFER} />
      </section>

      <section className={section} aria-labelledby="h-quotes">
        <h2 id="h-quotes" className={h2}>
          People who stopped procrastinating. Allegedly.
        </h2>
        <div className="grid gap-[clamp(24px,4vw,48px)] lg:grid-cols-3">
          {quotes.map(([quote, who]) => (
            <figure key={who}>
              <blockquote className="mb-2.5 text-[1.3rem] leading-[1.4] font-medium">
                “{quote}”
              </blockquote>
              <figcaption className="text-[0.95rem] text-muted-foreground">
                {who}
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-8 text-[0.9rem] text-muted-foreground">
          Placeholder reviews. Real ones pending, once people stop reading
          landing pages and start typing.
        </p>
      </section>

      <section id="faq" className={section} aria-labelledby="h-faq">
        <h2 id="h-faq" className={h2}>
          Questions you&apos;re asking instead of writing.
        </h2>
        <div className="max-w-[820px]">
          {faq(OFFER).map(({ q, a }) => (
            <details key={q} className="group border-t last:border-b">
              <summary className="relative cursor-pointer list-none py-[18px] pr-10 text-[1.15rem] font-semibold after:absolute after:top-3.5 after:right-1.5 after:text-[1.4rem] after:text-muted-foreground after:content-['+'] group-open:after:content-['–'] [&::-webkit-details-marker]:hidden">
                {q}
              </summary>
              <p className="mb-[18px] max-w-[60ch] text-muted-foreground">
                {a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className={section} aria-labelledby="h-final">
        <h2
          id="h-final"
          className="mb-2 text-title font-extrabold tracking-[-0.04em]"
        >
          Still reading?
        </h2>
        <p className="mb-7 text-[1.3rem] text-muted-foreground">
          That&apos;s not writing.
        </p>
        <Link href="/signup" className={buttonVariants({ size: "2xl" })}>
          Start typing
        </Link>
      </section>
    </>
  );
}
