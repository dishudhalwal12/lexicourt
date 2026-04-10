import { auth } from "./firebase-config.js";
import {
    listenToAuthState,
    getCurrentUserProfile,
    readPostAuthIntent,
    clearPostAuthIntent,
    getDashboardPathForRole
} from "./auth-service.js";
import { navigateTo } from "./demo-state.js";

let protectedGuardRunId = 0;
let publicGuardRunId = 0;

function runWhenDomReady(callback) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", callback, { once: true });
        return;
    }

    callback();
}

// Call this on protected pages
export function protectPage(allowedRoles, callback) {
    let cancelled = false;
    const runId = ++protectedGuardRunId;
    const isInactive = () => cancelled || runId !== protectedGuardRunId;

    const guard = async () => {
        const pendingIntent = readPostAuthIntent();
        const user = await resolveActiveUser(Boolean(pendingIntent));

        if (isInactive()) {
            return;
        }

        if (!user) {
            clearPostAuthIntent();
            navigateTo("login.html", { replace: true });
            return;
        }

        const profile = await resolveProfile(user, pendingIntent);
        if (isInactive()) {
            return;
        }

        if (!profile) {
            clearPostAuthIntent();
            navigateTo("login.html", { replace: true });
            return;
        }

        const userRole = String(profile.role || "lawyer").toLowerCase();
        if (!allowedRoles.includes(userRole)) {
            clearPostAuthIntent();
            navigateTo(getDashboardPathForRole(userRole), { replace: true });
            return;
        }

        clearPostAuthIntent();
        if (callback) {
            runWhenDomReady(() => callback(user, { ...profile, role: userRole }));
        }
    };

    guard();

    return () => {
        cancelled = true;
        if (runId === protectedGuardRunId) {
            protectedGuardRunId += 1;
        }
    };
}

// Call this on public pages (login, register) to prevent logged in users from seeing them
export function redirectIfLoggedIn() {
    let cancelled = false;
    const runId = ++publicGuardRunId;
    const isInactive = () => cancelled || runId !== publicGuardRunId;

    const redirect = async () => {
        await waitForAuthInitialization();

        if (isInactive() || !auth.currentUser) {
            return;
        }

        const pendingIntent = readPostAuthIntent();
        const profile = await resolveProfile(auth.currentUser, pendingIntent);

        if (isInactive() || !profile) {
            return;
        }

        clearPostAuthIntent();
        navigateTo(getDashboardPathForRole(profile.role), { replace: true });
    };

    redirect();

    return () => {
        cancelled = true;
        if (runId === publicGuardRunId) {
            publicGuardRunId += 1;
        }
    };
}

async function waitForAuthInitialization() {
    if (typeof auth?.authStateReady === "function") {
        await auth.authStateReady();
        return;
    }

    await new Promise((resolve) => {
        const unsubscribe = listenToAuthState(() => {
            unsubscribe();
            resolve();
        });
    });
}

async function waitForUserRestore(timeoutMs = 3000) {
    return new Promise((resolve) => {
        let settled = false;
        const timeoutId = window.setTimeout(() => {
            if (settled) {
                return;
            }

            settled = true;
            unsubscribe();
            resolve(auth.currentUser || null);
        }, timeoutMs);

        const unsubscribe = listenToAuthState((user) => {
            if (!user || settled) {
                return;
            }

            settled = true;
            window.clearTimeout(timeoutId);
            unsubscribe();
            resolve(user);
        });
    });
}

async function resolveActiveUser(hasPendingIntent = false) {
    await waitForAuthInitialization();

    if (auth.currentUser) {
        return auth.currentUser;
    }

    if (!hasPendingIntent) {
        return null;
    }

    return waitForUserRestore();
}

async function resolveProfile(user, pendingIntent) {
    const profile = await getCurrentUserProfile(user.uid, {
        retries: pendingIntent ? 5 : 2,
        delayMs: pendingIntent ? 320 : 180
    });

    if (profile) {
        return profile;
    }

    if (!pendingIntent?.role) {
        return null;
    }

    return {
        uid: user.uid,
        email: user.email || "",
        fullName: user.displayName || "LexiCourt User",
        role: pendingIntent.role
    };
}
