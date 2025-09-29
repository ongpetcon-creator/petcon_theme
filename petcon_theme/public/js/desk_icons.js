/* Petcon Theme — LMS emoji icons & route flag
 * - Adds html.petcon-lms on /app/lms so CSS can scope cleanly
 * - Injects emojis next to link labels across the LMS module page & widgets
 * - Robust to SPA route changes; avoids duplicates
 */
(() => {
  const FLAG = "petcon-lms";
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

  // ROUTE FLAG
  const onLMS = () => location.pathname.startsWith("/app/lms");
  const mark = () => document.documentElement.classList.toggle(FLAG, onLMS());

  // === Exact label → emoji map (lowercased keys) ===
  const LABEL_EMOJI = {
    // Shortcuts / header
    "visit lms portal": "🌐",
    "create a course": "➕",
    "lms settings": "⚙️",

    // Course data
    "course": "📚",
    "chapter": "📖",
    "lesson": "🧠",
    "quiz": "❓",
    "quiz submission": "📤",

    // Custom documents
    "department": "🏢",
    "driver": "🪪",
    "employee": "👤",
    "employees": "👥",
    "external course": "🔗",
    "site": "📍",
    "training": "🏋️",
    "vehicle": "🚚",

    // Stats & certification
    "review": "⭐",
    "certification": "📜",
    "certificate": "🎓",
    "evaluation request": "📩",
    "evaluation": "🧪",
    "course completed": "✅",
    "enrollments": "📝"
  };

  // === HREF substring → emoji map (checked before keyword guesses) ===
  const HREF_EMOJI = [
    ["^/lms", "🌐"],                 // portal
    ["/app/lms-settings", "⚙️"],
    ["/app/course", "📚"],
    ["/app/chapter", "📖"],
    ["/app/lesson", "🧠"],
    ["/app/quiz-submission", "📤"],
    ["/app/quiz", "❓"],
    ["/app/employee", "👤"],
    ["/app/enrollment", "📝"],
    ["/app/vehicle", "🚚"],
    ["/app/department", "🏢"],
    ["/app/certificate", "🎓"],
    ["/app/driver", "🪪"],
    ["/app/external-course", "🔗"],
    ["/app/site", "📍"],
    ["/app/training", "🏋️"],
    ["/app/review", "⭐"],
    ["/app/certification", "📜"],
    ["/app/evaluation-request", "📩"],
    ["/app/evaluation", "🧪"]
  ];

  // Keyword fallback — ensures every link still gets *something*
  function guessEmoji(label) {
    const t = label.toLowerCase();
    if (t.includes("create")) return "➕";
    if (t.includes("portal")) return "🌐";
    if (t.includes("setting")) return "⚙️";
    if (t.includes("course completed")) return "✅";
    if (t.includes("course")) return "📚";
    if (t.includes("chapter")) return "📖";
    if (t.includes("lesson")) return "🧠";
    if (t.includes("quiz submission")) return "📤";
    if (t.includes("quiz")) return "❓";
    if (t.includes("employee")) return "👥";
    if (t.includes("enroll")) return "📝";
    if (t.includes("department")) return "🏢";
    if (t.includes("certificate")) return "🎓";
    if (t.includes("review")) return "⭐";
    if (t.includes("certif")) return "📜";
    if (t.includes("evaluation request")) return "📩";
    if (t.includes("evaluation")) return "🧪";
    if (t.includes("vehicle")) return "🚚";
    if (t.includes("driver")) return "🪪";
    if (t.includes("train")) return "🏋️";
    if (t.includes("site")) return "📍";
    if (t.includes("external")) return "🔗";
    return "🔹"; // neutral fallback
  }

  function findLabelNode(a) {
    // common patterns in Frappe workspaces
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

  function addEmoji(anchor) {
    if (!anchor || anchor.dataset.pcEmoji) return;
    const emoji = emojiFor(anchor);
    if (!emoji) return;

    const labelNode = findLabelNode(anchor);
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
