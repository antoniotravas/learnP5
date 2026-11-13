// Gera dist/learnp5-site.zip para publicar no DirectAdmin (extrair em domains/<domínio>/).
//
//     node tools/build_dist.mjs        (ou: npm run dist)
//
// O zip tem public_html/ (o conteúdo de public/) e server/ (com um config.local.php de produção, feito a partir do
// server/config.local.php deste PC, se existir, mas com cookies seguros e a base de dados no sítio por omissão).
// Não leva data/: a base de dados do servidor nunca é substituída. Não há chaves de API (não há IA).

import { spawnSync } from "node:child_process";
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
  const dosTime = 0;
  const dosDate = ((2026 - 1980) << 9) | (1 << 5) | 1;
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
for (const f of walk(pub)) entries.push({ name: "public_html/" + path.relative(pub, f).split(path.sep).join("/"), data: readFileSync(f) });
const srv = path.join(ROOT, "server");
for (const f of walk(srv)) {
  const rel = path.relative(srv, f).split(path.sep).join("/");
  if (rel !== "config.local.php" && rel !== "dev-router.php") entries.push({ name: "server/" + rel, data: readFileSync(f) });
}
entries.push({ name: "server/config.local.php", data: Buffer.from(productionConfig(), "utf8") });
mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, zip(entries));
console.log(`dist/learnp5-site.zip: ${entries.length} ficheiros, ${(statSync(OUT).size / 1e6).toFixed(1)} MB`);
