// Lê o conteúdo do curso: um ficheiro Markdown por módulo em tools/content/ (por ordem do nome).
//
// Formato de cada ficheiro:
//
//   ---
//   id: formas
//   track: Desenho                  (Desenho, Animação ou Interação)
//   title: Formas básicas
//   icon: 🔷
//   summary: Uma frase para o cartão do módulo.
//   ---
//   # A lição, em Markdown
//   ...
//   === exercicio boneco-de-neve      (um bloco destes por exercício)
//   title: Boneco de neve
//   difficulty: 1                   (1, 2 ou 3 estrelas)
//   badge: ressalto                 (opcional: medalha própria)
//   --- enunciado
//   Markdown com o que o aluno tem de fazer.
//   --- inicio
//   Código que aparece no editor no início (pode ficar vazio).
//   --- pista
//   Uma pista curta.
//   --- teste: Nome da verificação
//   expressão JavaScript com `verifica` (pode ocupar várias linhas)
//   => valor esperado, em JSON
//   --- solucao
//   Solução de referência (não vai para o site: só os testes a usam).

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const CONTENT_DIR = path.join(ROOT, "tools", "content");
export const TRACKS = ["Desenho", "Animação", "Interação"];
export const BADGES = ["ressalto"];

const trimBlock = (lines) => {
  let a = 0;
  let b = lines.length;
  while (a < b && !lines[a].trim()) a++;
  while (b > a && !lines[b - 1].trim()) b--;
  return lines.slice(a, b);
};

function parseHeader(lines, where) {
  const out = {};
  for (const line of lines) {
    if (!line.trim()) continue;
    const m = /^(\w+):\s*(.*)$/.exec(line);
    if (!m) throw new Error(`${where}: linha inválida no cabeçalho: ${line}`);
    out[m[1]] = m[2].trim();
  }
  return out;
}

function parseExercise(id, lines, where) {
  const first = lines.findIndex((l) => l.startsWith("--- "));
  if (first < 0) throw new Error(`${where}: o exercício ${id} não tem secções (--- enunciado, ...)`);
  const head = parseHeader(lines.slice(0, first), `${where}/${id}`);
  const ex = { id, title: head.title, difficulty: Number(head.difficulty), statement: "", starter: "", hint: "", tests: [], solution: null };
  if (head.badge) ex.badge = head.badge;
  let section = null;
  let body = [];
  const flush = () => {
    if (!section) return;
    const text = trimBlock(body);
    const [kind, name] = section;
    if (kind === "enunciado") ex.statement = text.join("\n");
    else if (kind === "pista") ex.hint = text.join("\n");
    else if (kind === "inicio") ex.starter = text.length ? text.join("\n") + "\n" : "";
    else if (kind === "solucao") ex.solution = text.join("\n") + "\n";
    else if (kind === "teste") {
      const k = text.findLastIndex((l) => l.startsWith("=> "));
      if (k < 0) throw new Error(`${where}/${id}: o teste «${name}» não tem a linha «=> esperado»`);
      let expected;
      try {
        expected = JSON.parse(text.slice(k).join("\n").slice(3));
      } catch (e) {
        throw new Error(`${where}/${id}: o valor esperado do teste «${name}» não é JSON válido`);
      }
      ex.tests.push({ name, expr: text.slice(0, k).join("\n"), expected });
    } else throw new Error(`${where}/${id}: secção desconhecida «${kind}»`);
  };
  for (const line of lines.slice(first)) {
    const m = /^--- (\w+)(?::\s*(.*))?$/.exec(line);
    if (m) {
      flush();
      section = [m[1], (m[2] ?? "").trim()];
      body = [];
    } else body.push(line);
  }
  flush();
  return ex;
}

export function parseModule(text, where) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  if (lines[0] !== "---") throw new Error(`${where}: tem de começar com um cabeçalho entre linhas ---`);
  const end = lines.indexOf("---", 1);
  const head = parseHeader(lines.slice(1, end), where);
  const rest = lines.slice(end + 1);
  const starts = rest.map((l, i) => (/^=== exercicio \S+\s*$/.test(l) ? i : -1)).filter((i) => i >= 0);
  const lesson = trimBlock(rest.slice(0, starts[0] ?? rest.length)).join("\n") + "\n";
  const exercises = starts.map((s, k) => {
    const id = rest[s].split(/\s+/)[2];
    return parseExercise(id, rest.slice(s + 1, starts[k + 1] ?? rest.length), where);
  });
  return { id: head.id, track: head.track, title: head.title, icon: head.icon, summary: head.summary, lesson, exercises };
}

/** Todos os módulos, pela ordem dos ficheiros (com as soluções). */
export function loadModules() {
  return readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => parseModule(readFileSync(path.join(CONTENT_DIR, f), "utf8"), f));
}

/** Confirma que o conteúdo está bem formado. Devolve a lista de problemas (vazia se estiver tudo bem). */
export function validate(modules) {
  const problems = [];
  const ids = new Set();
  const seen = (id, where) => {
    if (ids.has(id)) problems.push(`${where}: id repetido «${id}»`);
    ids.add(id);
  };
  let lastTrack = 0;
  for (const m of modules) {
    seen(m.id, m.id);
    for (const k of ["id", "track", "title", "icon", "summary"]) if (!m[k]) problems.push(`${m.id}: falta «${k}»`);
    const t = TRACKS.indexOf(m.track);
    if (t < 0) problems.push(`${m.id}: tema desconhecido «${m.track}» (usa ${TRACKS.join(", ")})`);
    if (t < lastTrack) problems.push(`${m.id}: os módulos de cada tema têm de estar seguidos`);
    lastTrack = Math.max(lastTrack, t);
    if (!m.exercises.length) problems.push(`${m.id}: não tem exercícios`);
    for (const ex of m.exercises) {
      const where = `${m.id}/${ex.id}`;
      seen(ex.id, where);
      if (!/^[a-z0-9-]+$/.test(ex.id)) problems.push(`${where}: o id só pode ter minúsculas, números e hífenes`);
      if (!ex.title) problems.push(`${where}: falta o título`);
      if (![1, 2, 3].includes(ex.difficulty)) problems.push(`${where}: difficulty tem de ser 1, 2 ou 3`);
      if (!ex.statement) problems.push(`${where}: falta o enunciado`);
      if (!ex.hint) problems.push(`${where}: falta a pista`);
      if (!ex.tests.length) problems.push(`${where}: não tem testes`);
      if (!ex.solution) problems.push(`${where}: falta a solução de referência`);
      if (ex.badge && !BADGES.includes(ex.badge)) problems.push(`${where}: medalha desconhecida «${ex.badge}»`);
      for (const t of ex.tests) if (!t.name || !t.expr) problems.push(`${where}: há um teste sem nome ou sem expressão`);
    }
  }
  return problems;
}

/** O que vai para server/content.json: tudo menos as soluções. */
export function publicContent(modules) {
  return modules.map((m) => ({ ...m, exercises: m.exercises.map(({ solution, ...ex }) => ex) }));
}
