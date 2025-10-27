/* Petcon Theme — LMS emoji icons & route flag (unique icons)
 * - Adds html.petcon-lms on /app/lms so CSS can scope cleanly
 * - Injects unique emojis next to link labels across the LMS module page & widgets
 * - Robust to SPA route changes & re-renders; avoids duplicates
 */

(() => {
  const FLAG = "petcon-lms";

  // Where to look for anchor links on the workspace/module page
  const SELECTORS = [
    // module page sections & workspace cards
    ".module-page .module-body .module-section a",
    ".links-widget a.link-item",
    ".widget.links-widget a.link-item",
    ".section-body a",
    // left sidebar
    ".standard-sidebar .standard-sidebar-item a",
    ".sidebar-section a",
    // generic anchors as a catch-all
    ".page-content a[href]"
  ].join(",");

  // Route helpers
  const onLMS = () => location.pathname.startsWith("/app/lms");
  const mark = () => document.documentElement.classList.toggle(FLAG, onLMS());

  // === Exact label → emoji map (all UNIQUE) ===
  const LABEL_EMOJI = {
    // Shortcuts / header
    "visit lms portal": "🌐",
    "create a course": "➕",
    "lms settings": "⚙️",

    // Course data
    "course": "📘",
    "chapter": "🧩",
    "lesson": "▶️",
    "quiz": "❓",
    "quiz submission": "📤",

    // Stats & certification
    "review": "⭐",
    "certification": "🏅",
    "certificate": "🎓",
    "evaluation request": "📨",
    "evaluation": "🔬",
    "course completed": "✅",
    "enrollments": "📝",

    // Custom documents
    "department": "🏢",
    "driver": "🪪",
    "employee": "👤",
    "employees": "👥",
    "external course": "🔗",
    "site": "📍",
    "training": "🏋️",
    "vehicle": "🚚"
  };

  // === HREF substring → emoji map (mirror above; also UNIQUE) ===
  const HREF_EMOJI = [
    ["^/lms", "🌐"],
    ["/app/lms-settings", "⚙️"],
    ["/app/course", "📘"],
    ["/app/chapter", "🧩"],
    ["/app/lesson", "▶️"],
    ["/app/quiz-submission", "📤"],
    ["/app/quiz", "❓"],
    ["/app/review", "⭐"],
    ["/app/certification", "🏅"],
    ["/app/certificate", "🎓"],
    ["/app/evaluation-request", "📨"],
    ["/app/evaluation", "🔬"],
    ["/app/enrollment", "📝"],
    ["/app/employee", "👤"],
    ["/app/department", "🏢"],
    ["/app/vehicle", "🚚"],
    ["/app/driver", "🪪"],
    ["/app/external-course", "🔗"],
    ["/app/site", "📍"],
    ["/app/training", "🏋️"]
  ];

  // Pool to keep unknowns unique & unobtrusive
  const FALLBACK_POOL = ["🔹","🔸","🔺","🔻","🔷","🔶","⬛","⬜","🔳","🔲","🟦","🟧","🟩","🟨","🟪","🟫"];
  const USED_EMOJIS = new Set();

  // Helpers
  function findLabelNode(a) {
    // common label containers in Frappe workspaces
    return (
      a.querySelector(".module-link-title") ||
      a.querySelector(".link-content") ||
      a
    );
  }

  function textOf(el) {
    return (el?.textContent || "").trim().replace(/\s+/g, " ");
  }

  function emojiFor(anchor) {
    const href = anchor.getAttribute("href") || "";
    for (const [needle, emo] of HREF_EMOJI) {
      const re = needle.startsWith("^")
        ? new RegExp(needle)
        : new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
      if (re.test(href)) return emo;
    }
    const label = textOf(findLabelNode(anchor));
    if (!label) return null;
    const exact = LABEL_EMOJI[label.toLowerCase()];
    return exact || guessEmoji(label);
  }

  function guessEmoji(_label) {
    // Minimalist: choose the first unused neutral shape
    return FALLBACK_POOL.find(e => !USED_EMOJIS.has(e)) || "🔹";
  }

  function addEmoji(anchor) {
    if (!anchor || anchor.dataset.pcEmoji) return;

    let emoji = emojiFor(anchor);
    if (!emoji) return;

    // ensure uniqueness across different labels
    const labelNode = findLabelNode(anchor);
    const label = textOf(labelNode).toLowerCase();
    if (USED_EMOJIS.has(emoji) && LABEL_EMOJI[label] !== emoji) {
      // pick first unused
      emoji = FALLBACK_POOL.find(e => !USED_EMOJIS.has(e)) || emoji;
    }
    USED_EMOJIS.add(emoji);

    const span = document.createElement("span");
    span.className = "petcon-emoji";
    span.textContent = emoji;

    labelNode.prepend(span);
    anchor.dataset.pcEmoji = "1";
  }

  function applyAll() {
    if (!onLMS()) return;
    document.querySelectorAll(SELECTORS).forEach(addEmoji);
  }

  function run() {
    mark();
    applyAll();
  }

  // bootstrap & SPA hooks
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
  window.addEventListener("popstate", run);
  window.addEventListener("hashchange", run);
  document.addEventListener("page-change", run);
  try { if (window.frappe?.router?.on) frappe.router.on("change", run); } catch {}

  // catch dynamic re-renders
  try {
    const mo = new MutationObserver((muts) => {
      if (muts.some(m => m.addedNodes && m.addedNodes.length)) applyAll();
    });
    mo.observe(document.body, { childList: true, subtree: true });
  } catch {}
})();
