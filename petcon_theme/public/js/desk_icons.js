// Adds a route flag class on <html> whenever you're on /app/lms
// so CSS can scope styling/icons just to the LMS workspace.

(function () {
  const FLAG_CLASS = "petcon-lms";

  function onLMS() {
    // be generous: /app/lms or any sub-route under it
    return location.pathname.startsWith("/app/lms");
  }

  function mark() {
    const root = document.documentElement;
    if (onLMS()) root.classList.add(FLAG_CLASS);
    else root.classList.remove(FLAG_CLASS);
  }

  // Run once when Desk is ready
  if (window.frappe && frappe.ready) {
    frappe.ready(() => {
      mark();

      // Cover SPA navigations in v14/v15
      // jQuery event used widely across Frappe pages:
      $(document).on("page-change", mark);

      // Router event if available:
      if (frappe.router && typeof frappe.router.on === "function") {
        frappe.router.on("change", mark);
      }
    });
  } else {
    // Fallback for early load
    document.addEventListener("DOMContentLoaded", mark);
  }

  // Defensive: handle back/forward navigation too
  window.addEventListener("popstate", mark);
  window.addEventListener("hashchange", mark);

  // Last line of defense: observe route hints on body (cheap)
  try {
    const mo = new MutationObserver(mark);
    mo.observe(document.body, {
      attributes: true,
      attributeFilter: ["data-route", "class"],
    });
  } catch (_) {}

  // Expose for quick console debugging if needed:
  window.petconMarkLMSRoute = mark;
})();
