"use client";

import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    Chart?: unknown;
    bootstrap?: unknown;
    jspdf?: unknown;
  }
}

type LegacyPageMountProps = {
  htmlFile: string;
};

type InjectedScript = {
  element: HTMLScriptElement;
};

async function ensureRuntimeDependencies() {
  if (typeof window === "undefined") {
    return;
  }

  if (!window.bootstrap) {
    const bootstrapModule = await import("bootstrap");
    window.bootstrap = bootstrapModule;
  }

  if (!window.Chart) {
    const chartModule = await import("chart.js/auto");
    window.Chart = chartModule.default;
  }

  if (!window.jspdf) {
    const jspdfModule = await import("jspdf");
    window.jspdf = jspdfModule;
  }
}

function setBodyAttributesFromDocument(doc: Document) {
  const body = doc.body;
  document.body.className = body.className;

  const dataPage = body.getAttribute("data-page");
  if (dataPage) {
    document.body.setAttribute("data-page", dataPage);
  } else {
    document.body.removeAttribute("data-page");
  }
}

async function injectScripts(doc: Document, registry: InjectedScript[]) {
  const scripts = Array.from(doc.querySelectorAll("script"));

  for (const original of scripts) {
    const script = document.createElement("script");

    for (const attribute of Array.from(original.attributes)) {
      script.setAttribute(attribute.name, attribute.value);
    }

    if (!original.src) {
      script.textContent = original.textContent;
    }

    registry.push({ element: script });

    const loaded = new Promise<void>((resolve, reject) => {
      script.addEventListener("load", () => resolve(), { once: true });
      script.addEventListener("error", () => reject(new Error(`Failed to load ${original.src || "inline script"}`)), {
        once: true
      });

      if (!original.src) {
        resolve();
      }
    });

    document.body.appendChild(script);
    await loaded;
  }
}

export function LegacyPageMount({ htmlFile }: LegacyPageMountProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string>("");
  const sourceUrl = useMemo(() => `/legacy/${htmlFile}`, [htmlFile]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) {
      return;
    }

    let isActive = true;
    const injectedScripts: InjectedScript[] = [];
    const previousBodyClass = document.body.className;
    const previousDataPage = document.body.getAttribute("data-page");

    async function mountLegacyPage() {
      try {
        setState("loading");
        setError("");

        await ensureRuntimeDependencies();
        const response = await fetch(sourceUrl, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Unable to load ${htmlFile}.`);
        }

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        setBodyAttributesFromDocument(doc);

        const mountNode = containerRef.current;
        if (!mountNode) {
          return;
        }

        const bodyClone = doc.body.cloneNode(true) as HTMLBodyElement;
        bodyClone.querySelectorAll("script").forEach((script) => script.remove());
        mountNode.innerHTML = bodyClone.innerHTML;

        await injectScripts(doc, injectedScripts);

        if (isActive) {
          setState("ready");
        }
      } catch (mountError) {
        console.error(mountError);
        if (isActive) {
          setError(mountError instanceof Error ? mountError.message : "Unable to load the page.");
          setState("error");
        }
      }
    }

    mountLegacyPage();

    return () => {
      isActive = false;
      injectedScripts.forEach(({ element }) => element.remove());
      document.body.className = previousBodyClass;

      if (previousDataPage) {
        document.body.setAttribute("data-page", previousDataPage);
      } else {
        document.body.removeAttribute("data-page");
      }

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [hasMounted, htmlFile, sourceUrl]);

  if (state === "error") {
    return (
      <main className="legacy-runtime-shell">
        <section className="legacy-runtime-card">
          <span className="legacy-runtime-kicker">Runtime State</span>
          <h1>Unable to load page</h1>
          <p>{error}</p>
          <button className="legacy-runtime-button" type="button" onClick={() => window.location.reload()}>
            Retry loading
          </button>
        </section>
      </main>
    );
  }

  if (!hasMounted) {
    return null;
  }

  return (
    <>
      <div ref={containerRef} />
    </>
  );
}
