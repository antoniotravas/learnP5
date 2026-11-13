// Gera dist/learnp5-site.zip para publicar no DirectAdmin (extrair em domains/<domínio>/).
//
//     node tools/build_dist.mjs        (ou: npm run dist)
//
// O zip tem public_html/ (o conteúdo de public/) e server/ (com um config.local.php de produção, feito a partir do
// server/config.local.php deste PC, se existir, mas com cookies seguros e a base de dados no sítio por omissão).
// Não leva data/: a base de dados do servidor nunca é substituída. Não há chaves de API (não há IA).

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { ROOT } from "./content_lib.mjs";

const OUT = path.join(ROOT, "dist", "learnp5-site.zip");

// Valores de produção que substituem os do config.local.php local.
const PRODUCTION = {
  LEARNP5_DB: "", // vazio = ../data/learnp5.db, fora do public_html
  LEARNP5_SECURE_COOKIES: "1",
};

function localConfig() {
  const file = path.join(ROOT, "server", "config.local.php");
  if (!existsSync(file)) return {};
  const r = spawnSync("php", ["-r", `echo json_encode(require ${JSON.stringify(file)});`], { encoding: "utf8" });
  if (r.status !== 0) throw new Error("Para ler o server/config.local.php é preciso ter o PHP instalado.");
  return JSON.parse(r.stdout);
}

const phpStr = (s) => `'${String(s).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;

function productionConfig() {
  const cfg = { ...localConfig(), ...PRODUCTION };
  const lines = Object.entries(cfg).map(([k, v]) => `    ${phpStr(k)} => ${phpStr(v)},`);
  return `<?php\n// Configuração de produção (gerada por tools/build_dist.mjs).\nreturn [\n${lines.join("\n")}\n];\n`;
}

function* walk(dir) {
  for (const name of readdirSync(dir).sort()) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else yield full;
  }
}

/** Escreve um .zip (deflate) com as entradas [{name, data}]. */
function zip(entries) {
  const chunks = [];
  const central = [];
  let offset = 0;
  // A data de geração, não uma data fixa: o LiteSpeed do servidor guarda versões comprimidas (gzip/br) dos ficheiros
  // e só as renova quando a data de modificação muda. Com uma data fixa, continuava a servir o código antigo.
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, "utf8");
    const deflated = zlib.deflateRawSync(data, { level: 9 });
    const crc = zlib.crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // nomes em UTF-8
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(deflated.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    chunks.push(local, nameBuf, deflated);
    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4);
    cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(0x0800, 8);
    cen.writeUInt16LE(8, 10);
    cen.writeUInt16LE(dosTime, 12);
    cen.writeUInt16LE(dosDate, 14);
    cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(deflated.length, 20);
    cen.writeUInt32LE(data.length, 24);
    cen.writeUInt16LE(nameBuf.length, 28);
    cen.writeUInt32LE(offset, 42);
    central.push(cen, nameBuf);
    offset += local.length + nameBuf.length + deflated.length;
  }
  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, centralBuf, end]);
}

if (!existsSync(path.join(ROOT, "server", "content.json"))) {
  console.error("Falta server/content.json (corre node tools/build_content.mjs).");
  process.exit(1);
}
const entries = [];
const pub = path.join(ROOT, "public");
const publicFiles = [...walk(pub)];

// Alguns servidores (o LiteSpeed do alojamento) ignoram o «no-cache» do .htaccess e guardam os .js e .css em cache
// durante 30 dias. Por isso, cada publicação acrescenta ?v=<versão> aos endereços em index.html e nos .js:
// quando o código muda, o endereço muda e o browser vai buscar a versão nova.
const hash = createHash("sha256");
for (const f of publicFiles) hash.update(path.relative(pub, f)).update(readFileSync(f));
const VERSION = hash.digest("hex").slice(0, 10);
const stamp = (text) =>
  text
    .replace(/(["'])(\/static\/[^"'?]+\.(?:js|css))\1/g, `$1$2?v=${VERSION}$1`)
    .replace(/(from\s+["']\.\/[^"'?]+\.js)(["'])/g, `$1?v=${VERSION}$2`);

for (const f of publicFiles) {
  const name = "public_html/" + path.relative(pub, f).split(path.sep).join("/");
  const ext = path.extname(f);
  const data = (ext === ".html" || ext === ".js") && !name.includes("/vendor/") ? Buffer.from(stamp(readFileSync(f, "utf8")), "utf8") : readFileSync(f);
  entries.push({ name, data });
}
const srv = path.join(ROOT, "server");
for (const f of walk(srv)) {
  const rel = path.relative(srv, f).split(path.sep).join("/");
  if (rel !== "config.local.php" && rel !== "dev-router.php") entries.push({ name: "server/" + rel, data: readFileSync(f) });
}
entries.push({ name: "server/config.local.php", data: Buffer.from(productionConfig(), "utf8") });
mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, zip(entries));
console.log(`dist/learnp5-site.zip: ${entries.length} ficheiros, ${(statSync(OUT).size / 1e6).toFixed(1)} MB, versão ${VERSION}`);
