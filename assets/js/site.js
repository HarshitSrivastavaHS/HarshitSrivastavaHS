document.documentElement.classList.add("js");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function initEntry() {
  if (reduceMotion.matches) return;
  document.body.classList.add("is-entering");
  window.setTimeout(() => document.body.classList.remove("is-entering"), 650);
}

function initNavigation() {
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (!header || !toggle || !nav) return;

  const label = toggle.querySelector(".sr-only");
  const close = (returnFocus = false) => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    if (label) label.textContent = "Open menu";
    if (returnFocus) toggle.focus();
  };

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    if (label) label.textContent = open ? "Close menu" : "Open menu";
  });
  nav.addEventListener("click", (event) => { if (event.target.closest("a")) close(); });
  document.addEventListener("click", (event) => { if (!header.contains(event.target)) close(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(true); });
  window.addEventListener("resize", () => { if (window.innerWidth > 860) close(); }, { passive: true });

  const current = location.pathname.split("/").pop() || "index.html";
  nav.querySelectorAll("a").forEach((link) => {
    const target = new URL(link.href, location.href).pathname.split("/").pop() || "index.html";
    if (target === current) link.setAttribute("aria-current", "page");
  });

  let ticking = false;
  const updateHeader = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 24);
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(updateHeader); }
  }, { passive: true });
  updateHeader();
}

function initPageTransitions() {
  if (reduceMotion.matches) return;
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.hash || link.hasAttribute("download") || link.target === "_blank" || url.pathname.endsWith(".pdf")) return;
    event.preventDefault();
    document.body.classList.add("is-leaving");
    window.setTimeout(() => { location.href = url.href; }, 380);
  });
  window.addEventListener("pageshow", () => document.body.classList.remove("is-leaving"));
}

function initReveals() {
  const items = [...document.querySelectorAll("[data-reveal]")];
  if (!items.length) return;
  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -10%", threshold: .08 });
  items.forEach((item) => observer.observe(item));
}

function initSystemSketch() {
  const sketch = document.querySelector("[data-system-sketch]");
  if (!sketch) return;
  const controls = [...sketch.querySelectorAll("[data-sketch-control]")];
  const nodes = [...sketch.querySelectorAll("[data-sketch-node]")];
  const paths = [...sketch.querySelectorAll("[data-path]")];
  const signals = [...sketch.querySelectorAll("[data-signal]")];
  const order = ["hardware", "software", "robotics", "creative"];
  const svgs = [...sketch.querySelectorAll("svg")];
  let current = 0;
  let visible = !("IntersectionObserver" in window);
  let cycleTimer;

  const activate = (name) => {
    current = Math.max(0, order.indexOf(name));
    controls.forEach((control) => control.setAttribute("aria-pressed", String(control.dataset.sketchControl === name)));
    nodes.forEach((node) => node.classList.toggle("is-active", node.dataset.sketchNode === name));
    paths.forEach((path) => path.classList.toggle("is-active", path.dataset.path === name));
    signals.forEach((signal) => signal.classList.toggle("is-active", signal.dataset.signal === name));
  };
  const stopCycle = () => window.clearTimeout(cycleTimer);
  const startCycle = () => {
    stopCycle();
    if (reduceMotion.matches || !visible || document.hidden) return;
    cycleTimer = window.setTimeout(() => {
      current = (current + 1) % order.length;
      activate(order[current]);
      startCycle();
    }, 2300);
  };
  controls.forEach((control) => {
    ["click", "mouseenter", "focus"].forEach((type) => control.addEventListener(type, () => {
      activate(control.dataset.sketchControl);
      startCycle();
    }));
  });
  activate("hardware");

  const sync = () => {
    svgs.forEach((svg) => {
      if (typeof svg.pauseAnimations !== "function") return;
      if (!visible || document.hidden || reduceMotion.matches) svg.pauseAnimations();
      else svg.unpauseAnimations();
    });
    startCycle();
  };
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, { threshold: .05 });
    observer.observe(sketch);
  } else {
    sync();
  }
  document.addEventListener("visibilitychange", sync);
}

function initProjectScenes() {
  const scenes = [...document.querySelectorAll("[data-scene]")];
  if (!scenes.length) return;
  let activeScenes = new Set();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.isIntersecting ? activeScenes.add(entry.target) : activeScenes.delete(entry.target));
  }, { rootMargin: "20% 0px", threshold: 0 });
  scenes.forEach((scene) => observer.observe(scene));

  let ticking = false;
  const update = () => {
    activeScenes.forEach((scene) => {
      const rect = scene.getBoundingClientRect();
      const travel = Math.max(1, rect.height - innerHeight);
      const progress = clamp(-rect.top / travel);
      scene.style.setProperty("--scene-progress", progress.toFixed(3));
      scene.dataset.progress = String(Math.round(progress * 100));
      const phases = [...scene.querySelectorAll("[data-phase]")];
      phases.forEach((phase, index) => phase.classList.toggle("active", progress >= index / Math.max(1, phases.length)));
    });
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking && !reduceMotion.matches) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener("resize", update, { passive: true });
  update();
}

function initFallAnimation() {
  const diagram = document.querySelector(".fall-diagram");
  if (!diagram || reduceMotion.matches) return;
  let visible = !("IntersectionObserver" in window);
  let timer;
  const stop = () => {
    window.clearTimeout(timer);
    diagram.classList.remove("is-running");
  };
  const run = () => {
    if (!visible || document.hidden) return;
    diagram.classList.remove("is-running");
    void diagram.offsetWidth;
    if (!visible || document.hidden) return;
    diagram.classList.add("is-running");
    timer = window.setTimeout(run, 7450);
  };
  const sync = () => {
    stop();
    if (visible && !document.hidden) run();
  };
  if (!("IntersectionObserver" in window)) {
    run();
    document.addEventListener("visibilitychange", sync);
    return;
  }
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }, { rootMargin: "5% 0px", threshold: .12 });
  observer.observe(diagram);
  document.addEventListener("visibilitychange", sync);
}

function initRescueAnimation() {
  const diagram = document.querySelector(".rescue-diagram");
  if (!diagram || reduceMotion.matches) return;
  let visible = !("IntersectionObserver" in window);
  let timer;
  const stop = () => {
    window.clearTimeout(timer);
    diagram.classList.remove("is-running");
  };
  const run = () => {
    if (!visible || document.hidden) return;
    diagram.classList.remove("is-running");
    void diagram.offsetWidth;
    if (!visible || document.hidden) return;
    diagram.classList.add("is-running");
    timer = window.setTimeout(run, 7000);
  };
  const sync = () => {
    stop();
    if (visible && !document.hidden) run();
  };
  if (!("IntersectionObserver" in window)) {
    run();
    document.addEventListener("visibilitychange", sync);
    return;
  }
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }, { rootMargin: "5% 0px", threshold: .12 });
  observer.observe(diagram);
  document.addEventListener("visibilitychange", sync);
}

function initUniquestAnimation() {
  const diagram = document.querySelector(".uniquest-diagram");
  if (!diagram || reduceMotion.matches) return;
  let visible = !("IntersectionObserver" in window);
  let timer;
  const stop = () => {
    window.clearTimeout(timer);
    diagram.classList.remove("is-running");
  };
  const run = () => {
    if (!visible || document.hidden) return;
    diagram.classList.remove("is-running");
    void diagram.offsetWidth;
    if (!visible || document.hidden) return;
    diagram.classList.add("is-running");
    timer = window.setTimeout(run, 7200);
  };
  const sync = () => {
    stop();
    if (visible && !document.hidden) run();
  };
  if (!("IntersectionObserver" in window)) {
    run();
    document.addEventListener("visibilitychange", sync);
    return;
  }
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }, { rootMargin: "5% 0px", threshold: .12 });
  observer.observe(diagram);
  document.addEventListener("visibilitychange", sync);
}

function initKmapAnimation() {
  const diagram = document.querySelector("[data-kmap-animation]");
  if (!diagram) return;
  const examples = [
    {
      mode: "SOP", ones: [2, 3, 7], canonical: "Σm(2,3,7)", expression: "F = A′B + BC",
      summary: "Σm(2,3,7) → TWO GROUPS → TWO TERMS", primary: "m2 + m3 → A′B", secondary: "m3 + m7 → BC",
      switches: "SW2, SW3, SW7", groupAction: "Group adjacent 1s", live: "Example 1: SOP groups minterms 2, 3, and 7 to produce A prime B plus BC."
    },
    {
      mode: "POS", ones: [0, 1, 4, 5], canonical: "ΠM(2,3,6,7)", expression: "F = B′",
      summary: "ΠM(2,3,6,7) → GROUP FOUR 0s → ONE SUM TERM", primary: "M2 · M3 · M6 · M7 → B′", secondary: "",
      switches: "SW0, SW1, SW4, SW5", groupAction: "Group adjacent 0s", live: "Example 2: POS groups maxterms 2, 3, 6, and 7 to produce B prime."
    },
    {
      mode: "SOP", ones: [0, 2, 4, 6], canonical: "Σm(0,2,4,6)", expression: "F = C′",
      summary: "Σm(0,2,4,6) → WRAP-AROUND QUAD → ONE TERM", primary: "m0 + m2 + m4 + m6 → C′", secondary: "",
      switches: "SW0, SW2, SW4, SW6", groupAction: "Group adjacent 1s", live: "Example 3: SOP groups edge-adjacent minterms 0, 2, 4, and 6 to produce C prime."
    }
  ];
  const switches = [...diagram.querySelectorAll("[data-kmap-switch]")];
  const cells = [...diagram.querySelectorAll("[data-kmap-layout]")];
  const desktopGroups = [...diagram.querySelectorAll("[data-kmap-group-set]")];
  const mobileGroups = [...diagram.querySelectorAll("[data-kmap-mobile-group-set]")];
  const live = diagram.querySelector("[data-kmap-live]");
  const primaryLegend = diagram.querySelector("[data-kmap-legend-primary]");
  const secondaryLegend = diagram.querySelector("[data-kmap-legend-secondary]");
  let current = 0;
  let inView = false;
  let timer;
  let changeTimer;

  const setText = (selector, value) => diagram.querySelectorAll(selector).forEach((node) => { node.textContent = value; });
  const render = (index, announce = false) => {
    const example = examples[index];
    const active = new Set(example.ones);
    current = index;
    diagram.dataset.kmapState = String(index);
    switches.forEach((item) => {
      const minterm = Number(item.dataset.kmapSwitch);
      const on = active.has(minterm);
      item.classList.toggle("is-on", on);
      const value = item.querySelector("[data-kmap-switch-value]");
      if (value) value.textContent = `m${minterm} · ${on ? 1 : 0}`;
    });
    cells.forEach((cell) => {
      const minterm = Number(cell.dataset.minterm);
      const on = active.has(minterm);
      cell.dataset.value = on ? "1" : "0";
      cell.classList.toggle("is-one", on);
      const value = cell.querySelector(".kmap-value, b");
      if (value) value.textContent = on ? "1" : "0";
    });
    desktopGroups.forEach((group, groupIndex) => group.classList.toggle("is-current", groupIndex === index));
    mobileGroups.forEach((group, groupIndex) => group.classList.toggle("is-current", groupIndex === index));
    diagram.querySelectorAll("[data-kmap-mode]").forEach((control) => control.classList.toggle("is-selected", control.dataset.kmapMode === example.mode.toLowerCase()));
    setText("[data-kmap-canonical]", example.canonical);
    setText("[data-kmap-expression]", example.expression);
    setText("[data-kmap-summary]", example.summary);
    setText("[data-kmap-mobile-expression]", example.expression);
    setText("[data-kmap-mobile-switches]", example.switches);
    setText("[data-kmap-mobile-canonical]", example.canonical);
    setText("[data-kmap-group-action]", example.groupAction);
    if (primaryLegend) primaryLegend.textContent = example.primary;
    if (secondaryLegend) {
      secondaryLegend.textContent = example.secondary;
      secondaryLegend.closest("span").hidden = !example.secondary;
    }
    if (announce && live) live.textContent = example.live;
  };
  const clearCycle = () => { window.clearTimeout(timer); timer = undefined; };
  const schedule = (delay = 5600) => {
    clearCycle();
    if (!inView || document.hidden || reduceMotion.matches) return;
    timer = window.setTimeout(() => select((current + 1) % examples.length), delay);
  };
  const select = (index) => {
    window.clearTimeout(changeTimer);
    clearCycle();
    if (index === current) {
      schedule();
      return;
    }
    diagram.classList.add("is-changing");
    changeTimer = window.setTimeout(() => {
      render(index);
      diagram.classList.remove("is-changing");
      schedule();
    }, reduceMotion.matches ? 0 : 320);
  };

  render(0);
  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    diagram.classList.add("is-assembled");
    return;
  }
  const observer = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) {
      diagram.classList.add("is-assembled");
      schedule(diagram.dataset.kmapStarted ? 2200 : 4800);
      diagram.dataset.kmapStarted = "true";
    } else clearCycle();
  }, { rootMargin: "10% 0px", threshold: .12 });
  observer.observe(diagram);
  document.addEventListener("visibilitychange", () => document.hidden ? clearCycle() : schedule(1800));
}

function initTimeline() {
  const timeline = document.querySelector("[data-timeline]");
  const entries = [...document.querySelectorAll("[data-timeline-entry]")];
  if (!timeline || !entries.length) return;
  const observer = new IntersectionObserver((items) => {
    items.forEach((item) => item.target.classList.toggle("is-active", item.isIntersecting));
  }, { rootMargin: "-28% 0px -38%", threshold: .1 });
  entries.forEach((entry) => observer.observe(entry));
  entries[0].classList.add("is-active");

  let ticking = false;
  const update = () => {
    const rect = timeline.getBoundingClientRect();
    const progress = clamp((innerHeight * .48 - rect.top) / Math.max(1, rect.height - innerHeight * .4));
    timeline.style.setProperty("--timeline-progress", `${progress * 100}%`);
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking && !reduceMotion.matches) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
}

function initScrapbook() {
  if (reduceMotion.matches || !matchMedia("(pointer:fine)").matches) return;
  document.querySelectorAll(".scrap-media").forEach((media) => {
    media.addEventListener("pointermove", (event) => {
      const rect = media.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      media.style.translate = `${x * 7}px ${y * 7}px`;
    });
    media.addEventListener("pointerleave", () => { media.style.translate = ""; });
  });
}

document.querySelectorAll("[data-year]").forEach((node) => { node.textContent = String(new Date().getFullYear()); });
initEntry();
initNavigation();
initPageTransitions();
initReveals();
initSystemSketch();
initProjectScenes();
initFallAnimation();
initRescueAnimation();
initUniquestAnimation();
initKmapAnimation();
initTimeline();
initScrapbook();
