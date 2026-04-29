import { getCurrentUserProfile, logoutUser, listenToAuthState } from "./auth-service.js";
import {
    formatFirestoreDate,
    getCasesForCurrentUser,
    getDocumentsByCase,
    getDraftsByCase,
    getReadinessChecksByCase
} from "./firestore-service.js";

let topbarChromeBound = false;
let topbarCleanup = null;
let storyMotionCleanup = null;
let authSyncCleanup = null;
let themeToggleCleanup = null;

const THEME_STORAGE_KEY = "lexicourt-theme";

function getStoredTheme() {
    try {
        return window.localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
    } catch (error) {
        return "dark";
    }
}

function applyTheme(theme) {
    const nextTheme = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme === "light" ? "light" : "dark";

    const syncBodyTheme = () => {
        document.body?.setAttribute("data-theme", nextTheme);
    };
    syncBodyTheme();
    if (!document.body) {
        document.addEventListener("DOMContentLoaded", syncBodyTheme, { once: true });
    }

    try {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        document.cookie = `${THEME_STORAGE_KEY}=${nextTheme}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (error) {
        console.warn("Unable to persist theme preference:", error);
    }

    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
        const icon = button.querySelector("[data-theme-icon]");
        const label = button.querySelector("[data-theme-label]");
        const isLight = nextTheme === "light";

        button.setAttribute("aria-pressed", String(isLight));
        button.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
        button.title = isLight ? "Switch to dark mode" : "Switch to light mode";

        if (icon) {
            icon.className = `bi ${isLight ? "bi-moon-stars-fill" : "bi-brightness-high-fill"}`;
        }

        if (label) {
            label.textContent = isLight ? "Dark mode" : "Light mode";
        }
    });
}

function createThemeToggleButton() {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-toggle-btn";
    button.setAttribute("data-theme-toggle", "true");
    button.innerHTML = `
      <i class="bi bi-brightness-high-fill" data-theme-icon="true" aria-hidden="true"></i>
      <span data-theme-label="true">Light mode</span>
    `;
    button.addEventListener("click", () => {
        const nextTheme = document.body?.getAttribute("data-theme") === "light" ? "dark" : "light";
        applyTheme(nextTheme);
    });
    return button;
}

function initThemeToggle() {
    const topbar = document.querySelector(".topbar");
    const navActions = topbar?.querySelector(".nav-actions");
    if (!topbar || !navActions) {
        themeToggleCleanup?.();
        themeToggleCleanup = null;
        return;
    }

    const ensureToggle = () => {
        let button = navActions.querySelector("[data-theme-toggle]");
        if (!button) {
            button = createThemeToggleButton();
            navActions.prepend(button);
        }
        applyTheme(document.body?.getAttribute("data-theme") || getStoredTheme());
    };

    ensureToggle();

    themeToggleCleanup?.();
    const observer = new MutationObserver(() => {
        ensureToggle();
    });
    observer.observe(navActions, { childList: true });

    themeToggleCleanup = () => {
        observer.disconnect();
        themeToggleCleanup = null;
    };
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function toDate(value) {
    if (!value) {
        return null;
    }

    if (typeof value.toDate === "function") {
        return value.toDate();
    }

    if (value instanceof Date) {
        return value;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function ensureNotificationsModal() {
    let modal = document.getElementById("workspaceNotificationsModal");
    if (modal) {
        return modal;
    }

    modal = document.createElement("div");
    modal.className = "modal fade";
    modal.id = "workspaceNotificationsModal";
    modal.tabIndex = -1;
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content workspace-modal-shell">
          <div class="modal-header">
            <div>
              <div class="document-modal-kicker">Workspace Signals</div>
              <h2 class="modal-title">Notifications</h2>
            </div>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="document-modal-copy">Live hearing reminders, missing-file checks, and matter health alerts appear here.</div>
            <div id="workspaceNotificationsState" class="metric-label">Loading live workspace signals...</div>
            <div id="workspaceNotificationsList" class="notification-feed"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

function renderNotifications(items) {
    const state = document.getElementById("workspaceNotificationsState");
    const list = document.getElementById("workspaceNotificationsList");
    if (!state || !list) {
        return;
    }

    if (!items.length) {
        state.textContent = "All clear. No urgent workspace alerts right now.";
        list.innerHTML = `
          <article class="notification-item">
            <span class="notification-severity notification-severity-clear">Clear</span>
            <div class="notification-body">
              <strong>Workspace is looking good</strong>
              <p>Your hearing schedule, drafts, and document records are currently in a healthy state.</p>
            </div>
          </article>
        `;
        return;
    }

    state.textContent = `${items.length} live workspace signal${items.length === 1 ? "" : "s"} found.`;
    list.innerHTML = items
        .map(
            (item) => `
              <article class="notification-item">
                <span class="notification-severity notification-severity-${escapeHtml(item.level || "info")}">${escapeHtml(item.levelLabel || "Info")}</span>
                <div class="notification-body">
                  <strong>${escapeHtml(item.title)}</strong>
                  <p>${escapeHtml(item.body)}</p>
                  ${item.href ? `<a class="inline-link" href="${escapeHtml(item.href)}">Open matter</a>` : ""}
                </div>
              </article>
            `
        )
        .join("");
}

async function buildNotifications(profile) {
    const cases = await getCasesForCurrentUser();
    const now = Date.now();
    const items = [];
    const isClientProfile = profile?.role === "client";

    const limitedCases = cases.slice(0, 8);
    const relatedData = await Promise.all(
        limitedCases.map(async (caseItem) => {
            const documentsPromise = getDocumentsByCase(caseItem.id);
            const draftsPromise = isClientProfile ? Promise.resolve([]) : getDraftsByCase(caseItem.id);
            const readinessChecksPromise = isClientProfile ? Promise.resolve([]) : getReadinessChecksByCase(caseItem.id);
            const [documents, drafts, readinessChecks] = await Promise.all([
                documentsPromise,
                draftsPromise,
                readinessChecksPromise
            ]);

            return {
                caseItem,
                documents,
                drafts,
                readinessChecks
            };
        })
    );

    relatedData.forEach(({ caseItem, documents, drafts, readinessChecks }) => {
        const hearingDate = toDate(caseItem.nextHearingDate);
        const dayDelta = hearingDate ? Math.ceil((hearingDate.getTime() - now) / 86400000) : null;
        const href = `case-detail.html?caseId=${encodeURIComponent(caseItem.id)}`;

        if (hearingDate && dayDelta !== null && dayDelta >= 0 && dayDelta <= 7) {
            items.push({
                level: dayDelta <= 2 ? "high" : "medium",
                levelLabel: dayDelta <= 2 ? "Urgent" : "Soon",
                title: `${caseItem.caseTitle || "Matter"} hearing is coming up`,
                body: `Next hearing is on ${formatFirestoreDate(caseItem.nextHearingDate)}. Review the file before the court date closes in.`,
                href
            });
        }

        if (!hearingDate && caseItem.status === "Active") {
            items.push({
                level: "medium",
                levelLabel: "Review",
                title: `${caseItem.caseTitle || "Matter"} has no next hearing date`,
                body: "Update the matter timeline so the workspace can track hearing readiness properly.",
                href
            });
        }

        if (!documents.length) {
            items.push({
                level: "medium",
                levelLabel: "Missing",
                title: `${caseItem.caseTitle || "Matter"} has no document record yet`,
                body: isClientProfile
                    ? "No document record has been shared for this matter yet."
                    : "Add at least one case document so summaries, timelines, and recall signals become more reliable.",
                href
            });
        }

        if (!isClientProfile && !drafts.length && caseItem.status === "Active") {
            items.push({
                level: "info",
                levelLabel: "Draft",
                title: `${caseItem.caseTitle || "Matter"} is ready for a first draft`,
                body: "No draft has been saved yet for this active matter. Generate one to speed up the next filing cycle.",
                href: `drafts.html?caseId=${encodeURIComponent(caseItem.id)}`
            });
        }

        const latestCheck = readinessChecks[0];
        if (!isClientProfile && latestCheck?.missingItems?.length) {
            items.push({
                level: "high",
                levelLabel: "Action",
                title: `${caseItem.caseTitle || "Matter"} has readiness gaps`,
                body: latestCheck.missingItems[0],
                href
            });
        }
    });

    if (profile?.role === "admin") {
        const pendingCount = cases.filter((item) => item.status === "Pending").length;
        if (pendingCount) {
            items.unshift({
                level: "info",
                levelLabel: "Admin",
                title: `${pendingCount} matter${pendingCount === 1 ? "" : "s"} need admin review`,
                body: "Pending matters across the workspace should be reviewed for movement, hearing dates, and completeness.",
                href: "admin.html"
            });
        }
    }

    const rank = { high: 0, medium: 1, info: 2, clear: 3 };
    return items
        .sort((a, b) => (rank[a.level] ?? 9) - (rank[b.level] ?? 9))
        .slice(0, 8);
}

function initNotificationCenter(profile) {
    const buttons = Array.from(document.querySelectorAll("[data-notification-trigger]"));
    if (!buttons.length) {
        return;
    }

    const modalEl = ensureNotificationsModal();

    buttons.forEach((button) => {
        if (button.dataset.notificationsBound === "true") {
            return;
        }

        button.dataset.notificationsBound = "true";
        button.addEventListener("click", async (event) => {
            event.preventDefault();

            const modal = window.bootstrap?.Modal
                ? window.bootstrap.Modal.getOrCreateInstance(modalEl)
                : null;
            const state = document.getElementById("workspaceNotificationsState");
            const list = document.getElementById("workspaceNotificationsList");

            if (state) {
                state.textContent = "Loading live workspace signals...";
            }
            if (list) {
                list.innerHTML = "";
            }

            modal?.show();

            try {
                const notifications = await buildNotifications(profile);
                renderNotifications(notifications);
            } catch (error) {
                console.error("Unable to load notifications:", error);
                renderNotifications([]);
                if (state) {
                    state.textContent = "Unable to load live notifications right now.";
                }
            }
        });
    });
}

export function initTopbarChrome() {
    initStoryMotion();
    applyTheme(document.body?.getAttribute("data-theme") || getStoredTheme());

    const topbar = document.querySelector(".topbar");
    if (!topbar) {
        if (!topbarChromeBound && document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", initTopbarChrome, { once: true });
        }
        return;
    }

    topbarCleanup?.();
    const isWorkspacePage = document.body.classList.contains("workspace-page");
    let ticking = false;

    const syncTopbarState = () => {
        const isCondensed = !isWorkspacePage && window.scrollY > 28;

        topbar.classList.toggle("is-condensed", isCondensed);
        topbar.classList.remove("is-hidden");
        document.body.classList.toggle("nav-is-condensed", isCondensed);
        document.body.classList.remove("nav-is-hidden");
        ticking = false;
    };

    const requestSync = () => {
        if (ticking) {
            return;
        }

        ticking = true;
        window.requestAnimationFrame(syncTopbarState);
    };

    syncTopbarState();
    initThemeToggle();
    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", requestSync);

    topbarCleanup = () => {
        window.removeEventListener("scroll", requestSync);
        window.removeEventListener("resize", requestSync);
        themeToggleCleanup?.();
        topbar.classList.remove("is-condensed", "is-hidden");
        document.body.classList.remove("nav-is-condensed", "nav-is-hidden");
        topbarCleanup = null;
        topbarChromeBound = false;
    };
    topbarChromeBound = true;
}

function initStoryMotion() {
    storyMotionCleanup?.();

    const selectors = [
        ".page-header",
        ".panel-card",
        ".meta-tile",
        ".doc-card",
        ".chat-side-panel",
        ".output-card",
        ".timeline-card",
        ".timeline-event",
        ".hero-copy",
        ".feature-card",
        ".classic-step",
        ".auth-showcase",
        ".auth-card",
        ".table-card",
        ".assistant-card",
        ".summary-metric"
    ];

    const elements = [...document.querySelectorAll(selectors.join(","))];
    const currentPage = document.body?.getAttribute("data-page") || "";

    if (!elements.length) {
        return;
    }

    if (currentPage === "dashboard") {
        elements.forEach((element) => {
            element.classList.remove("story-reveal");
            element.classList.remove("is-visible");
            element.style.removeProperty("--story-delay");
        });
        return;
    }

    elements.forEach((element, index) => {
        if (!element.classList.contains("story-reveal")) {
            element.classList.add("story-reveal");
        }

        if (!element.style.getPropertyValue("--story-delay")) {
            element.style.setProperty("--story-delay", `${Math.min(index * 55, 420)}ms`);
        }
    });

    const pendingElements = elements.filter((element) => !element.classList.contains("is-visible"));

    if (!pendingElements.length) {
        return;
    }

    if (typeof window.IntersectionObserver !== "function") {
        pendingElements.forEach((element) => element.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        },
        {
            threshold: 0.16,
            rootMargin: "0px 0px -8% 0px"
        }
    );

    pendingElements.forEach((element) => observer.observe(element));

    // Fail open so legacy pages never stay blank if the observer lifecycle gets interrupted.
    const fallbackId = window.setTimeout(() => {
        pendingElements.forEach((element) => element.classList.add("is-visible"));
        observer.disconnect();
        storyMotionCleanup = null;
    }, 1200);

    storyMotionCleanup = () => {
        window.clearTimeout(fallbackId);
        observer.disconnect();
        storyMotionCleanup = null;
    };
}

// Call this function once the DOM is loaded to wire up standard UI elements
export function initSharedUI() {
    initTopbarChrome();

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                await logoutUser();
                window.location.href = "login.html";
            } catch (err) {
                console.error("Logout failed:", err);
            }
        });
    }

    // Sync User Name in Navbar
    authSyncCleanup?.();
    authSyncCleanup = listenToAuthState(async (user) => {
        if (user) {
            const profile = await getCurrentUserProfile(user.uid);
            const userNameEl = document.getElementById("navUserName");
            const roleEl = document.getElementById("navUserRole");

            if (userNameEl) {
                userNameEl.textContent = profile?.fullName || user.displayName || user.email || "LexiCourt User";
            }
            if (roleEl) {
                roleEl.textContent = String(profile?.role || "user").toUpperCase();
            }

            initNotificationCenter(profile);
        }
    });
}
