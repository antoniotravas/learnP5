// Gera server/content.json a partir dos módulos em tools/content/*.md (formato explicado em content_lib.mjs).
//
//     node tools/build_content.mjs        (ou: npm run content)
//
// Depois de mudar o conteúdo, corre também os testes (npm test): verificam cada exercício no Chrome
// com a solução de referência, e que o código inicial sozinho não passa.

import { writeFileSync } from "node:fs";
import path from "node:path";
import { loadModules, publicContent, ROOT, validate } from "./content_lib.mjs";

const modules = loadModules();
const problems = validate(modules);
if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join("\n"));
  process.exit(1);
}
const out = path.join(ROOT, "server", "content.json");
writeFileSync(out, JSON.stringify(publicContent(modules), null, 1) + "\n", "utf8");
const total = modules.reduce((n, m) => n + m.exercises.length, 0);
console.log(`server/content.json: ${modules.length} módulos, ${total} exercícios`);
