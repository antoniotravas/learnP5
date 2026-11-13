// Testes do backend PHP (API) e de um exercício resolvido na interface. Precisam do PHP 8.2+ (php no PATH);
// sem ele, são saltados.

import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, describe, test } from "node:test";
import { loadModules } from "../tools/content_lib.mjs";
import { hasPhp, launchChrome, launchPhp } from "./helpers.mjs";

const PHP = hasPhp();
const modules = loadModules();
const EXERCISES = Object.fromEntries(modules.flatMap((m) => m.exercises).map((e) => [e.id, e]));
const dirs = [];
const servers = [];

after(() => {
  servers.forEach((s) => s.stop());
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

/** Cliente HTTP simples com cookies. */
function client(url) {
  let cookie = "";
  const req = async (method, p, body) => {
    const res = await fetch(url + p, {
      method,
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get("set-cookie");
    if (set) cookie = set.split(";")[0].endsWith("=") ? "" : set.split(";")[0];
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return { status: res.status, json, text, headers: res.headers };
  };
  return {
    get: (p) => req("GET", p),
    post: (p, body) => req("POST", p, body),
    clearCookies: () => (cookie = ""),
  };
}

async function start(env = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), "learnp5-"));
  dirs.push(dir);
  const srv = await launchPhp(path.join(dir, "test.db"), env);
  servers.push(srv);
  return { c: client(srv.url), url: srv.url };
}

async function register(c, name = "aluno") {
  const r = await c.post("/api/register", { username: name, password: "segredo123" });
  assert.equal(r.status, 200, r.text);
}

const results = (id, passed = true) =>
  EXERCISES[id].tests.map((t) => ({ passed, actual: passed ? JSON.stringify(t.expected) : "null", error: null }));
const submit = (c, id, passed = true, code = "function setup() {}") =>
  c.post(`/api/exercises/${id}/submit`, { code, results: results(id, passed) });

describe("API", { skip: !PHP && "PHP não instalado" }, () => {
  test("registo, login e logout", async () => {
    const { c } = await start();
    assert.equal((await c.get("/api/me")).status, 401);
    await register(c);
    assert.equal((await c.get("/api/me")).json.username, "aluno");
    assert.equal((await c.post("/api/register", { username: "ALUNO", password: "segredo123" })).status, 409);
    await c.post("/api/logout");
    assert.equal((await c.get("/api/me")).status, 401);
    assert.equal((await c.post("/api/login", { username: "aluno", password: "errada1" })).status, 401);
    assert.equal((await c.post("/api/login", { username: "aluno", password: "segredo123" })).status, 200);
  });

  test("os módulos vêm agrupados por tema", async () => {
    const { c } = await start();
    await register(c);
    const mods = (await c.get("/api/modules")).json;
    assert.deepEqual([...new Set(mods.map((m) => m.track))], ["Desenho", "Animação", "Interação"]);
    assert.equal(mods.length, modules.length);
  });

  test("um exercício traz o código inicial e não traz a solução", async () => {
    const { c } = await start();
    await register(c);
    const ex = (await c.get("/api/exercises/primeira-tela")).json;
    assert.equal(ex.starter, EXERCISES["primeira-tela"].starter);
    assert.equal(ex.last_code, null);
    assert.equal(ex.next_id, "linhas-cruzadas");
    assert.ok(!("solution" in ex) && !("setup" in ex));
  });

  test("submeter dá XP uma vez, com bónus à primeira", async () => {
    const { c } = await start();
    await register(c);
    const r = (await submit(c, "primeira-tela")).json;
    assert.ok(r.accepted && r.first_try);
    assert.equal(r.xp_gained, 10 + 5);
    assert.deepEqual(new Set(r.new_badges.map((b) => b.id)), new Set(["primeiro_passo", "a_primeira"]));
    const again = (await submit(c, "primeira-tela")).json;
    assert.ok(again.accepted && again.already_done && again.xp_gained === 0);
  });

  test("uma submissão falhada não dá XP e tira o bónus", async () => {
    const { c } = await start();
    await register(c);
    assert.equal((await submit(c, "casa", false)).json.xp_gained, 0);
    const r = (await submit(c, "casa")).json;
    assert.ok(r.accepted && !r.first_try);
    assert.equal(r.xp_gained, 20);
  });

  test("o último código submetido é devolvido", async () => {
    const { c } = await start();
    await register(c);
    await submit(c, "casa", false, "// a minha casa");
    assert.equal((await c.get("/api/exercises/casa")).json.last_code, "// a minha casa");
  });

  test("ler uma lição dá XP uma vez", async () => {
    const { c } = await start();
    await register(c);
    assert.equal((await c.post("/api/modules/tela/read")).json.xp_gained, 5);
    assert.equal((await c.post("/api/modules/tela/read")).json.xp_gained, 0);
    assert.equal((await c.get("/api/me")).json.level.xp, 5);
  });

  test("limites: submissões, logins falhados e registos", async () => {
    const { c } = await start({ LEARNP5_SUBMIT_LIMIT: "2", LEARNP5_REGISTER_LIMIT: "3" });
    await register(c);
    assert.equal((await submit(c, "casa")).status, 200);
    assert.equal((await submit(c, "casa")).status, 200);
    assert.equal((await submit(c, "casa")).status, 429);
    for (let i = 0; i < 10; i++) assert.equal((await c.post("/api/login", { username: "aluno", password: "errada1" })).status, 401);
    assert.equal((await c.post("/api/login", { username: "aluno", password: "segredo123" })).status, 429);
    await register(c, "a02");
    await register(c, "a03");
    assert.equal((await c.post("/api/register", { username: "a04", password: "segredo123" })).status, 429);
  });

  test("validação dos pedidos", async () => {
    const { c } = await start();
    const r = await c.post("/api/register", { username: "ab", password: "segredo123" });
    assert.ok(r.status === 422 && Array.isArray(r.json.detail));
    assert.equal((await c.post("/api/register", { username: "a b c", password: "segredo123" })).status, 400);
    await register(c);
    assert.equal((await c.post("/api/exercises/casa/submit", { code: "x", results: [] })).status, 400);
    assert.equal((await c.post("/api/exercises/casa/submit", { commands: "x", results: results("casa") })).status, 422);
    assert.equal((await c.get("/api/exercises/nao-existe")).status, 404);
    assert.equal((await c.get("/api/nada")).status, 404);
  });

  test("o site é servido, com CORS nos scripts para os iframes dos sketches", async () => {
    const { c } = await start();
    const r = await c.get("/");
    assert.ok(r.status === 200 && r.text.includes("Learn p5"));
    const js = await c.get("/static/vendor/p5-1.11.13.min.js");
    assert.equal(js.status, 200);
    assert.equal(js.headers.get("access-control-allow-origin"), "*");
    assert.equal((await c.get("/api.php")).status, 404);
  });

  test("completar o tema Desenho dá as medalhas certas", async () => {
    const { c } = await start();
    await register(c);
    const badges = new Set();
    for (const m of modules.filter((m) => m.track === "Desenho")) {
      for (const ex of m.exercises) for (const b of (await submit(c, ex.id)).json.new_badges) badges.add(b.id);
    }
    for (const b of ["modulo", "desenho", "cinco"]) assert.ok(badges.has(b), b);
    assert.ok(!badges.has("animacao") && !badges.has("tudo") && !badges.has("ressalto"));
    assert.ok((await submit(c, "ressalto")).json.new_badges.some((b) => b.id === "ressalto"));
  });
});

describe("interface", { skip: !PHP && "PHP não instalado" }, () => {
  test("um aluno regista-se, resolve um exercício no editor e submete", async (t) => {
    const browser = await launchChrome();
    if (!browser) return t.skip("Chrome não disponível");
    const { url } = await start();
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(url + "/#/registar");
    await page.fill("input[name=username]", "ui_aluno");
    await page.fill("input[name=password]", "segredo123");
    await page.click("button[type=submit]");
    await page.waitForSelector(".stats");
    await page.goto(url + "/#/exercicio/primeira-tela");
    await page.waitForSelector(".CodeMirror");
    await page.evaluate((code) => document.querySelector(".CodeMirror").CodeMirror.setValue(code), EXERCISES["primeira-tela"].solution);
    await page.click("#run-btn");
    await page.waitForSelector(".sketch-frame");
    await page.click("#submit-btn");
    await page.waitForSelector(".verdict.ok", { timeout: 20000 });
    assert.match(await page.innerText(".verdict"), /Ganhaste 15 XP/);
    assert.equal(await page.locator(".test.pass").count(), EXERCISES["primeira-tela"].tests.length);
    // Ao voltar, o código é retomado.
    await page.goto(url + "/#/");
    await page.waitForSelector(".stats");
    await page.goto(url + "/#/exercicio/primeira-tela");
    await page.waitForSelector(".CodeMirror");
    assert.match(await page.evaluate(() => document.querySelector(".CodeMirror").CodeMirror.getValue()), /background\(220\)/);
    assert.deepEqual(errors, []);
    await browser.close();
  });
});
