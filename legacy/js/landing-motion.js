function setInitialVars(heroCopy) {
    heroCopy.style.setProperty("--ambient-x", "80%");
    heroCopy.style.setProperty("--ambient-y", "24%");
    heroCopy.style.setProperty("--drift-x", "0px");
    heroCopy.style.setProperty("--drift-y", "0px");
    heroCopy.style.setProperty("--scroll-shift", "0px");
}

function ensureAmbientLayer(heroCopy) {
    let ambient = heroCopy.querySelector(".hero-ambient");
    if (ambient) {
        return ambient;
    }

    ambient = document.createElement("div");
    ambient.className = "hero-ambient";
    ambient.setAttribute("aria-hidden", "true");
    ambient.innerHTML = `
      <span class="hero-ambient-orb orb-one"></span>
      <span class="hero-ambient-orb orb-two"></span>
      <span class="hero-ambient-orb orb-three"></span>
      <span class="hero-ambient-beam"></span>
      <span class="hero-ambient-grid"></span>
    `;
    heroCopy.prepend(ambient);
    return ambient;
}

function decorateHeroDetails(heroCopy) {
    const chipTones = ["gold", "pink", "cyan", "violet"];
    const microChips = Array.from(heroCopy.querySelectorAll(".hero-micro-chip"));
    microChips.forEach((chip, index) => {
        chip.classList.add("hero-chip-float", chipTones[index % chipTones.length]);
        chip.style.setProperty("--chip-delay", `${index * 140}ms`);
    });

    const statPills = Array.from(heroCopy.querySelectorAll(".hero-stat-pill"));
    statPills.forEach((pill, index) => {
        pill.classList.add("hero-stat-pulse");
        pill.style.setProperty("--float-delay", `${index * 180}ms`);
    });
}

function prepareScrollScene() {
    const sections = Array.from(document.querySelectorAll(".landing-page .section-block"));
    sections.forEach((section, index) => {
        section.classList.add("landing-section-shell");
        section.style.setProperty("--section-delay", `${Math.min(index * 120, 220)}ms`);
    });

    const featureSection = document.querySelector(".landing-page #features");
    const featureCards = Array.from(document.querySelectorAll(".landing-page .feature-story-card"));
    featureCards.forEach((card, index) => {
        const direction = index === 1 ? 0 : index === 0 ? -1 : 1;
        card.classList.add("landing-feature-card");
        card.style.setProperty("--feature-direction", String(direction));
        card.style.setProperty("--feature-card-progress", "0");
    });

    const workflowSection = document.querySelector(".landing-page #how-it-works");
    const workflowRail = document.querySelector(".landing-page .how-it-works-rail");
    if (workflowRail) {
        workflowRail.classList.add("landing-workflow-rail");
        workflowRail.style.setProperty("--workflow-progress", "0");
    }

    const workflowCards = Array.from(document.querySelectorAll(".landing-page .how-it-works-card"));
    workflowCards.forEach((card, index) => {
        const direction = index === 1 ? 0 : index === 0 ? -1 : 1;
        card.classList.add("landing-workflow-card");
        card.style.setProperty("--workflow-direction", String(direction));
        card.style.setProperty("--workflow-card-progress", "0");
    });

    const revealTargets = Array.from(
        document.querySelectorAll(
            [
                ".landing-page .feature-section-intro",
                ".landing-page .feature-story-card",
                ".landing-page .how-it-works-rail",
                ".landing-page .how-it-works-card",
                ".landing-page .footer-minimal"
            ].join(",")
        )
    );

    revealTargets.forEach((element, index) => {
        element.classList.add("landing-scroll-reveal");
        element.style.setProperty("--landing-delay", `${Math.min(index * 90, 360)}ms`);
    });

    return { sections, revealTargets };
}

export function initLandingMotion() {
    if (typeof window === "undefined") {
        return;
    }

    if (typeof window.__lexiCourtLandingMotionCleanup === "function") {
        window.__lexiCourtLandingMotionCleanup();
    }

    const heroPanel = document.querySelector(".landing-page .hero-panel");
    const heroCopy = document.querySelector(".landing-page .hero-copy");
    if (!heroPanel || !heroCopy) {
        return;
    }

    heroPanel.dataset.motionReady = "true";
    setInitialVars(heroCopy);
    ensureAmbientLayer(heroCopy);
    decorateHeroDetails(heroCopy);
    const { sections, revealTargets } = prepareScrollScene();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (revealTargets.length) {
        revealTargets.forEach((element) => element.classList.add("is-in-view"));
    }
    if (sections.length) {
        sections[0]?.classList.add("is-active-section");
    }
    if (reduceMotion) {
        window.__lexiCourtLandingMotionCleanup = () => {};
        return;
    }

    const revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add("is-in-view");
                revealObserver.unobserve(entry.target);
            });
        },
        {
            threshold: 0.18,
            rootMargin: "0px 0px -10% 0px"
        }
    );

    revealTargets.forEach((element) => revealObserver.observe(element));

    const sectionObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                entry.target.classList.toggle(
                    "is-active-section",
                    entry.isIntersecting && entry.intersectionRatio >= 0.34
                );
            });
        },
        {
            threshold: [0.2, 0.34, 0.6],
            rootMargin: "-8% 0px -20% 0px"
        }
    );

    sections.forEach((section) => sectionObserver.observe(section));

    const observer = new MutationObserver(() => {
        if (!heroCopy.isConnected || !document.body.classList.contains("landing-page")) {
            cleanup();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    function cleanup() {
        revealObserver.disconnect();
        sectionObserver.disconnect();
        observer.disconnect();
        if (window.__lexiCourtLandingMotionCleanup === cleanup) {
            delete window.__lexiCourtLandingMotionCleanup;
        }
    }

    window.__lexiCourtLandingMotionCleanup = cleanup;
}
