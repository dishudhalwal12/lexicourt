(function () {
  const accent = "#f5f5f7";
  const accentSoft = "#d8dbe4";
  const mutedBar = "#1b1c24";
  const lineSoft = "#aeb3bf";
  const gridLine = "rgba(255,255,255,0.06)";

  function baseTooltip() {
    return {
      backgroundColor: "#f5f5f7",
      titleColor: "#07070a",
      bodyColor: "#07070a",
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
        ticks: { color: "#8e91a1", font: { size: 11 } }
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

  function destroyExistingChart(id) {
    const ctx = getCtx(id);
    if (!ctx || typeof Chart === "undefined") {
      return null;
    }

    const existing = Chart.getChart(ctx.canvas);
    if (existing) {
      existing.destroy();
    }

    return ctx;
  }

  function markChartReady(id) {
    const canvas = document.getElementById(id);
    const wrap = canvas?.closest(".chart-wrap");
    if (!wrap) {
      return;
    }

    wrap.classList.remove("is-loading");
    wrap.classList.add("is-ready");
  }

  function animationConfig(type) {
    if (type === "doughnut") {
      return {
        duration: 1100,
        easing: "easeOutQuart",
        animateRotate: true,
        animateScale: true,
        delay(context) {
          return (context.dataIndex || 0) * 80;
        },
        onComplete() {
          markChartReady(this.canvas.id);
        }
      };
    }

    return {
      duration: 900,
      easing: "easeOutQuart",
      delay(context) {
        if (context.type !== "data") {
          return 0;
        }
        return (context.dataIndex || 0) * 70;
      },
      onComplete() {
        markChartReady(this.canvas.id);
      }
    };
  }

  function buildBarChart(id, data) {
    const ctx = destroyExistingChart(id);
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
        animation: animationConfig("bar"),
        plugins: {
          legend: { display: false },
          tooltip: baseTooltip()
        },
        scales: baseScales()
      }
    });
  }

  function buildAreaChart(id, data, lineColor, fillColor) {
    const ctx = destroyExistingChart(id);
    if (!ctx || typeof Chart === "undefined") {
      return;
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, fillColor || "rgba(245,245,247,0.16)");
    gradient.addColorStop(1, "rgba(245,245,247,0.01)");

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
        animation: animationConfig("line"),
        plugins: {
          legend: { display: false },
          tooltip: baseTooltip()
        },
        scales: baseScales()
      }
    });
  }

  function buildDoughnutChart(id, data) {
    const ctx = destroyExistingChart(id);
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
            backgroundColor: ["#f5f5f7", "#cfd3dc", "#848997", "#353844"],
            borderWidth: 0,
            hoverOffset: 4
          }
        ]
      },
      options: {
        maintainAspectRatio: false,
        cutout: "62%",
        animation: animationConfig("doughnut"),
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#9d9ead",
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

  function zeroSeries(length) {
    return Array.from({ length }, () => 0);
  }

  function initDashboardCharts(data = {}) {
    buildBarChart("activeCasesChart", data.monthlyCaseFiled || zeroSeries(6));
    buildAreaChart("winRateChart", data.winRateTrend || zeroSeries(6), accentSoft, "rgba(216,219,228,0.16)");
    buildAreaChart("hearingChart", data.hearingsTrend || zeroSeries(6), lineSoft, "rgba(174,179,191,0.12)");
    buildDoughnutChart("caseTypeChart", data.caseTypeSplit || [0, 0, 0, 0]);
  }

  function initAdminCharts(data = {}) {
    buildBarChart("adminCasesChart", data.caseIntakeTrend || zeroSeries(6));
    buildAreaChart("adminUsersChart", data.activeLawyersTrend || zeroSeries(6), accentSoft, "rgba(216,219,228,0.14)");
  }

  window.lexiCourtCharts = {
    initDashboardCharts,
    initAdminCharts
  };
})();
