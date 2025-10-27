// Petcon Theme — LMS tiles (v3.1: aggressive heading→widget tagging + retries)
(() => {
  const onLMS = () => location.pathname.startsWith("/app/lms");

  // Titles to box as tiles
  const TILE_TITLES = new Set([
    "get started",
    "statistics",
    "master",
    "custom documents",
  ]);

  const norm = (t) => (t || "").trim().toLowerCase().replace(/\s+/g, " ");

  // Nearest “card-like” container Frappe uses on Workspaces
  function closestTileContainer(el) {
    return (
      el.closest(
        [
          ".widget.shortcuts",        // shortcuts widget
          ".widget.links-widget",     // alt shortcuts
          ".widget",                  // generic widget
          ".widget-group",            // group wrapper
          ".dashboard-section",       // alt group wrapper
          ".cards",                   // legacy/alt
          ".frappe-card",             // card wrapper
          ".layout-main-section",     // last resort
        ].join(",")
      ) || el.parentElement
    );
  }

  // Try to find headings and tag their containers
  function tagTiles(root = document) {
    if (!onLMS()) return 0;

    const headingNodes = root.querySelectorAll(
      [
        ".section-head .section-title",
        ".section-title",
        ".widget-head .widget-title",
        ".links-widget .widget-title",
        ".shortcut-widget-box .widget-title",
        "h2","h3","h4","h5"
      ].join(",")
    );

    let tagged = 0;

    headingNodes.forEach((h) => {
      const title = norm(h.textContent);
      if (!TILE_TITLES.has(title)) return;

      const box = closestTileContainer(h);
      if (!box || box.classList.contains("petcon-tile")) return;

      box.classList.add("petcon-tile");
      box.dataset.petconTile = title.replace(/\s+/g, "-");
      tagged++;
    });

    return tagged;
  }

  function runWithRetries() {
    // set page flag for CSS scoping
    document.documentElement.classList.toggle("petcon-lms", onLMS());

    // immediate attempt
    let tagged = tagTiles(document);

    // a few timed retries (workspace paints async)
    let tries = 0;
    const maxTries = 8; // ~800ms
    const interval = setInterval(() => {
      tries++;
      tagged += tagTiles(document) || 0;
      if (tries >= maxTries || tagged >= 4) clearInterval(interval);
    }, 100);

    // also try again on next frame after layout
    requestAnimationFrame(() => tagTiles(document));
  }

  // bootstrap
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runWithRetries, { once: true });
  } else {
    runWithRetries();
  }

  // SPA route changes
  window.addEventListener("popstate", runWithRetries);
  window.addEventListener("hashchange", runWithRetries);
  document.addEventListener("page-change", runWithRetries);
  try { if (window.frappe?.router?.on) frappe.router.on("change", runWithRetries); } catch {}

  // Re-apply on dynamic re-renders
  try {
    const mo = new MutationObserver((m) => {
      if (m.some(x => x.addedNodes && x.addedNodes.length)) runWithRetries();
    });
    mo.observe(document.body, { childList: true, subtree: true });
  } catch {}
})();
