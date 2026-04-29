import type { Metadata } from "next";
import { cookies } from "next/headers";
import Script from "next/script";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../legacy/css/main.css";
import "./globals.css";

const rootHydrationGuardScript = `
  (() => {
    const isRecoverableFirebasePermission = (value) => {
      const text = String(value && (value.message || value.code || value) || "");
      return /permission-denied|missing or insufficient permissions/i.test(text);
    };

    const originalConsoleError = console.error.bind(console);
    console.error = (...args) => {
      if (args.some(isRecoverableFirebasePermission)) {
        console.warn("[LexiCourt Firebase fallback]", ...args);
        return;
      }

      originalConsoleError(...args);
    };

    window.addEventListener("unhandledrejection", (event) => {
      if (isRecoverableFirebasePermission(event.reason)) {
        event.preventDefault();
        console.warn("[LexiCourt Firebase fallback] Recovered from denied Firebase operation.", event.reason);
      }
    });

    const exactAttributes = new Set(["bis_register"]);
    const prefixAttributes = ["__processed_"];

    const shouldRemoveAttribute = (name) =>
      exactAttributes.has(name) ||
      prefixAttributes.some((prefix) => name.startsWith(prefix));

    const cleanRootAttributes = (node) => {
      if (!node || typeof node.getAttributeNames !== "function") {
        return;
      }

      for (const name of node.getAttributeNames()) {
        if (shouldRemoveAttribute(name)) {
          node.removeAttribute(name);
        }
      }
    };

    const cleanRoots = () => {
      cleanRootAttributes(document.documentElement);
      cleanRootAttributes(document.body);
    };

    cleanRoots();

    const observer = new MutationObserver(() => {
      cleanRoots();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true
    });

    window.addEventListener(
      "load",
      () => {
        cleanRoots();
        observer.disconnect();
      },
      { once: true }
    );

    window.setTimeout(() => {
      cleanRoots();
      observer.disconnect();
    }, 10000);
  })();
`;

const themeBootScript = `
  (() => {
    const applyTheme = () => {
      const theme = document.documentElement.dataset.theme || "dark";
      document.body?.setAttribute("data-theme", theme);
    };

    try {
      const savedTheme = window.localStorage.getItem("lexicourt-theme");
      const theme = savedTheme === "light" ? "light" : "dark";
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme === "light" ? "light" : "dark";
    } catch (error) {
      document.documentElement.dataset.theme = "dark";
      document.documentElement.style.colorScheme = "dark";
    }

    applyTheme();
    if (!document.body) {
      document.addEventListener("DOMContentLoaded", applyTheme, { once: true });
    }
  })();
`;

export const metadata: Metadata = {
  title: "LexiCourt",
  description: "AI-powered legal assistant and virtual court case management system",
  icons: {
    icon: "/assets/favicon.svg",
    shortcut: "/assets/favicon.svg",
    apple: "/assets/favicon.svg"
  }
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("lexicourt-theme")?.value;
  const initialTheme = themeCookie === "light" ? "light" : "dark";

  return (
    <html lang="en" data-theme={initialTheme} style={{ colorScheme: initialTheme }} suppressHydrationWarning>
      <head>
        <script id="theme-boot-inline" dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <Script id="root-hydration-guard" strategy="beforeInteractive">
          {rootHydrationGuardScript}
        </Script>
      </head>
      <body data-theme={initialTheme} suppressHydrationWarning>{children}</body>
    </html>
  );
}
