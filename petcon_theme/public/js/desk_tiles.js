// Petcon Theme — LMS tiles (v4.3: wrap exactly 4 sections, no stray top tiles)
(() => {
  const onLMS = () => location.pathname.startsWith("/app/lms");

  const TITLES = ["get started", "statistics", "master", "custom documents"];
  const TITLE_SET = new Set(TITLES);
  const norm = (t) => (t || "").trim().toLowerCase().replace(/\s+/g, " ");

  // Remove any existing wrappers so we can re-evaluate cleanly
  function cleanupTiles() {
    document.querySelectorAll(".petcon-tile").forEach((tile) => {
      const parent = tile.parentNode;
      while (tile.firstChild) parent.insertBefore(tile.firstChild, tile);
      parent.removeChild(tile);
    });
  }

  // Find target headings (DOM order)
  function getHeadings(root = document) {
    const nodes = [...root.querySelectorAll(
      ".section-head .section-title, .section-title, h2, h3, h4, h5"
    )].filter((el) => TITLE_SET.has(norm(el.textContent)));
    nodes.sort((a,b) =>
      (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1
    );
    return nodes;
  }

  // Wrap from heading → (but not including) nextHeading
  function wrapFromHeading(heading, nextHeading) {
    // already wrapped?
    if (heading.closest(".petcon-tile")) return false;

    const parent = heading.parentNode;
    if (!parent) return false;

    const wrapper = document.createElement("div");
    wrapper.className = "petcon-tile";
    wrapper.dataset.petconTile = norm(heading.textContent).replace(/\s+/g, "-");
    parent.insertBefore(wrapper, heading);

    // Move siblings starting at the heading until we reach nextHeading
    let cur = heading;
    while (cur && cur !== nextHeading) {
      // If cur and nextHeading are in different parents, we stop when no nextSibling
      // (in Frappe workspace, headings of sections are typically siblings).
      const next = cur.nextSibling;
      wrapper.appendChild(cur);
      cur = next;
      if (!cur && nextHeading && nextHeading.parentNode !== parent) break;
    }

    // If wrapper ended up too empty (just the heading and nothing else), undo
    const hasContent = wrapper.querySelectorAll("a, .module-section, .links-widget, .stats, .row, .col").length > 0;
    if (!hasContent) {
      // unwrap
      while (wrapper.firstChild) parent.insertBefore(wrapper.firstChild, wrapper);
      parent.removeChild(wrapper);
      return false;
    }
    return true;
  }

  function wrapSections() {
    if (!onLMS()) return 0;

    cleanupTiles(); // ensure we start fresh

    const heads = getHeadings(document);
    if (!heads.length) return 0;

    let wrapped = 0;
    for (let i = 0; i < heads.length; i++) {
      const h = heads[i];
      const next = heads[i + 1] || null;
      if (wrapFromHeading(h, next)) wrapped++;
    }

    // If more than 4 somehow, keep only our 4 section keys
    const tiles = [...document.querySelectorAll(".petcon-tile")];
    tiles.forEach((t) => {
      const key = t.dataset.petconTile;
      if (!TITLE_SET.has(key.replace(/-/g, " "))) {
        const p = t.parentNode;
        while (t.firstChild) p.insertBefore(t.firstChild, t);
        p.removeChild(t);
      }
    });

    return document.querySelectorAll(".petcon-tile").length;
  }

  function runWithRetries() {
    if (!onLMS()) return;
    document.documentElement.classList.add("petcon-lms");

    let tries = 0;
    const maxTries = 8;

    const tick = () => {
      tries++;
      const count = wrapSections();
      if (count >= 4 || tries >= maxTries) return;
      setTimeout(tick, 120);
    };

    tick();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runWithRetries, { once: true });
  } else {
    runWithRetries();
  }
  window.addEventListener("popstate", runWithRetries);
  window.addEventListener("hashchange", runWithRetries);
  document.addEventListener("page-change", runWithRetries);
  try { if (window.frappe?.router?.on) frappe.router.on("change", runWithRetries); } catch {}
  try {
    const mo = new MutationObserver((m) => {
      if (m.some(x => x.addedNodes && x.addedNodes.length)) runWithRetries();
    });
    mo.observe(document.body, { childList: true, subtree: true });
  } catch {}
})();
