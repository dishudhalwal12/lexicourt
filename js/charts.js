(function () {
  const accent = "#111111";
  const accentSoft = "#2f2f2f";
  const mutedBar = "#e8e8e8";
  const lineSoft = "#8b8b8b";
  const gridLine = "rgba(17,17,17,0.06)";

  function baseTooltip() {
    return {
      backgroundColor: "#111111",
      titleColor: "#ffffff",
      bodyColor: "#ffffff",
      displayColors: false,
      cornerRadius: 14,
      padding: 12,
      titleFont: { weight: "600" },
      bodyFont: { weight: "600" }
    };
  }

  function baseScales() {
    return {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#8a8a8a", font: { size: 11 } }
      },
      y: {
        grid: { color: gridLine },
        border: { display: false },
        ticks: { display: false }
      }
    };
  }

  function getCtx(id) {
    const canvas = document.getElementById(id);
    return canvas ? canvas.getContext("2d") : null;
  }

  function buildBarChart(id, data) {
    const ctx = getCtx(id);
    if (!ctx || typeof Chart === "undefined") {
      return;
    }

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            data,
            borderRadius: 10,
            backgroundColor: data.map((value, index) => (index === 4 ? accent : mutedBar)),
            hoverBackgroundColor: data.map((value, index) => (index === 4 ? accentSoft : "#d9d9d9"))
          }
        ]
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: baseTooltip()
        },
        scales: baseScales()
      }
    });
  }

  function buildAreaChart(id, data, lineColor, fillColor) {
    const ctx = getCtx(id);
    if (!ctx || typeof Chart === "undefined") {
      return;
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, fillColor || "rgba(17,17,17,0.12)");
    gradient.addColorStop(1, "rgba(17,17,17,0.01)");

    new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            data,
            borderColor: lineColor || accent,
            backgroundColor: gradient,
            fill: true,
            tension: 0.42,
            borderWidth: 2.2,
            pointRadius: [0, 0, 0, 0, 4, 3],
            pointBackgroundColor: [accent, accent, accent, accent, accent, lineSoft],
            pointHoverRadius: 5
          }
        ]
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: baseTooltip()
        },
        scales: baseScales()
      }
    });
  }

  function buildDoughnutChart(id, data) {
    const ctx = getCtx(id);
    if (!ctx || typeof Chart === "undefined") {
      return;
    }

    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Civil", "Criminal", "Family", "Corporate"],
        datasets: [
          {
            data,
            backgroundColor: ["#111111", "#3b3b3b", "#8b8b8b", "#d4d4d4"],
            borderWidth: 0,
            hoverOffset: 4
          }
        ]
      },
      options: {
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#666666",
              usePointStyle: true,
              boxWidth: 8,
              padding: 18
            }
          },
          tooltip: baseTooltip()
        }
      }
    });
  }

  function initDashboardCharts() {
    buildBarChart("activeCasesChart", window.lexiCourtData.monthlyCaseFiled);
    buildAreaChart("winRateChart", window.lexiCourtData.winRateTrend, accent, "rgba(17,17,17,0.14)");
    buildAreaChart("hearingChart", window.lexiCourtData.hearingsTrend, lineSoft, "rgba(17,17,17,0.08)");
    buildDoughnutChart("caseTypeChart", window.lexiCourtData.caseTypeSplit);
  }

  function initAdminCharts() {
    buildBarChart("adminCasesChart", [10, 12, 14, 16, 17, 18]);
    buildAreaChart("adminUsersChart", [4, 5, 5, 7, 8, 8], accentSoft, "rgba(17,17,17,0.1)");
  }

  window.lexiCourtCharts = {
    initDashboardCharts,
    initAdminCharts
  };

  document.addEventListener("DOMContentLoaded", () => {
    if (document.body.dataset.page === "dashboard") {
      initDashboardCharts();
    }

    if (document.body.dataset.page === "admin") {
      initAdminCharts();
    }
  });
})();
