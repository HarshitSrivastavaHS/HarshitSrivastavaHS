const page = document.body.dataset.page;

async function loadSiteData() {
  const response = await fetch("data/site.json");
  if (!response.ok) throw new Error("Failed to load site content.");
  return response.json();
}

function setHTML(selector, html) {
  const node = document.querySelector(selector);
  if (node) node.innerHTML = html;
}

function initCustomCursor() {
  if (!window.matchMedia("(pointer: fine)").matches) return;

  const ring = document.createElement("div");
  ring.className = "theme-cursor";
  const dot = document.createElement("div");
  dot.className = "theme-cursor-dot";
  document.body.append(ring, dot);

  let visible = false;
  let x = 0;
  let y = 0;

  function placeCursor() {
    ring.style.setProperty("--cursor-x", `${x - 14}px`);
    ring.style.setProperty("--cursor-y", `${y - 14}px`);
    dot.style.setProperty("--cursor-dot-x", `${x - 4}px`);
    dot.style.setProperty("--cursor-dot-y", `${y - 4}px`);
  }

  function burstParticles() {
    const colors = ["var(--yellow)", "var(--blue)", "var(--mint)", "var(--peach)"];
    for (let i = 0; i < 6; i += 1) {
      const particle = document.createElement("span");
      particle.className = "cursor-burst";
      particle.style.setProperty("--burst-x", `${x}px`);
      particle.style.setProperty("--burst-y", `${y}px`);
      particle.style.setProperty("--burst-dx", `${(Math.random() - 0.5) * 42}px`);
      particle.style.setProperty("--burst-dy", `${-12 - Math.random() * 24}px`);
      particle.style.setProperty("--burst-color", colors[i % colors.length]);
      document.body.append(particle);
      window.setTimeout(() => particle.remove(), 700);
    }
  }

  window.addEventListener("mousemove", (event) => {
    if (!visible) {
      ring.classList.add("is-visible");
      dot.classList.add("is-visible");
      visible = true;
    }
    x = event.clientX;
    y = event.clientY;
    placeCursor();
  });

  window.addEventListener("mousedown", () => ring.classList.add("is-pressed"));
  window.addEventListener("mouseup", () => ring.classList.remove("is-pressed"));
  window.addEventListener("click", burstParticles);
  document.addEventListener("mouseover", (event) => {
    if (event.target.closest("a, button")) {
      ring.classList.add("is-hovering");
    }
  });
  document.addEventListener("mouseout", (event) => {
    if (event.target.closest("a, button")) {
      ring.classList.remove("is-hovering");
    }
  });
}

function renderNav(data) {
  setHTML("[data-nav]", `
    <div class="topbar-inner">
      <a class="brand" href="index.html">
        <span class="brand-orb" aria-hidden="true"></span>
        <span class="brand-copy">
          <strong>${data.profile.name}</strong>
          <span>${data.profile.shortRole}</span>
        </span>
      </a>
      <nav class="nav-links" aria-label="Primary">
        ${data.navigation.map((item) => `
          <a class="${item.page === page ? "active" : ""}" href="${item.href}">${item.label}</a>
        `).join("")}
      </nav>
    </div>
  `);
}

function renderFooter(data) {
  setHTML("[data-footer]", `
    <div class="panel-inner">
      <div class="panel-left">
        <a class="panel-pill" href="index.html">Home</a>
        <a class="panel-pill" href="projects.html">Projects</a>
        <a class="panel-pill" href="posters.html">Posters</a>
      </div>
      <div class="panel-right">
        <a class="panel-pill" href="${data.contact.links[0].href}" target="_blank" rel="noreferrer">${data.contact.links[0].label}</a>
        <a class="panel-pill" href="${data.contact.links[1].href}" target="_blank" rel="noreferrer">${data.contact.links[1].label}</a>
      </div>
    </div>
  `);
}

function renderHomeIntro(data) {
  setHTML("[data-home-intro]", `
    <article class="intro-card">
      <div class="intro-copy">
        <h1>${data.home.title}</h1>
        <p>${data.home.subtitle}</p>
        <div class="intro-actions">
          <a class="button button--primary" href="projects.html">${data.home.ctaPrimary}</a>
          <a class="button button--glass" href="${data.contact.links[0].href}" target="_blank" rel="noreferrer">${data.home.ctaSecondary}</a>
        </div>
      </div>
      <div class="note-stack">
        ${data.home.notes.map((item) => `
          <article class="desktop-note">
            <span class="note-icon note-icon--${item.icon}" aria-hidden="true"></span>
            <p>${item.detail}</p>
          </article>
        `).join("")}
      </div>
    </article>
  `);
}

function sectionCard(item) {
  if (item.type === "text") {
    return `
      <article class="list-card">
        <h3>${item.title}</h3>
        <p>${item.body}</p>
      </article>
    `;
  }

  if (item.type === "list") {
    return `
      <article class="list-card">
        <h3>${item.title}</h3>
        ${item.body ? `<p>${item.body}</p>` : ""}
        <ul>${item.items.map((entry) => `<li>${entry}</li>`).join("")}</ul>
      </article>
    `;
  }

  if (item.type === "links") {
    return `
      <article class="list-card">
        <h3>${item.title}</h3>
        <p>${item.body}</p>
        <div class="mini-links">
          ${item.items.map((entry) => `<a class="mini-link" href="${entry.href}" ${entry.external ? 'target="_blank" rel="noreferrer"' : ""}>${entry.label}</a>`).join("")}
        </div>
      </article>
    `;
  }

  if (item.type === "folderlink") {
    return `
      <article class="folder-link-card">
        <button class="folder-link-folder" type="button" data-folder-target="${item.targetId}">
          <span class="folder-link-icon" aria-hidden="true"></span>
          <span class="folder-link-copy">
            <h3>${item.title}</h3>
            <p>${item.body}</p>
          </span>
        </button>
      </article>
    `;
  }

  return "";
}

function renderExplorer(data) {
  const root = document.querySelector("[data-home-workspace]");
  if (!root) return;

  const folders = data.explorer.folders;
  const allFolders = [data.explorer.projectLinksFolder, ...folders];
  const homeId = "home";
  const projectLinksFolder = data.explorer.projectLinksFolder;
  const parentMap = {
    [projectLinksFolder.id]: "projects"
  };

  function folderHTML(folder) {
    return `
      <div class="folder-hero">
        <div>
          <h2>${folder.title}</h2>
          <p class="folder-summary">${folder.summary}</p>
        </div>
        <div class="folder-hero-card folder-hero-art folder-hero-art--${folder.artClass || "system"}" aria-hidden="true"></div>
      </div>
      <div class="folder-grid ${folder.columns ? `columns-${folder.columns}` : "columns-2"}">
        ${folder.cards.map(sectionCard).join("")}
      </div>
    `;
  }

  function homeHTML() {
    return `
      <div class="folder-hero folder-hero--home">
        <div>
          <h2>Home</h2>
          <p class="folder-summary">Open a folder to look around.</p>
        </div>
        <div class="folder-hero-card folder-hero-art folder-hero-art--home" aria-hidden="true"></div>
      </div>
      <div class="home-folder-grid">
        ${folders.map((folder) => `
          <button class="home-folder-card" type="button" data-folder-target="${folder.id}">
            <span class="home-folder-card-icon home-folder-card-icon--${folder.artClass || "system"}" aria-hidden="true"></span>
            <strong>${folder.label}</strong>
            <span>${folder.short}</span>
          </button>
        `).join("")}
      </div>
    `;
  }

  root.innerHTML = `
    <section class="explorer-window explorer-window--desktop">
      <div class="window-top">
        <div class="traffic" aria-hidden="true"><span></span><span></span><span></span></div>
        <div class="window-title">
          <strong>Dolphin</strong>
          <span>portfolio</span>
        </div>
        <div class="window-tools">Harshit</div>
      </div>
      <div class="window-toolbar">
        <div class="toolbar-group">
          <button class="toolbar-button" type="button" aria-label="Back" data-desktop-back hidden>←</button>
          <button class="toolbar-button" type="button" aria-label="Forward">→</button>
          <button class="toolbar-button" type="button" aria-label="Up">↑</button>
        </div>
        <div class="breadcrumb" data-breadcrumb>${data.explorer.path}/home</div>
        <div class="toolbar-search">Search</div>
      </div>
      <div class="window-body">
        <aside class="window-sidebar">
          <div class="sidebar-heading">Places</div>
          <div class="sidebar-group" data-sidebar-items></div>
        </aside>
        <div class="window-content">
          <div class="folder-strip" data-folder-strip></div>
          <div data-folder-content></div>
        </div>
      </div>
    </section>
    <section class="mobile-explorer" aria-label="Mobile sections">
      <div class="mobile-window">
        <div class="mobile-window-top">
          <button class="mobile-back" type="button" data-mobile-back hidden>← Back</button>
          <div class="mobile-window-title">
            <strong>Dolphin</strong>
            <span data-mobile-title>portfolio</span>
          </div>
        </div>
        <div class="mobile-window-body">
          <div class="mobile-folder-list" data-mobile-list>
            ${folders.map((folder) => `
              <button class="mobile-folder-row" type="button" data-mobile-open="${folder.id}">
                <span class="mobile-folder-icon mobile-folder-icon--${folder.artClass || "system"}" aria-hidden="true"></span>
                <span class="mobile-folder-copy">
                  <strong>${folder.label}</strong>
                  <span>${folder.summary}</span>
                </span>
                <span class="mobile-folder-arrow" aria-hidden="true">open</span>
              </button>
            `).join("")}
          </div>
          <div class="mobile-folder-detail" data-mobile-detail hidden></div>
        </div>
      </div>
    </section>
  `;

  const sidebar = root.querySelector("[data-sidebar-items]");
  const content = root.querySelector("[data-folder-content]");
  const strip = root.querySelector("[data-folder-strip]");
  const desktopBack = root.querySelector("[data-desktop-back]");
  const breadcrumb = root.querySelector("[data-breadcrumb]");
  const mobileList = root.querySelector("[data-mobile-list]");
  const mobileDetail = root.querySelector("[data-mobile-detail]");
  const mobileBack = root.querySelector("[data-mobile-back]");
  const mobileTitle = root.querySelector("[data-mobile-title]");
  let activeId = homeId;
  let mobileActiveId = null;

  function renderSidebar() {
    sidebar.innerHTML = `
      <button class="sidebar-item ${activeId === homeId ? "is-active" : ""}" type="button" data-folder-target="${homeId}">
        <span class="folder-dot folder-dot--home" aria-hidden="true"></span>
        <span>
          <strong>Home</strong>
          <span>portfolio</span>
        </span>
      </button>
      ${folders.map((folder) => `
      <button class="sidebar-item sidebar-item--child ${folder.id === activeId ? "is-active" : ""}" type="button" data-folder-target="${folder.id}">
        <span class="folder-dot" aria-hidden="true"></span>
        <span>
          <strong>${folder.label}</strong>
          <span>${folder.short}</span>
        </span>
      </button>
      ${folder.id === "projects" ? `
      <button class="sidebar-item sidebar-item--child sidebar-item--grandchild ${projectLinksFolder.id === activeId ? "is-active" : ""}" type="button" data-folder-target="${projectLinksFolder.id}">
        <span class="folder-dot folder-dot--mini" aria-hidden="true"></span>
        <span>
          <strong>${projectLinksFolder.label}</strong>
          <span>${projectLinksFolder.short}</span>
        </span>
      </button>` : ""}
    `).join("")}
    `;
  }

  function renderStrip() {
    if (activeId === homeId) {
      strip.innerHTML = "";
      strip.hidden = true;
      return;
    }
    strip.hidden = true;
    strip.innerHTML = "";
  }

  function renderContent() {
    if (activeId === homeId) {
      content.innerHTML = homeHTML();
      desktopBack.hidden = true;
      desktopBack.classList.remove("is-active");
      breadcrumb.textContent = `${data.explorer.path}/home`;
      return;
    }
    const folder = allFolders.find((entry) => entry.id === activeId) || folders[0];
    content.innerHTML = folderHTML(folder);
    desktopBack.hidden = false;
    desktopBack.classList.add("is-active");
    breadcrumb.textContent = `${data.explorer.path}/home/${folder.id}`;
  }

  function activate(id) {
    activeId = id;
    renderSidebar();
    renderStrip();
    renderContent();
  }

  function getFolderById(id) {
    return allFolders.find((entry) => entry.id === id) || folders[0];
  }

  function parentIdOf(id) {
    return parentMap[id] || homeId;
  }

  function openMobileFolder(id) {
    const folder = getFolderById(id);
    mobileActiveId = folder.id;
    mobileDetail.innerHTML = folderHTML(folder);
    mobileList.hidden = true;
    mobileDetail.hidden = false;
    mobileBack.hidden = false;
    mobileTitle.textContent = folder.label;
  }

  function showMobileHome() {
    mobileActiveId = null;
    mobileList.hidden = false;
    mobileDetail.hidden = true;
    mobileBack.hidden = true;
    mobileTitle.textContent = "portfolio";
  }

  renderSidebar();
  renderStrip();
  renderContent();

  root.addEventListener("click", (event) => {
    const target = event.target.closest("[data-folder-target]");
    if (target && root.contains(target)) {
      const targetId = target.dataset.folderTarget;
      if (window.matchMedia("(max-width: 720px)").matches) {
        openMobileFolder(targetId);
      } else {
        activate(targetId);
      }
      return;
    }

    const backDesktop = event.target.closest("[data-desktop-back]");
    if (backDesktop && root.contains(backDesktop)) {
      activate(parentIdOf(activeId));
      return;
    }

    const mobileOpen = event.target.closest("[data-mobile-open]");
    if (mobileOpen && root.contains(mobileOpen)) {
      openMobileFolder(mobileOpen.dataset.mobileOpen);
      return;
    }

    const back = event.target.closest("[data-mobile-back]");
    if (!back || !root.contains(back)) return;
    if (!mobileActiveId) {
      showMobileHome();
      return;
    }
    const parentId = parentIdOf(mobileActiveId);
    if (parentId === homeId) {
      showMobileHome();
      return;
    }
    openMobileFolder(parentId);
  });
}

function renderPageHero(selector, title, text) {
  setHTML(selector, `
    <article class="page-header-card">
      <h1>${title}</h1>
      <p>${text}</p>
    </article>
  `);
}

function renderProjects(data) {
  renderPageHero(
    "[data-projects-hero]",
    data.projects.pageTitle,
    data.projects.pageIntro
  );

  setHTML("[data-project-gallery]", data.projects.items.map((project) => `
    <article class="project-card">
      <div class="project-card-visual" aria-hidden="true"></div>
      <div class="project-card-body">
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        ${project.link ? `<div class="mini-links"><a class="mini-link" href="${project.link.href}" target="_blank" rel="noreferrer">${project.link.label}</a></div>` : ""}
      </div>
    </article>
  `).join(""));

  setHTML("[data-web-links]", data.projects.websites.map((site) => `
    <a class="link-tile" href="${site.href}" target="_blank" rel="noreferrer">
      <h3>${site.title}</h3>
      <p>${site.description}</p>
    </a>
  `).join(""));
}

function renderPosters(data) {
  renderPageHero(
    "[data-posters-hero]",
    data.posters.pageTitle,
    data.posters.pageIntro
  );

  setHTML("[data-poster-gallery]", data.posters.items.map((poster) => `
    <article class="poster-card">
      <figure>
        <img src="${poster.image}" alt="${poster.title}">
        <figcaption>
          <h3>${poster.title}</h3>
          <p>${poster.caption}</p>
        </figcaption>
      </figure>
    </article>
  `).join(""));
}

loadSiteData()
  .then((data) => {
    initCustomCursor();
    renderNav(data);
    renderFooter(data);

    if (page === "home") {
      renderHomeIntro(data);
      renderExplorer(data);
    }

    if (page === "projects") renderProjects(data);
    if (page === "posters") renderPosters(data);
  })
  .catch((error) => {
    document.body.innerHTML = `<main style="padding:2rem;font-family:sans-serif;">${error.message}</main>`;
    throw error;
  });
