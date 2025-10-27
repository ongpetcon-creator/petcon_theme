// Petcon Theme — LMS tiles (adds classes to card sections on /app/lms)
(() => {
  const onLMS = () => location.pathname.startsWith("/app/lms");

  function tagTiles(root = document) {
    if (!onLMS()) return;

    // Find all visible card-like sections in the LMS workspace
    const sections = root.querySelectorAll(
      // Workspace card/group containers (Frappe 15)
      ".workspace .widget-group, .workspace .dashboard-section, .workspace .cards"
    );

    sections.forEach((sec) => {
      // Try to read the section's title text
      const titleEl =
        sec.querySelector(".section-head .section-title") ||
        sec.querySelector(".section-title") ||
        sec.querySelector("h5, h4");
      const title = (titleEl?.textContent || "").trim().toLowerCase();

      if (!title) return;

      // Mark only the 4 tiles we care about
      if (["get started", "statistics", "master", "custom documents"].includes(title)) {
        sec.classList.add("petcon-tile");
        sec.dataset.petconTile = title.replace(/\s+/g, "-");
      }
    });
  }

  function run() {
    document.documentElement.classList.toggle("petcon-lms", onLMS());
    tagTiles(document);
  }

  // Initial + SPA route changes
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
  window.addEventListener("popstate", run);
  window.addEventListener("hashchange", run);
  document.addEventListener("page-change", run);
  try { if (window.frappe?.router?.on) frappe.router.on("change", run); } catch {}

  // Re-apply when the workspace re-renders
  try {
    const mo = new MutationObserver((m) => {
      if (m.some(x => x.addedNodes && x.addedNodes.length)) tagTiles(document);
    });
    mo.observe(document.body, { childList: true, subtree: true });
  } catch {}
})();
