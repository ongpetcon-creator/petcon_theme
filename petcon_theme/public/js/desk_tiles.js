// Petcon Theme — LMS tiles (v4.4: prefer real .section blocks; fallback to heading-wrap)
(() => {
  const onLMS = () => location.pathname.startsWith("/app/lms");

  const TITLES = ["get started", "statistics", "master", "custom documents"];
  const TITLE_SET = new Set(TITLES);
  const norm = (t) => (t || "").trim().toLowerCase().replace(/\s+/g, " ");

  function cleanupTiles() {
    // unwrap any previous wrappers
    document.querySelectorAll(".petcon-tile").forEach((tile) => {
      // If this tile is a wrapper we created (no .section), unwrap
      if (!tile.classList.contains("section")) {
        const p = tile.parentNode;
        while (tile.firstChild) p.insertBefore(tile.firstChild, tile);
        p.removeChild(tile);
      } else {
        // If it's a real .section with our class, just remove the class
        tile.classList.remove("petcon-tile");
      }
    });
  }

  // ---------- Strategy A: true .section blocks ----------
  function applyOnRealSections() {
    const sections = [...document.querySelectorAll(".section")];
    let tagged = 0;
    sections.forEach((sec) => {
      const h = sec.querySelector(".section-head .section-title, .section-title, h2, h3");
      if (!h) return;
      const title = norm(h.textContent);
      if (!TITLE_SET.has(title)) return;
      sec.classList.add("petcon-tile");
      sec.dataset.petconTile = title.replace(/\s+/g, "-");
      tagged++;
    });
    return tagged;
  }

  // ---------- Strategy B: fallback heading-wrap ----------
  function getHeadings(root = document) {
    const nodes = [...root.querySelectorAll(".section-head .section-title, .section-title, h2, h3, h4, h5")]
      .filter((el) => TITLE_SET.has(norm(el.textContent)));
    nodes.sort((a,b) =>
      (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1
    );
    return nodes;
  }

  function wrapFromHeading(heading, nextHeading) {
    if (heading.closest(".petcon-tile")) return false;
    const parent = heading.parentNode;
    if (!parent) return false;

    const wrapper = document.createElement("div");
    wrapper.className = "petcon-tile";
    wrapper.dataset.petconTile = norm(heading.textContent).replace(/\s+/g, "-");
    parent.insertBefore(wrapper, heading);

    let cur = heading;
    while (cur && cur !== nextHeading) {
      const next = cur.nextSibling;
      wrapper.appendChild(cur);
      cur = next;
      if (!cur && nextHeading && nextHeading.parentNode !== parent) break;
    }

    // sanity: ensure the wrapper has more than just the heading
    const hasContent = wrapper.querySelectorAll("a, .module-section, .links-widget, .stats, .row, .col").length > 0;
    if (!hasContent) {
      while (wrapper.firstChild) parent.insertBefore(wrapper.firstChild, wrapper);
      parent.removeChild(wrapper);
      return false;
    }
    return true;
  }

  function applyByHeadingWrap() {
    const heads = getHeadings(document);
    let wrapped = 0;
    for (let i = 0; i < heads.length; i++) {
      const h = heads[i];
      const next = heads[i + 1] || null;
      if (wrapFromHeading(h, next)) wrapped++;
    }
    // prune anything not one of our 4 keys
    [...document.querySelectorAll(".petcon-tile")].forEach((t) => {
      const key = (t.dataset.petconTile || "").replace(/-/g, " ");
      if (!TITLE_SET.has(key)) {
        const p = t.parentNode;
        while (t.firstChild) p.insertBefore(t.firstChild, t);
        p.removeChild(t);
      }
    });
    return document.querySelectorAll(".petcon-tile").length;
  }

  function runOnce() {
    if (!onLMS()) return;
    document.documentElement.classList.add("petcon-lms");
    cleanupTiles();

    // Prefer real sections
    let count = applyOnRealSections();

    // If none found, fallback to heading wrap
    if (count === 0) count = applyByHeadingWrap();
    return count;
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
