function petconMarkLMSRoute() {
  const onLMS = location.pathname.includes("/app/lms");
  document.documentElement.classList.toggle("petcon-lms", onLMS);
}
frappe.ready(() => {
  petconMarkLMSRoute();
  // Frappe Desk is SPA; re-check after route changes
  $(document).on("page-change", petconMarkLMSRoute);
});
