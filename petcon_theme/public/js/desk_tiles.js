// Petcon Theme — LMS tiles (v4.2: wrap full sections robustly)
(() => {
  const onLMS = () => location.pathname.startsWith("/app/lms");

  // Section titles to enclose
  const TITLES = ["get started", "statistics", "master", "custom documents"];
  const TITLE_SET = new Set(TITLES);
  const norm = (t) => (t || "").trim().toLowerCase().replace(/\s+/g, " ");

  function findTitleNodes(root = document) {
    const candidates = root.querySelectorAll(
      ".section-head .section-title, .section-title, .widget-title, .widget-head, h1, h2, h3, h4, h5, h6, .ellipsis, .head"
    );
    const hits = [];
    candidates.forEach((el) => {
      if (TITLE_SET.has(norm(el.textContent))) hits.push(el);
    });
    hits.sort((a, b) =>
      (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1
    );
    return hits;
  }

  function rowChildUnderMainSection(node) {
    let n = node;
    while (n && n.parentElement && !n.parentElement.classList.contains("layout-main-section")) {
      n = n.parentElement;
    }
    if (!n || !n.parentElement || !n.parentElement.classList.contains("layout-main-section")) {
      return null;
    }
    return n;
  }

  function wrapRange(startNode, endNode, titleText) {
    if (!startNode) return false;
    if (startNode.closest(".petcon-tile")) return false;
    const parent = startNode.parentElement;
    if (!parent) return false;

    const wrapper = document.createElement("div");
    wrapper.className = "petcon-tile";
    wrapper.dataset.petconTile = norm(titleText).replace(/\s+/g, "-");
    parent.insertBefore(wrapper, startNode);

    let cur = startNode;
    while (cur && cur !== endNode) {
      const next = cur.nextSibling;
      wrapper.appendChild(cur);
      cur = next;
    }
    return true;
  }

  function wrapSections() {
    if (!onLMS()) return 0;
    const titles = findTitleNodes(document);
    if (!titles.length) return 0;

    const starts = titles.map((el) => ({
      title: el.textContent,
      block: rowChildUnderMainSection(el) || el,
    }));

    let wrapped = 0;
    for (let i = 0; i < starts.length; i++) {
      const start = starts[i].block;
      const end   = (i + 1 < starts.length) ? starts[i + 1].block : null;
      if (wrapRange(start, end, starts[i].title)) wrapped++;
    }
    return wrapped;
  }

  function runWithRetries() {
    if (!onLMS()) return;
    document.documentElement.classList.add("petcon-lms");
    let tries = 0, max = 8;
    const tick = () => {
      tries++; wrapSections();
      if (document.querySelectorAll(".petcon-tile").length >= 4 || tries >= max) return;
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
