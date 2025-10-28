// Petcon Theme — LMS tiles (v4.6: text-based section slicing with TreeWalker)
(() => {
  const onLMS = () => location.pathname.startsWith("/app/lms");
  const TITLES = ["get started", "statistics", "master", "custom documents"];
  const TITLE_SET = new Set(TITLES);
  const norm = (t) => (t || "").trim().toLowerCase().replace(/\s+/g, " ");

  // Find the main content container to limit our wrapping scope
  function mainContainer() {
    return (
      document.querySelector(".layout-main-section") ||
      document.querySelector(".page-content") ||
      document.querySelector(".workspace") ||
      document.body
    );
  }

  function cleanupTiles(root) {
    root.querySelectorAll(".petcon-tile").forEach((wrap) => {
      const p = wrap.parentNode;
      while (wrap.firstChild) p.insertBefore(wrap.firstChild, wrap);
      p.removeChild(wrap);
    });
  }

  // Return headings (nodes) that match our four titles (case-insensitive)
  function findTargetHeadings(root) {
    const candidates = root.querySelectorAll(
      ".section-title, .section-head .section-title, h1, h2, h3, h4, h5"
    );
    const hits = [];
    candidates.forEach((el) => {
      const t = norm(el.textContent);
      if (TITLE_SET.has(t)) hits.push(el);
    });
    // keep DOM order
    hits.sort((a, b) =>
      (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1
    );
    return hits;
  }

  // Move a contiguous slice of nodes [start ... before endNode) into a wrapper
  function wrapSlice(startNode, endNodeExclusive) {
    const parent = startNode.parentNode;
    if (!parent) return null;

    const wrap = document.createElement("div");
    wrap.className = "petcon-tile";
    wrap.dataset.petconTile = norm(startNode.textContent).replace(/\s+/g, "-");
    parent.insertBefore(wrap, startNode);

    let cur = startNode;
    // Move siblings from startNode up until (but not including) the next heading node
    while (cur && cur !== endNodeExclusive) {
      const next = cur.nextSibling;
      wrap.appendChild(cur);
      cur = next;
      // If the next heading is in a different parent chain, stop when we run out of siblings
      if (!cur && endNodeExclusive && endNodeExclusive.parentNode !== parent) break;
    }
    return wrap;
  }

  function runOnce() {
    if (!onLMS()) return 0;
    document.documentElement.classList.add("petcon-lms");

    const root = mainContainer();
    if (!root) return 0;

    // Remove any previous wrappers to avoid nesting
    cleanupTiles(root);

    // Locate our headings by text
    const heads = findTargetHeadings(root);
    if (heads.length === 0) return 0;

    // Build a TreeWalker to know the DOM order across nested parents
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null);

    // Collect in DOM order and wrap each section slice
    let wrapped = 0;
    for (let i = 0; i < heads.length; i++) {
      const h = heads[i];
      const next = heads[i + 1] || null;

      // Ensure TreeWalker reaches the heading
      tw.currentNode = root;
      let node = tw.nextNode();
      while (node && node !== h) node = tw.nextNode();
      if (!node) continue; // not found (shouldn't happen)

      // The slice starts at the heading itself
      const wrap = wrapSlice(h, next);
      if (wrap) wrapped++;
    }

    // If we somehow ended up with more than 4 (shouldn't), keep only our keys
    [...root.querySelectorAll(".petcon-tile")].forEach((w) => {
      const key = (w.dataset.petconTile || "").replace(/-/g, " ");
      if (!TITLE_SET.has(key)) {
        const p = w.parentNode;
        while (w.firstChild) p.insertBefore(w.firstChild, w);
        p.removeChild(w);
      }
    });

    return root.querySelectorAll(".petcon-tile").length;
  }

  function runWithRetries() {
    if (!onLMS()) return;
    let tries = 0, max = 8;
    const tick = () => {
      tries++;
      const count = runOnce();
      if (count >= 4 || tries >= max) return;
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
