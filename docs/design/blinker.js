// Blinker design reference behaviour, shared by styleguide.html and landing.html.
(() => {
  const store = {
    get: (k) => {
      try {
        return localStorage.getItem(k);
      } catch {
        return null;
      }
    },
    set: (k, v) => {
      try {
        localStorage.setItem(k, v);
      } catch {}
    },
  };
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const words = (s) => (s.trim().match(/\S+/g) || []).length;
  const clock = (ms) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  // ---------- Doc controls: theme ----------
  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <details class="doc-ctl">
      <summary aria-label="Page settings">·</summary>
      <div class="menu">
        <button type="button" data-theme>Theme: auto</button>
      </div>
    </details>`,
  );
  const themeBtn = document.querySelector("[data-theme]");
  const themes = ["auto", "light", "dark"];
  let theme = themes.includes(store.get("theme")) ? store.get("theme") : "auto";
  const applyTheme = () => {
    root.classList.remove("light", "dark");
    if (theme !== "auto") root.classList.add(theme);
    themeBtn.textContent = `Theme: ${theme}`;
  };
  themeBtn.addEventListener("click", () => {
    theme = themes[(themes.indexOf(theme) + 1) % 3];
    store.set("theme", theme);
    applyTheme();
  });
  applyTheme();

  // ---------- Counter pop ----------
  // [data-fx] switches control it. Reduced motion always wins: off and locked.
  const fxBoxes = [...document.querySelectorAll("[data-fx]")];
  const fxOn = () => !reduced.matches && fxBoxes.some((b) => b.checked);
  const syncFx = () =>
    fxBoxes.forEach((b) => {
      b.disabled = reduced.matches;
      if (reduced.matches) b.checked = false;
      const label = b.closest("label")?.querySelector("[data-fx-text]");
      if (label)
        label.textContent = reduced.matches
          ? "Fireworks (off: reduced motion)"
          : "Fireworks";
    });
  reduced.addEventListener("change", syncFx);
  syncFx();

  function pop(el) {
    if (!fxOn()) return;
    el.animate(
      [
        { transform: "scale(1.5)", color: "var(--primary)" },
        { transform: "scale(1)" },
      ],
      { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" },
    );
    for (let i = 0; i < 8; i++) {
      const s = document.createElement("span");
      s.className = "spark";
      el.appendChild(s);
      const a = (Math.PI * 2 * i) / 8 + Math.random() * 0.4,
        d = 22 + Math.random() * 18;
      s.animate(
        [
          { transform: "translate(0,0) scale(1)", opacity: 1 },
          {
            transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(.3)`,
            opacity: 0,
          },
        ],
        {
          duration: 480 + Math.random() * 200,
          easing: "cubic-bezier(.1,.7,.3,1)",
        },
      ).onfinish = () => s.remove();
    }
  }
  const setNum = (el, v) => {
    if (el && el.textContent !== String(v)) {
      el.textContent = v;
      pop(el);
    }
  };

  // ---------- Typing demos: [data-try] wrapping a textarea ----------
  // Optional hooks inside the same [data-demo]: [data-words], [data-wpm], [data-nag].
  document.querySelectorAll("[data-demo]").forEach((demo) => {
    const wrap = demo.querySelector("[data-try]");
    const box = wrap.querySelector("textarea");
    const nag = demo.querySelector("[data-nag]");
    const t0 = Date.now();
    let start = null,
      last = null;
    const grow = () => {
      box.style.height = "auto";
      box.style.height = box.scrollHeight + "px";
    };
    const tick = () => {
      const n = words(box.value);
      const wpm = start
        ? Math.round(n / (Math.max(Date.now() - start, 10000) / 60000))
        : 0;
      setNum(demo.querySelector("[data-words]"), n);
      setNum(demo.querySelector("[data-wpm]"), wpm);
      if (!nag) return;
      if (!start)
        nag.innerHTML = `You've been here <b>${clock(Date.now() - t0)}</b>. Somebody else already wrote a paragraph.`;
      else if (Date.now() - last > 5000)
        nag.innerHTML = `<b>${n}</b> words, then nothing for <b>${clock(Date.now() - last)}</b>. The cursor noticed.`;
      else nag.textContent = "Keep going, it's working.";
    };
    box.addEventListener("input", () => {
      const now = Date.now();
      if (!start) start = now;
      last = now;
      wrap.classList.toggle("empty", box.value.length === 0);
      grow();
      tick();
    });
    window.addEventListener("resize", grow);
    grow();
    tick();
    setInterval(tick, 1000);
  });
})();
