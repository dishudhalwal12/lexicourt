import { readFile } from "node:fs/promises";
import path from "node:path";

const LEGACY_ROOT = path.join(process.cwd(), "legacy");

const HTML_FILES = new Set([
  "index.html",
  "login.html",
  "register.html",
  "dashboard.html",
  "cases.html",
  "case-detail.html",
  "assistant.html",
  "drafts.html",
  "timeline.html",
  "admin.html",
  "client-dashboard.html",
  "settings.html"
]);

const DIRECTORY_MAP = new Map<string, string>([
  ["css", path.join(LEGACY_ROOT, "css")],
  ["js", path.join(LEGACY_ROOT, "js")],
  ["assets", path.join(LEGACY_ROOT, "assets")],
  ["context", path.join(process.cwd(), "context")]
]);

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

function isSafePath(candidate: string, base: string) {
  const relative = path.relative(base, candidate);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function resolveLegacyFile(parts: string[]) {
  if (!parts.length) {
    return null;
  }

  const [head, ...rest] = parts;

  if (HTML_FILES.has(head) && rest.length === 0) {
    return path.join(LEGACY_ROOT, head);
  }

  const base = DIRECTORY_MAP.get(head);
  if (!base) {
    return null;
  }

  const candidate = path.resolve(base, ...rest);
  if (!isSafePath(candidate, base)) {
    return null;
  }

  return candidate;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: pathParts } = await context.params;
  const filePath = resolveLegacyFile(pathParts);

  if (!filePath) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const file = await readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const contentType = CONTENT_TYPES[extension] || "application/octet-stream";

    const shouldAvoidCache = [".html", ".js", ".mjs"].includes(extension);

    return new Response(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": shouldAvoidCache ? "no-store, max-age=0" : "public, max-age=3600"
      }
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
