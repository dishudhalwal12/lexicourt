window.lexiCourtUtils = {
  comingSoon(event, message) {
    if (event) {
      event.preventDefault();
    }
    window.alert(message || "Coming soon");
  },
  goToDashboard(event) {
    if (event) {
      event.preventDefault();
    }
    window.location.href = "dashboard.html";
  },
  goToLogin(event) {
    if (event) {
      event.preventDefault();
    }
    window.location.href = "login.html";
  },
  statusClass(status) {
    const classes = {
      Active: "status-active",
      Pending: "status-pending",
      Closed: "status-closed",
      Won: "status-won"
    };
    return classes[status] || "status-closed";
  },
  statusBadge(status) {
    return `<span class="status-pill ${this.statusClass(status)}">${status}</span>`;
  },
  bindCommonActions() {}
};
