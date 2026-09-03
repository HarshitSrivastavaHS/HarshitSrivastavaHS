document.documentElement.classList.add("js");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function initNavigation() {
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  if (!header || !toggle || !nav) return;

  const label = toggle.querySelector(".sr-only");
  const closeMenu = (returnFocus = false) => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    label.textContent = "Open menu";
    if (returnFocus) toggle.focus();
  };

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    label.textContent = open ? "Close menu" : "Open menu";
    if (open) nav.querySelector("a")?.focus();
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) closeMenu(true);
  });

  document.addEventListener("click", (event) => {
    if (nav.classList.contains("is-open") && !header.contains(event.target)) closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 820) closeMenu();
  }, { passive: true });
}

function initSectionTracking() {
  const header = document.querySelector("[data-header]");
  const sections = [...document.querySelectorAll("[data-observe-section]")];
  const links = [...document.querySelectorAll("[data-section-link]")];
  const navLinks = [...document.querySelectorAll(".site-nav a[href^='#']")];
  const progress = document.querySelector("[data-progress-fill]");
  if (!sections.length) return;

  const setActive = (id) => {
    links.forEach((link) => link.classList.toggle("is-active", link.dataset.sectionLink === id));
    navLinks.forEach((link) => {
      const active = link.hash === `#${id}`;
      if (active) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  };

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setActive(visible.target.id);
  }, { rootMargin: "-20% 0px -62% 0px", threshold: [0, .1, .3, .6] });

  sections.forEach((section) => observer.observe(section));
  setActive("home");

  let ticking = false;
  const update = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const amount = scrollable > 0 ? window.scrollY / scrollable : 0;
    if (progress) progress.style.height = `${clamp(amount) * 100}%`;
    header?.classList.toggle("is-scrolled", window.scrollY > 24);
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  update();
}

function initHeroSystem() {
  const buttons = [...document.querySelectorAll("[data-domain]")];
  const nodes = [...document.querySelectorAll("[data-system-node]")];
  const label = document.querySelector("[data-system-label]");
  const system = document.querySelector("[data-hero-system]");
  const schematic = system?.querySelector("svg");
  if (!buttons.length || !system) return;

  const names = {
    embedded: "Embedded systems",
    robotics: "Robotics & autonomy",
    electronics: "Electronics & PCB",
    software: "Engineering software"
  };

  const activate = (domain) => {
    buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.domain === domain)));
    nodes.forEach((node) => node.classList.toggle("is-active", node.dataset.systemNode === domain));
    if (label) label.textContent = names[domain];
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => activate(button.dataset.domain));
    button.addEventListener("mouseenter", () => activate(button.dataset.domain));
    button.addEventListener("focus", () => activate(button.dataset.domain));
  });

  if (schematic && typeof schematic.pauseAnimations === "function") {
    const motionObserver = new IntersectionObserver(([entry]) => {
      if (reduceMotion.matches || document.hidden || !entry.isIntersecting) schematic.pauseAnimations();
      else schematic.unpauseAnimations();
    }, { threshold: .05 });
    motionObserver.observe(system);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) schematic.pauseAnimations();
      else if (!reduceMotion.matches) schematic.unpauseAnimations();
    });
  }
}

function initExperienceTimeline() {
  const section = document.querySelector("#experience");
  const entries = [...document.querySelectorAll("[data-experience-entry]")];
  if (!section || !entries.length) return;

  const observer = new IntersectionObserver((items) => {
    items.forEach((item) => item.target.classList.toggle("is-active", item.isIntersecting));
  }, { rootMargin: "-25% 0px -40% 0px", threshold: .15 });
  entries.forEach((entry) => observer.observe(entry));
  entries[0].classList.add("is-active");

  let ticking = false;
  const update = () => {
    const rect = section.getBoundingClientRect();
    const distance = Math.max(1, rect.height - window.innerHeight * .65);
    const passed = window.innerHeight * .45 - rect.top;
    section.style.setProperty("--timeline-progress", `${clamp(passed / distance) * 100}%`);
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
}

function initWorkStory() {
  const story = document.querySelector("[data-work-story]");
  const stage = document.querySelector("[data-work-stage]");
  const track = document.querySelector("[data-work-track]");
  const projects = [...document.querySelectorAll("[data-project]")];
  const counter = document.querySelector("[data-work-count]");
  if (!story || !stage || !track || projects.length < 2) return;

  const query = window.matchMedia("(min-width: 1024px) and (min-height: 650px)");
  let enabled = false;
  let start = 0;
  let distance = 1;
  let ticking = false;

  const updatePosition = () => {
    if (!enabled) return;
    const amount = clamp((window.scrollY - start) / distance);
    track.style.transform = `translate3d(${-amount * distance}px, 0, 0)`;
    story.style.setProperty("--work-progress", `${amount * 100}%`);
    const index = Math.min(projects.length - 1, Math.round(amount * (projects.length - 1)));
    if (counter) counter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(projects.length).padStart(2, "0")}`;
    ticking = false;
  };

  const measure = () => {
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
    const shouldEnable = query.matches && !coarsePointer && !reduceMotion.matches;
    if (!shouldEnable) {
      enabled = false;
      story.classList.remove("is-enhanced");
      story.style.height = "";
      story.style.removeProperty("--work-progress");
      track.style.transform = "";
      if (counter) counter.textContent = `01 / ${String(projects.length).padStart(2, "0")}`;
      return;
    }

    enabled = true;
    story.classList.add("is-enhanced");
    story.style.height = "";
    distance = Math.max(1, track.scrollWidth - window.innerWidth);
    const storyTop = story.getBoundingClientRect().top + window.scrollY;
    start = storyTop + stage.offsetTop;
    story.style.height = `${stage.offsetTop + window.innerHeight + distance}px`;
    updatePosition();
  };

  window.addEventListener("scroll", () => {
    if (enabled && !ticking) { ticking = true; requestAnimationFrame(updatePosition); }
  }, { passive: true });

  let resizeFrame;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(measure);
  }, { passive: true });
  query.addEventListener?.("change", measure);
  reduceMotion.addEventListener?.("change", measure);
  window.addEventListener("load", measure, { once: true });
  measure();
}

function initSkillEvidence() {
  const buttons = [...document.querySelectorAll("[data-skill]")];
  if (!buttons.length) return;
  let clearTimer;

  const highlight = (tag, source) => {
    buttons.forEach((button) => button.classList.toggle("is-active", button === source));
    const related = [...document.querySelectorAll(`[data-tags~="${tag}"]`)];
    related.forEach((item) => {
      item.classList.remove("skill-related");
      void item.offsetWidth;
      item.classList.add("skill-related");
    });
    window.clearTimeout(clearTimer);
    clearTimer = window.setTimeout(() => {
      related.forEach((item) => item.classList.remove("skill-related"));
      buttons.forEach((button) => button.classList.remove("is-active"));
    }, 1600);
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => highlight(button.dataset.skill, button));
    button.addEventListener("mouseenter", () => highlight(button.dataset.skill, button));
    button.addEventListener("focus", () => highlight(button.dataset.skill, button));
  });
}

function setCurrentYear() {
  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
}

initNavigation();
initSectionTracking();
initHeroSystem();
initExperienceTimeline();
initWorkStory();
initSkillEvidence();
setCurrentYear();
