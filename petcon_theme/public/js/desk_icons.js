// assets/petcon_theme/js/desk_icons.js
(function () {
  const FLAG = "petcon-lms";

  function onLMS() {
    return location.pathname.startsWith("/app/lms");
  }

  function mark() {
    document.documentElement.classList.toggle(FLAG, onLMS());
  }

  function hook() {
    // 1) mark now
    mark();

    // 2) SPA route changes (both jQuery and router hooks if present)
    if (window.jQuery && typeof jQuery === "function") {
      jQuery(document).on("page-change", mark);
    }
    if (window.frappe && frappe.router && typeof frappe.router.on === "function") {
      frappe.router.on("change", mark);
    }

    // 3) Browser nav
    window.addEventListener("popstate", mark);
    window.addEventListener("hashchange", mark);

    // 4) Defensive: observe route hints
    try {
      const mo = new MutationObserver(mark);
      mo.observe(document.body, { attributes: true, attributeFilter: ["data-route", "class"] });
    } catch (_) {}
  }

  // Safe startup: only use frappe.ready if it exists, otherwise use DOMContentLoaded
  if (window.frappe && typeof frappe.ready === "function") {
    frappe.ready(hook);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hook, { once: true });
  } else {
    hook();
  }

  // Handy for manual tests
  window.petconMarkLMSRoute = mark;
})();
