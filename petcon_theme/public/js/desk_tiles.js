// Petcon Theme — LMS tiles (v3.2: strong heading→container tagging + retries + fallbacks)
(() => {
  const onLMS = () => location.pathname.startsWith("/app/lms");

  // Titles to box
  const TITLES = ["get started", "statistics", "master", "custom documents"];
  const TITLE_SET = new Set(TITLES);

  const norm = (t) => (t || "").trim().toLowerCase().replace(/\s+/g, " ");

  // Robust parent picker for your workspace DOM
  function closestTileContainer(el) {
    // Try common widget/card wrappers first
    let box =
      el.closest(
        [
          ".widget.shortcuts",
          ".widget.links-widget",
          ".widget",
          ".widget-group",
          ".dashboard-section",
          ".cards",
          ".frappe-card",
        ].join(",")
      ) || null;

    // If still nothing, try walking up to a section wrapper
    if (!box) {
      let p = el;
      for (let i = 0; i < 6 && p && p !== document.body; i++) {
        if (
          p.classList?.contains("layout-main-section") ||
          p.classList?.contains("section-body") ||
          p.classList?.contains("page-content")
        ) {
          box = p;
          break;
        }
        p = p.parentElement;
      }
    }

    return box || el.parentElement;
  }

  function tagByHeadings(root = document) {
    // Any visible heading-like element
    const headingNodes = root.querySelectorAll(
      ".section-head .section-title, .section-title, .widget-head .widget-title, h2, h3, h4, h5"
    );
    let tagged = 0;

    headingNodes.forEach((h) => {
      const title = norm(h.textContent);
      if (!TITLE_SET.has(title)) return;
      const box = closestTileContainer(h);
      if (!box || box.classList.contains("petcon-tile")) return;
      box.classList.add("petcon-tile");
      box.dataset.petconTile = title.replace(/\s+/g, "-");
      tagged++;
    });

    return tagged;
  }

  // Fallback: if some tiles still untagged, tag sections by content clusters
  function tagByContentHeuristics() {
    // Get Started → has portal/create/settings links
    try {
      const cands = [
        ["visit lms portal", "create a course", "lms settings", "get-started"],
        ["employees", "enrollments", "course completed", "statistics"],
        ["course", "chapter", "lesson", "master"],
        ["department", "driver", "employee", "custom-documents"],
      ];
      cands.forEach(([a, b, c, key]) => {
        const an = findAnchorByText(a) || findAnchorByText(b) || findAnchorByText(c);
        if (!an) return;
        const box = closestTileContainer(an);
        if (box && !box.classList.contains("petcon-tile")) {
          box.classList.add("petcon-tile");
          box.dataset.petconTile = key;
        }
      });
    } catch {}
  }

  function findAnchorByText(text) {
    const t = norm(text);
    const links = document.querySelectorAll("a[href], .shortcut, .link-item");
    for (const el of links) {
      const label =
        norm(
          el.querySelector(".module-link-title, .link-content, .shortcut-title, .widget-title")
            ?.textContent || el.textContent
        );
      if (!label) continue;
      if (label.includes(t)) return el;
    }
    return null;
  }

  function runWithRetries() {
    if (!onLMS()) return;
    document.documentElement.classList.add("petcon-lms");

    let passes = 0;
    let taggedTotal = 0;

    const tick = () => {
      passes++;
      taggedTotal += tagByHeadings(document) || 0;

      // After a couple of passes, apply heuristic tagging if any are still missing
      if (passes === 2) tagByContentHeuristics();

      // Stop after enough passes or once we’ve tagged all four tiles
      if (passes >= 8 || document.querySelectorAll(".petcon-tile").length >= 4) return;

      setTimeout(tick, 100);
    };

    // immediate + retries
    tick();
  }

  // bootstrap
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runWithRetries, { once: true });
  } else {
    runWithRetries();
  }

  // SPA hooks
  ["popstate", "hashchange"].forEach((ev) => window.addEventListener(ev, runWithRetries));
  document.addEventListener("page-change", runWithRetries);
  try { if (window.frappe?.router?.on) frappe.router.on("change", runWithRetries); } catch {}

  // dynamic re-renders
  try {
    const mo = new MutationObserver((m) => {
      if (m.some(x => x.addedNodes && x.addedNodes.length)) runWithRetries();
    });
    mo.observe(document.body, { childList: true, subtree: true });
  } catch {}
})();
