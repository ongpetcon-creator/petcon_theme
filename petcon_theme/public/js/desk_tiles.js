// Petcon Theme — LMS tiles (v4: wrap full sections into .petcon-tile)
(() => {
  const onLMS = () => location.pathname.startsWith("/app/lms");

  // Section titles to enclose
  const TITLES = ["get started", "statistics", "master", "custom documents"];
  const TITLE_SET = new Set(TITLES);

  const norm = (t) => (t || "").trim().toLowerCase().replace(/\s+/g, " ");

  // Return headings that match our titles, in DOM order
  function getTargetHeadings(root = document) {
    const nodes = [...root.querySelectorAll(
      ".section-head .section-title, .section-title, h2, h3, h4, h5"
    )].filter(h => TITLE_SET.has(norm(h.textContent)));
    nodes.sort((a, b) =>
      (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1
    );
    return nodes;
  }

  // Wrap from each heading until the next heading (or end) into one .petcon-tile
  function wrapSections() {
    if (!onLMS()) return 0;
    let wrapped = 0;

    const headings = getTargetHeadings(document);
    for (let i = 0; i < headings.length; i++) {
      const h = headings[i];
      if (h.closest(".petcon-tile")) continue; // already wrapped

      // choose a sensible parent that holds siblings (usually a section body)
      const parent = h.parentNode;
      if (!parent) continue;

      const tile = document.createElement("div");
      tile.className = "petcon-tile";
      tile.dataset.petconTile = norm(h.textContent).replace(/\s+/g, "-");

      // insert wrapper, then move heading and all following siblings up to next heading
      parent.insertBefore(tile, h);
      const nextHeading = headings[i + 1] || null;

      let node = h;
      while (node && node !== nextHeading) {
        const next = node.nextSibling;
        tile.appendChild(node);
        node = next;
      }
      wrapped++;
    }
    return wrapped;
  }

  function runWithRetries() {
    if (!onLMS()) return;
    document.documentElement.classList.add("petcon-lms");

    let tries = 0;
    const tick = () => {
      tries++;
      wrapSections();
      // stop once all four are wrapped or after a few passes (late paints)
      if (document.querySelectorAll(".petcon-tile").length >= 4 || tries >= 8) return;
      setTimeout(tick, 120);
    };

    tick(); // immediate + retries
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runWithRetries, { once: true });
  } else {
    runWithRetries();
  }

  // SPA + dynamic renders
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
