import { listenToAuthState, getCurrentUserProfile } from "./auth-service.js";

function runWhenDomReady(callback) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", callback, { once: true });
        return;
    }

    callback();
}

// Call this on protected pages
export function protectPage(allowedRoles, callback) {
    return listenToAuthState(async (user) => {
        if (!user) {
            // Not logged in -> redirect to login
            window.location.href = "login.html";
            return;
        }

        // Check user role
        const profile = await getCurrentUserProfile(user.uid);
        if (!profile) {
            console.error("User profile not found!");
            window.location.href = "login.html";
            return;
        }

        const userRole = profile.role || "client";
        if (!allowedRoles.includes(userRole)) {
            // Role not allowed -> redirect to appropriate dashboard
            if (userRole === "admin") window.location.href = "admin.html";
            else if (userRole === "lawyer") window.location.href = "dashboard.html";
            else window.location.href = "client-dashboard.html";
        } else {
            // Execute callback if allowed
            if (callback) {
                runWhenDomReady(() => callback(user, profile));
            }
        }
    });
}

// Call this on public pages (login, register) to prevent logged in users from seeing them
export function redirectIfLoggedIn() {
    return listenToAuthState(async (user) => {
        if (user) {
            const profile = await getCurrentUserProfile(user.uid);
            if(profile) {
                 const userRole = profile.role || "client";
                 if (userRole === "admin") window.location.href = "admin.html";
                 else if (userRole === "lawyer") window.location.href = "dashboard.html";
                 else window.location.href = "client-dashboard.html";
            }
        }
    });
}
