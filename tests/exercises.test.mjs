// Corre cada exercício no Chrome, com o mesmo motor do site (public/static/js/sketch.js e harness.js):
// a solução de referência tem de passar todas as verificações e o código inicial sozinho não.
// Usa o Chrome instalado no computador (Playwright com channel "chrome"); sem ele, estes testes são saltados.

import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { loadModules, publicContent, validate } from "../tools/content_lib.mjs";
import { launchChrome, staticServer } from "./helpers.mjs";

const modules = loadModules();
const exercises = modules.flatMap((m) => m.exercises);
const only = process.env.EXERCICIO; // EXERCICIO=id para correr só um

let server;
let browser;
let page;

// (uma função, não uma string: com uma string o Playwright ignora os argumentos)
const run = (ex, code) =>
  page.evaluate(async ([ex, code]) => (await import("/static/js/sketch.js")).runExercise(ex, code), [{ tests: ex.tests }, code]);
const runCode = (code, tests) => run({ tests: tests.map((expr) => ({ name: expr, expr, expected: null })) }, code);

before(async () => {
  server = await staticServer();
  browser = await launchChrome();
  if (browser) {
    page = await browser.newPage();
    await page.goto(server.url + "/static/js/harness.js"); // qualquer página da mesma origem serve
  }
});

after(async () => {
  await browser?.close();
  await server?.close();
});

describe("conteúdo", () => {
  test("está bem formado", () => assert.deepEqual(validate(modules), []));
  test("o content.json está atualizado (node tools/build_content.mjs)", async () => {
    const { readFileSync } = await import("node:fs");
    const { ROOT } = await import("./helpers.mjs");
    const current = JSON.parse(readFileSync(`${ROOT}/server/content.json`, "utf8"));
    assert.deepEqual(current, publicContent(modules));
  });
});

describe("publicação", () => {
  test("o .htaccess encaminha /api/ para o api.php", async () => {
    const { readFileSync } = await import("node:fs");
    const { ROOT } = await import("./helpers.mjs");
    assert.match(readFileSync(`${ROOT}/public/.htaccess`, "utf8"), /RewriteRule \^api\/ api\.php/);
  });
});

describe("exercícios", () => {
  for (const ex of exercises) {
    if (only && ex.id !== only) continue;
    test(`${ex.id}: a solução passa`, async (t) => {
      if (!browser) return t.skip("Chrome não disponível");
      const results = await run(ex, ex.solution);
      const failed = results.filter((r) => !r.passed);
      assert.deepEqual(failed, [], JSON.stringify(failed, null, 1));
    });
    test(`${ex.id}: o código inicial não passa`, async (t) => {
      if (!browser) return t.skip("Chrome não disponível");
      const results = await run(ex, ex.starter);
      assert.ok(!results.every((r) => r.passed), "o código inicial já passa todas as verificações");
    });
  }
});

describe("motor", () => {
  test("erros de JavaScript vêm explicados em português, com a linha", async (t) => {
    if (!browser) return t.skip("Chrome não disponível");
    const [r] = await runCode("function setup() {\n  createCanvas(100, 100);\n  Background(0);\n}", ["verifica.erro()"]);
    assert.match(JSON.parse(r.actual), /«Background» não está definido/);
    const [s] = await runCode("function setup() {\n  createCanvas(100, 100;\n}", ["verifica.erro()"]);
    assert.match(JSON.parse(s.actual), /parêntese/);
  });

  test("um ciclo infinito é interrompido", async (t) => {
    if (!browser) return t.skip("Chrome não disponível");
    const [r] = await runCode("function setup() {\n  for (let i = 0; i < 10; i--) {\n  }\n}", ["verifica.erro()"]);
    assert.match(JSON.parse(r.actual), /linha 2 .*ciclo infinito/);
  });

  test("os frames, o rato e as teclas são controlados pela verificação", async (t) => {
    if (!browser) return t.skip("Chrome não disponível");
    const code = `let x = 0;
function setup() { createCanvas(200, 100); }
function draw() { background(255); circle(x, 50, 10); x += 1; if (keyIsDown(RIGHT_ARROW)) x += 10; }
function mousePressed() { x = mouseX; }
function keyTyped() { if (key === "z") x = -1; }`;
    const out = await runCode(code, [
      "verifica.frame()",
      "verifica.avanca(9).argumentos('circle')",
      "verifica.clica(120, 30).variavel('x')",
      "verifica.tecla('z').variavel('x')",
      "verifica.segura('RIGHT_ARROW').avanca(2).variavel('x')",
      "verifica.mudou()",
    ]);
    assert.deepEqual(out.map((r) => r.actual ?? r.error), ["1", "[[9,50,10]]", "120", "-1", "23", "true"]);
  });

  test("random() dá sempre os mesmos valores nas verificações", async (t) => {
    if (!browser) return t.skip("Chrome não disponível");
    const code = "let v;\nfunction setup() { createCanvas(10, 10); v = random(1000); }";
    const [a, b] = await runCode(code, ["verifica.variavel('v')", "verifica.variavel('v')"]);
    assert.equal(a.actual, b.actual);
  });

  test("as cores das formas são registadas", async (t) => {
    if (!browser) return t.skip("Chrome não disponível");
    const code = "function setup() { createCanvas(100, 100); fill(255, 0, 0, 120); noStroke(); circle(50, 50, 20); }";
    const [r] = await runCode(code, ["verifica.formas()"]);
    assert.deepEqual(JSON.parse(r.actual), [{ f: "circle", a: [50, 50, 20], fill: "#ff000078", stroke: null }]);
  });
});
