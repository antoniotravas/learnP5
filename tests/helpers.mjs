// Ajudas dos testes: servidor estático de public/, Chrome (Playwright) e o servidor PHP (se existir).

import { spawn, spawnSync } from "node:child_process";
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json" };

/** Servidor só com os ficheiros de public/ (chega para correr os sketches e as verificações). */
export async function staticServer() {
  const pub = path.join(ROOT, "public");
  const server = createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    const file = path.join(pub, url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname));
    if (!file.startsWith(pub) || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404).end("Not Found");
      return;
    }
    // Os iframes dos sketches (origem opaca) carregam o p5.js e o harness com crossorigin.
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream", "Access-Control-Allow-Origin": "*" });
    createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((r) => server.close(r)) };
}

/** Abre o Chrome instalado no computador. Devolve null se não houver Chrome. */
export async function launchChrome() {
  const { chromium } = await import("playwright-core");
  try {
    return await chromium.launch({ channel: "chrome" });
  } catch {
    return null;
  }
}

export const hasPhp = () => spawnSync("php", ["-v"]).status === 0;

const freePort = () =>
  new Promise((resolve) => {
    const s = net.createServer().listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });

/** Arranca o backend PHP (`php -S`) com a base de dados `db`. Devolve {url, stop}. */
export async function launchPhp(db, env = {}) {
  const port = await freePort();
  const proc = spawn("php", ["-S", `127.0.0.1:${port}`, path.join(ROOT, "server", "dev-router.php")], {
    env: { ...process.env, LEARNP5_DB: db, LEARNP5_IGNORE_LOCAL_CONFIG: "1", ...env },
    stdio: "ignore",
  });
  for (let i = 0; i < 100; i++) {
    const ok = await new Promise((r) => {
      const sock = net.connect(port, "127.0.0.1", () => {
        sock.end();
        r(true);
      });
      sock.on("error", () => r(false));
    });
    if (ok) break;
    await new Promise((r) => setTimeout(r, 50));
  }
  return { url: `http://127.0.0.1:${port}`, stop: () => proc.kill() };
}
