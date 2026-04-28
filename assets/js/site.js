const page = document.body.dataset.page;

const ROOT_ID = "__root__";

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
    for (let i = 0; i < 10; i += 1) {
      const particle = document.createElement("span");
      particle.className = "cursor-burst";
      particle.style.setProperty("--burst-x", `${x}px`);
      particle.style.setProperty("--burst-y", `${y}px`);
      particle.style.setProperty("--burst-dx", `${(Math.random() - 0.5) * 64}px`);
      particle.style.setProperty("--burst-dy", `${-18 - Math.random() * 34}px`);
      particle.style.setProperty("--burst-color", colors[i % colors.length]);
      document.body.append(particle);
      window.setTimeout(() => particle.remove(), 820);
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
    if (event.target.closest("a, button")) ring.classList.add("is-hovering");
  });
  document.addEventListener("mouseout", (event) => {
    if (event.target.closest("a, button")) ring.classList.remove("is-hovering");
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

function renderLinks(items = []) {
  if (!items.length) return "";
  return `
    <div class="mini-links">
      ${items.map((entry) => `
        <a class="mini-link" href="${entry.href}" ${entry.external !== false ? 'target="_blank" rel="noreferrer"' : ""}>${entry.label}</a>
      `).join("")}
    </div>
  `;
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
        ${item.title ? `<h3>${item.title}</h3>` : ""}
        ${item.body ? `<p>${item.body}</p>` : ""}
        ${renderLinks(item.items)}
      </article>
    `;
  }

  if (item.type === "cta") {
    return `
      <article class="list-card list-card--cta">
        <div class="cta-illustration" aria-hidden="true"></div>
        <h3>${item.title}</h3>
        <p>${item.body}</p>
        ${renderLinks(item.items)}
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

  if (item.type === "project") {
    const links = item.links || [];
    const visual = item.media?.image
      ? `<img src="${item.media.image}" alt="${item.title}">`
      : "";

    return `
      <article class="project-card">
        <div class="project-card-visual" aria-hidden="true">${visual}</div>
        <div class="project-card-body">
          <h3>${item.title}</h3>
          ${item.category ? `<p>${item.category}</p>` : ""}
          <p>${item.description}</p>
          ${item.technologies?.length ? `
            <div class="project-skills">
              ${item.technologies.slice(0, 4).map((tech) => `<span class="skill-chip">${tech}</span>`).join("")}
            </div>
          ` : ""}
          ${renderLinks(links)}
        </div>
      </article>
    `;
  }

  if (item.type === "poster") {
    return `
      <article class="poster-card">
        <figure>
          <img src="${item.image}" alt="${item.title}">
          <figcaption>
            <h3>${item.title}</h3>
            <p>${item.caption}</p>
          </figcaption>
        </figure>
      </article>
    `;
  }

  return "";
}

function buildProjectCard(project) {
  return {
    type: "project",
    title: project.title,
    category: project.category,
    description: project.description,
    technologies: project.technologies,
    links: project.links || (project.link ? [project.link] : []),
    media: project.media
  };
}

function buildHomeExplorerModel(data) {
  const folders = data.explorer.folders.map((folder) => ({ ...folder }));
  const recentProjects = data.projects.items.slice(0, data.explorer.recentProjectCount || 3).map(buildProjectCard);
  const projectFolder = folders.find((folder) => folder.id === "projects");

  if (projectFolder) {
    projectFolder.cards = [
      ...recentProjects,
      {
        type: "cta",
        title: data.explorer.projectPageLink.label,
        body: "Open the full project catalogue.",
        items: [
          {
            label: data.explorer.projectPageLink.label,
            href: data.explorer.projectPageLink.href,
            external: data.explorer.projectPageLink.external
          }
        ]
      }
    ];
  }

  return {
    title: "Home",
    subtitle: "portfolio",
    path: `${data.explorer.path}/home`,
    backHref: null,
    rootTitle: "Home",
    rootSummary: "Open a folder to look around.",
    rootArtClass: "home",
    rootShort: "portfolio",
    folders
  };
}

function buildProjectsExplorerModel(data) {
  return {
    title: "Projects",
    subtitle: "catalogue",
    path: `${data.explorer.path}/projects`,
    backHref: "index.html",
    rootTitle: "Projects",
    rootSummary: "Open a category folder.",
    rootArtClass: "projects",
    rootShort: "all folders",
    folders: data.projects.categories.map((category) => ({
      id: category.id,
      label: category.label,
      short: category.short,
      title: category.label,
      summary: category.summary,
      artClass: category.artClass || "projects",
      columns: 2,
      cards: data.projects.items
        .filter((project) => (project.categories || []).includes(category.id))
        .map(buildProjectCard)
    }))
  };
}

function buildPostersExplorerModel(data) {
  return {
    title: "Posters",
    subtitle: "archive",
    path: `${data.explorer.path}/posters`,
    backHref: "index.html",
    rootTitle: "Posters",
    rootSummary: "Open a folder.",
    rootArtClass: "posters",
    rootShort: "visual work",
    folders: data.posters.folders.map((folder) => ({
      ...folder,
      columns: 2,
      cards: data.posters.items
        .slice(0, folder.limit || data.posters.items.length)
        .map((poster) => ({
          type: "poster",
          title: poster.title,
          caption: poster.caption,
          image: poster.image
        }))
    }))
  };
}

function breadcrumbForPath(model, foldersById, folderId) {
  const segments = [model.path];
  if (folderId !== ROOT_ID) {
    const chain = [];
    let current = foldersById.get(folderId);
    while (current) {
      chain.unshift(current.id);
      current = current.parentId ? foldersById.get(current.parentId) : null;
    }
    segments.push(...chain);
  }
  return segments.join("/");
}

function topLevelFolders(model) {
  return model.folders.filter((folder) => !folder.parentId);
}

function childFolders(model, parentId) {
  return model.folders.filter((folder) => (folder.parentId || ROOT_ID) === parentId);
}

function folderTilesHTML(folders) {
  return `
    <div class="home-folder-grid">
      ${folders.map((folder) => `
        <button class="home-folder-card" type="button" data-folder-target="${folder.id}">
          <span class="home-folder-card-icon home-folder-card-icon--${folder.artClass || "system"}" aria-hidden="true"></span>
          <strong>${folder.label}</strong>
          <span>${folder.short || folder.summary}</span>
        </button>
      `).join("")}
    </div>
  `;
}

function folderViewHTML(folder, model) {
  const nestedFolders = childFolders(model, folder.id);
  return `
    <div class="folder-hero">
      <div>
        <h2>${folder.title}</h2>
        <p class="folder-summary">${folder.summary}</p>
      </div>
      <div class="folder-hero-card folder-hero-art folder-hero-art--${folder.artClass || "system"}" aria-hidden="true"></div>
    </div>
    ${nestedFolders.length ? folderTilesHTML(nestedFolders) : ""}
    ${folder.cards?.length ? `
      <div class="folder-grid ${folder.columns ? `columns-${folder.columns}` : "columns-2"}">
        ${folder.cards.map(sectionCard).join("")}
      </div>
    ` : ""}
  `;
}

function rootViewHTML(model) {
  return `
    <div class="folder-hero folder-hero--home">
      <div>
        <h2>${model.rootTitle}</h2>
        <p class="folder-summary">${model.rootSummary}</p>
      </div>
      <div class="folder-hero-card folder-hero-art folder-hero-art--${model.rootArtClass || "home"}" aria-hidden="true"></div>
    </div>
    ${folderTilesHTML(topLevelFolders(model))}
  `;
}

function renderSidebarTree(model, activeId, parentId = ROOT_ID, depth = 1) {
  const folders = childFolders(model, parentId);
  return folders.map((folder) => {
    const classes = ["sidebar-item"];
    if (depth > 1) classes.push("sidebar-item--child");
    if (depth > 2) classes.push("sidebar-item--grandchild");
    if (folder.id === activeId) classes.push("is-active");

    return `
      <button class="${classes.join(" ")}" type="button" data-folder-target="${folder.id}">
        <span class="folder-dot ${depth > 2 ? "folder-dot--mini" : ""}" aria-hidden="true"></span>
        <span>
          <strong>${folder.label}</strong>
          <span>${folder.short || folder.summary}</span>
        </span>
      </button>
      ${renderSidebarTree(model, activeId, folder.id, depth + 1)}
    `;
  }).join("");
}

function renderDolphin(root, model) {
  if (!root) return;

  const foldersById = new Map(model.folders.map((folder) => [folder.id, folder]));
  let activeId = ROOT_ID;
  let mobileActiveId = null;

  root.innerHTML = `
    <section class="explorer-window explorer-window--desktop">
      <div class="window-top">
        <div class="traffic" aria-hidden="true"><span></span><span></span><span></span></div>
        <div class="window-title">
          <strong>Dolphin</strong>
          <span>${model.subtitle}</span>
        </div>
        <div class="window-tools">Harshit</div>
      </div>
      <div class="window-toolbar">
        <div class="toolbar-group">
          <button class="toolbar-button" type="button" aria-label="Back" data-desktop-back>←</button>
          <button class="toolbar-button" type="button" aria-label="Folder">⌂</button>
          <button class="toolbar-button" type="button" aria-label="View">▦</button>
        </div>
        <div class="breadcrumb" data-breadcrumb>${model.path}</div>
        <div class="toolbar-search">${model.title}</div>
      </div>
      <div class="window-body">
        <aside class="window-sidebar">
          <div class="sidebar-heading">Places</div>
          <div class="sidebar-group" data-sidebar-items></div>
        </aside>
        <div class="window-content" data-folder-content></div>
      </div>
    </section>
    <section class="mobile-explorer" aria-label="${model.title}">
      <div class="mobile-window">
        <div class="mobile-window-top">
          <button class="mobile-back" type="button" data-mobile-back>← Back</button>
          <div class="mobile-window-title">
            <strong>Dolphin</strong>
            <span data-mobile-title>${model.subtitle}</span>
          </div>
        </div>
        <div class="mobile-window-body">
          <div class="mobile-folder-list" data-mobile-list></div>
          <div class="mobile-folder-detail" data-mobile-detail hidden></div>
        </div>
      </div>
    </section>
  `;

  const sidebar = root.querySelector("[data-sidebar-items]");
  const content = root.querySelector("[data-folder-content]");
  const breadcrumb = root.querySelector("[data-breadcrumb]");
  const desktopBack = root.querySelector("[data-desktop-back]");
  const mobileList = root.querySelector("[data-mobile-list]");
  const mobileDetail = root.querySelector("[data-mobile-detail]");
  const mobileBack = root.querySelector("[data-mobile-back]");
  const mobileTitle = root.querySelector("[data-mobile-title]");

  function parentIdOf(id) {
    if (id === ROOT_ID) return null;
    return foldersById.get(id)?.parentId || ROOT_ID;
  }

  function renderSidebar() {
    sidebar.innerHTML = `
      <button class="sidebar-item ${activeId === ROOT_ID ? "is-active" : ""}" type="button" data-folder-target="${ROOT_ID}">
        <span class="folder-dot folder-dot--home" aria-hidden="true"></span>
        <span>
          <strong>${model.title}</strong>
          <span>${model.rootShort}</span>
        </span>
      </button>
      ${renderSidebarTree(model, activeId)}
    `;
  }

  function updateDesktopBackState() {
    if (activeId === ROOT_ID && !model.backHref) {
      desktopBack.hidden = true;
      desktopBack.classList.remove("is-active");
      return;
    }
    desktopBack.hidden = false;
    desktopBack.classList.add("is-active");
  }

  function renderContent() {
    content.innerHTML = activeId === ROOT_ID
      ? rootViewHTML(model)
      : folderViewHTML(foldersById.get(activeId), model);
    breadcrumb.textContent = breadcrumbForPath(model, foldersById, activeId);
    updateDesktopBackState();
    content.scrollTop = 0;
  }

  function activate(id) {
    activeId = id;
    renderSidebar();
    renderContent();
  }

  function mobileListHTML() {
    return topLevelFolders(model).map((folder) => `
      <button class="mobile-folder-row" type="button" data-mobile-open="${folder.id}">
        <span class="mobile-folder-icon mobile-folder-icon--${folder.artClass || "system"}" aria-hidden="true"></span>
        <span class="mobile-folder-copy">
          <strong>${folder.label}</strong>
          <span>${folder.summary}</span>
        </span>
        <span class="mobile-folder-arrow" aria-hidden="true">open</span>
      </button>
    `).join("");
  }

  function updateMobileBackState() {
    if (mobileActiveId || model.backHref) {
      mobileBack.hidden = false;
      return;
    }
    mobileBack.hidden = true;
  }

  function showMobileRoot() {
    mobileActiveId = null;
    mobileList.hidden = false;
    mobileDetail.hidden = true;
    mobileTitle.textContent = model.subtitle;
    mobileList.innerHTML = mobileListHTML();
    updateMobileBackState();
  }

  function openMobileFolder(id) {
    const folder = foldersById.get(id);
    if (!folder) return;
    mobileActiveId = id;
    mobileList.hidden = true;
    mobileDetail.hidden = false;
    mobileTitle.textContent = folder.label;
    mobileDetail.innerHTML = folderViewHTML(folder, model);
    mobileDetail.scrollTop = 0;
    updateMobileBackState();
  }

  renderSidebar();
  renderContent();
  showMobileRoot();

  root.addEventListener("click", (event) => {
    const folderTarget = event.target.closest("[data-folder-target]");
    if (folderTarget && root.contains(folderTarget)) {
      const targetId = folderTarget.dataset.folderTarget;
      if (window.matchMedia("(max-width: 720px)").matches) {
        if (targetId === ROOT_ID) {
          showMobileRoot();
        } else {
          openMobileFolder(targetId);
        }
      } else {
        activate(targetId);
      }
      return;
    }

    const mobileOpen = event.target.closest("[data-mobile-open]");
    if (mobileOpen && root.contains(mobileOpen)) {
      openMobileFolder(mobileOpen.dataset.mobileOpen);
      return;
    }

    const desktopBackButton = event.target.closest("[data-desktop-back]");
    if (desktopBackButton && root.contains(desktopBackButton)) {
      if (activeId === ROOT_ID) {
        if (model.backHref) window.location.href = model.backHref;
        return;
      }
      activate(parentIdOf(activeId));
      return;
    }

    const mobileBackButton = event.target.closest("[data-mobile-back]");
    if (!mobileBackButton || !root.contains(mobileBackButton)) return;
    if (!mobileActiveId) {
      if (model.backHref) window.location.href = model.backHref;
      return;
    }
    const parentId = parentIdOf(mobileActiveId);
    if (parentId === ROOT_ID) {
      showMobileRoot();
      return;
    }
    openMobileFolder(parentId);
  });
}

function renderPageExplorer(data) {
  const root = document.querySelector("[data-page-explorer]");
  if (!root) return;

  if (page === "projects") {
    renderDolphin(root, buildProjectsExplorerModel(data));
    return;
  }

  if (page === "posters") {
    renderDolphin(root, buildPostersExplorerModel(data));
  }
}

loadSiteData()
  .then((data) => {
    initCustomCursor();
    renderNav(data);
    renderFooter(data);

    if (page === "home") {
      renderHomeIntro(data);
      renderDolphin(document.querySelector("[data-home-workspace]"), buildHomeExplorerModel(data));
    }

    if (page === "projects" || page === "posters") {
      renderPageExplorer(data);
    }
  })
  .catch((error) => {
    document.body.innerHTML = `<main style="padding:2rem;font-family:sans-serif;">${error.message}</main>`;
    throw error;
  });
