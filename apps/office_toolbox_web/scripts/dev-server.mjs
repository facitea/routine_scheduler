import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const preferredPort = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
const root = resolve(process.argv[2] || ".");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".vue": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon",
};

function getFilePath(url) {
  const parsedUrl = new URL(url, `http://${host}:${preferredPort}`);
  const decoded = decodeURIComponent(parsedUrl.pathname);
  const requested = decoded === "/" ? "/index.html" : decoded;
  const filePath = normalize(join(root, requested));
  const rootWithSep = root.endsWith(sep) ? root : `${root}${sep}`;

  if (filePath !== root && !filePath.startsWith(rootWithSep)) {
    return null;
  }
  if (existsSync(filePath) && statSync(filePath).isFile()) {
    return filePath;
  }
  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    const indexPath = join(filePath, "index.html");
    if (existsSync(indexPath) && statSync(indexPath).isFile()) {
      return indexPath;
    }
  }
  return join(root, "index.html");
}

const server = createServer((request, response) => {
  const filePath = getFilePath(request.url || "/");
  if (!filePath || !existsSync(filePath)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const contentType = contentTypes[extname(filePath).toLowerCase()] || "application/octet-stream";
  response.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp",
  });
  createReadStream(filePath).pipe(response);
});

function listen(port, retries = 20) {
  server.once("error", (error) => {
    if ((error.code === "EADDRINUSE" || error.code === "EACCES") && retries > 0) {
      const nextPort = port + 1;
      console.warn(`Port ${port} is unavailable. Trying ${nextPort}...`);
      listen(nextPort, retries - 1);
      return;
    }

    console.error(error);
    process.exitCode = 1;
  });

  server.listen(port, host, () => {
    console.log(`Serving ${root} at http://${host}:${port}/`);
  });
}

listen(preferredPort);
