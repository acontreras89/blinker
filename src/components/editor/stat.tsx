"use client";

import { useEffect, useRef } from "react";

type StatProps = {
  value: number;
  label: string;
  /** Counter pop on every change. Callers turn it off under reduced motion. */
  pop?: boolean;
  testId?: string;
};

export function Stat({ value, label, pop = false, testId }: StatProps) {
  const box = useRef<HTMLSpanElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);

  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;
    if (pop && box.current && num.current) burst(box.current, num.current);
  }, [value, pop]);

  return (
    <span className="flex items-baseline gap-2 text-[0.95rem] text-muted-foreground">
      <span ref={box} className="relative inline-block">
        <span
          ref={num}
          data-testid={testId}
          className="inline-block text-2xl font-extrabold text-foreground tabular-nums"
        >
          {value}
        </span>
      </span>
      {label}
    </span>
  );
}

function burst(box: HTMLElement, num: HTMLElement) {
  num.animate(
    [
      { transform: "scale(1.5)", color: "var(--primary)" },
      { transform: "scale(1)" },
    ],
    { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" },
  );
  for (let i = 0; i < 8; i++) {
    const spark = document.createElement("span");
    spark.className =
      "pointer-events-none absolute top-1/2 left-1/2 -m-[3px] size-1.5 rounded-full bg-primary";
    box.appendChild(spark);
    const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.4;
    const distance = 22 + Math.random() * 18;
    spark.animate(
      [
        { transform: "translate(0,0) scale(1)", opacity: 1 },
        {
          transform: `translate(${Math.cos(angle) * distance}px,${Math.sin(angle) * distance}px) scale(.3)`,
          opacity: 0,
        },
      ],
      {
        duration: 480 + Math.random() * 200,
        easing: "cubic-bezier(.1,.7,.3,1)",
      },
    ).onfinish = () => spark.remove();
  }
}
