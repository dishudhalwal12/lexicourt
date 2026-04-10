function navigate(href) {
  window.location.href = href;
}

function ensureToastViewport() {
  let viewport = document.getElementById("lexiCourtToastViewport");
  if (viewport) {
    return viewport;
  }

  viewport = document.createElement("div");
  viewport.id = "lexiCourtToastViewport";
  viewport.className = "app-toast-viewport";
  document.body.appendChild(viewport);
  return viewport;
}

function notify(message, tone = "info") {
  if (!message) {
    return;
  }

  const viewport = ensureToastViewport();
  const toast = document.createElement("div");
  toast.className = `app-toast app-toast-${tone}`;
  toast.innerHTML = `
    <span class="app-toast-icon"><i class="bi ${tone === "error" ? "bi-exclamation-triangle" : tone === "success" ? "bi-check2-circle" : "bi-info-circle"}"></i></span>
    <div class="app-toast-copy">${String(message)}</div>
  `;
  viewport.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("is-visible");
  });

  window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => toast.remove(), 260);
  }, 3200);
}

window.lexiCourtUtils = {
  notify,
  comingSoon(event, message) {
    if (event) {
      event.preventDefault();
    }
    notify(message || "Coming soon");
  },
  goToDashboard(event) {
    if (event) {
      event.preventDefault();
    }
    navigate("dashboard.html");
  },
  goToLogin(event) {
    if (event) {
      event.preventDefault();
    }
    navigate("login.html");
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
