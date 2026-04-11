import type { Metadata } from "next";
import Script from "next/script";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../legacy/css/main.css";
import "./globals.css";

const rootHydrationGuardScript = `
  (() => {
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

export const metadata: Metadata = {
  title: "LexiCourt",
  description: "AI-powered legal assistant and virtual court case management system",
  icons: {
    icon: "/assets/favicon.svg",
    shortcut: "/assets/favicon.svg",
    apple: "/assets/favicon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="root-hydration-guard" strategy="beforeInteractive">
          {rootHydrationGuardScript}
        </Script>
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
