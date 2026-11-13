import { createEditor } from "./editor.js";
import { Preview, runChecks, standaloneHtml } from "./sketch.js";

const view = document.getElementById("view");
const topbar = document.getElementById("topbar");
const hud = document.getElementById("hud");
const toasts = document.getElementById("toasts");

let profile = null;
let cleanup = []; // o que fechar ao sair de uma vista (pré-visualizações a correr)

// ---------- Utilitários ----------

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const md = (text) => marked.parse(text.trim());
const stars = (n) => "★".repeat(n) + "☆".repeat(3 - n);

class ApiError extends Error {}

const store = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {}
  },
};

/** Apaga os rascunhos (código já escrito) guardados neste browser. */
function clearDrafts() {
  try {
    Object.keys(localStorage).filter((k) => k.startsWith("lp-")).forEach((k) => localStorage.removeItem(k));
  } catch {}
}

async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && !path.startsWith("/login")) {
    profile = null;
    location.hash = "#/login";
    throw new ApiError("Sessão terminada.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = Array.isArray(data.detail) ? "Verifica os dados introduzidos." : data.detail;
    throw new ApiError(detail || "Ocorreu um erro.");
  }
  return data;
}

function toast(icon, title, sub = "") {
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<span class="t-icon">${icon}</span><div>${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ""}</div>`;
  toasts.append(el);
  setTimeout(() => el.remove(), 4500);
}

function burst(x = innerWidth / 2, y = innerHeight / 2) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const icons = ["⭐", "🎨", "✨", "🎉", "🟣"];
  for (let i = 0; i < 18; i++) {
    const el = document.createElement("span");
    el.className = "burst";
    el.textContent = icons[i % icons.length];
    const angle = (Math.PI * 2 * i) / 18;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.setProperty("--dx", `${Math.cos(angle) * (120 + Math.random() * 80)}px`);
    el.style.setProperty("--dy", `${Math.sin(angle) * (120 + Math.random() * 80) - 40}px`);
    el.style.setProperty("--rot", `${Math.random() * 360}deg`);
    document.body.append(el);
    setTimeout(() => el.remove(), 1200);
  }
}

function celebrate(result) {
  if (result.xp_gained) toast("⚡", `+${result.xp_gained} XP`, result.first_try ? "Inclui bónus por acertares à primeira!" : "");
  if (result.level_up) toast("🆙", `Subiste para o nível ${profile.level.level}!`, profile.level.title);
  for (const b of result.new_badges ?? []) toast(b.icon, `Nova medalha: ${b.name}`, b.description);
}

function download(name, text) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "text/html" }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ---------- HUD (barra de topo) ----------

async function loadProfile() {
  profile = await api("/me");
  renderHud();
  return profile;
}

function renderHud() {
  if (!profile) {
    topbar.hidden = true;
    return;
  }
  topbar.hidden = false;
  const lv = profile.level;
  const pct = Math.round((lv.xp_into_level / lv.xp_for_next) * 100);
  hud.innerHTML = `
    <span class="hud-streak ${profile.streak ? "" : "off"}" title="Dias seguidos a praticar">🔥 ${profile.streak}</span>
    <div class="hud-level" title="${esc(lv.title)} — ${lv.xp} XP">
      <span class="lvl">${lv.level}</span>
      <div><div class="xpbar"><span style="width:${pct}%"></span></div><div class="small">${lv.xp_into_level}/${lv.xp_for_next} XP</div></div>
    </div>
    <div class="hud-user"><span>${esc(profile.username)}</span><button class="btn btn-ghost" id="logout" style="padding:6px 10px">Sair</button></div>`;
  hud.querySelector("#logout").onclick = async () => {
    await api("/logout", { method: "POST" });
    clearDrafts();
    profile = null;
    renderHud();
    location.hash = "#/login";
  };
}

function setNav(active) {
  document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("active", a.dataset.nav === active));
}

// ---------- Área de trabalho: editor + resultado + consola ----------

/**
 * Monta o editor e a pré-visualização dentro de `root` (que tem #editor, #stage, #console, #run-btn, #stop-btn).
 * Devolve {editor, run, stop}.
 */
function workspace(root, code, { onChange } = {}) {
  const $ = (sel) => root.querySelector(sel);
  const runBtn = $("#run-btn");
  const stopBtn = $("#stop-btn");
  const status = $("#run-status");
  let editor = null;
  const preview = new Preview($("#stage"), $("#console"), {
    onStatus: (s, err) => {
      runBtn.classList.toggle("running", s === "running");
      stopBtn.disabled = s === "stopped";
      if (status) {
        status.textContent = s === "running" ? "● a correr" : s === "error" ? "● erro" : "";
        status.className = `run-status ${s}`;
      }
      if (s === "error" && err?.line) editor.markError(err.line);
    },
  });
  cleanup.push(() => preview.destroy());
  const run = () => {
    editor.markError(null);
    preview.run(editor.getValue());
  };
  editor = createEditor($("#editor"), code, { onChange, onRun: run });
  runBtn.onclick = run;
  stopBtn.onclick = () => preview.stop();
  preview.stop();
  return { editor, run, stop: () => preview.stop() };
}

function workspaceHtml(extraActions = "") {
  return `
    <div class="card work-card">
      <div class="work-bar">
        <div class="run-actions">
          <button class="btn btn-run" id="run-btn" title="Executar (Ctrl+Enter)">▶ Executar</button>
          <button class="btn btn-ghost" id="stop-btn" title="Parar o sketch">■ Parar</button>
          <span class="run-status" id="run-status"></span>
        </div>
        <div class="actions">${extraActions}</div>
      </div>
      <div class="editor" id="editor"></div>
    </div>
    <div class="card stage-card">
      <div class="section-title"><h2>🖼️ Resultado</h2><span class="small">Ctrl+Enter executa</span></div>
      <div class="stage" id="stage"></div>
      <div class="console-wrap">
        <div class="console-title">Consola <span class="small">(print e console.log aparecem aqui)</span></div>
        <div class="console" id="console" aria-live="polite"></div>
      </div>
    </div>`;
}

// ---------- Vistas ----------

function authView(mode) {
  const isLogin = mode === "login";
  view.innerHTML = `
    <section class="auth">
      <div class="auth-hero">
        <p class="eyebrow">🎨 Learn p5</p>
        <h1>Aprende a <em>desenhar</em> e <em>animar</em> com código.</h1>
        <p>Lições curtas e exercícios com p5.js, a biblioteca de JavaScript feita para artistas, designers e principiantes. Escreves código e vês o resultado logo ao lado.</p>
        <ul class="auth-points">
          <li><span>📖</span> Teoria clara, com exemplos que podes executar</li>
          <li><span>⌨️</span> Um editor de código com resultado imediato, sem instalar nada</li>
          <li><span>🎞️</span> Do primeiro ponto às animações e jogos interativos</li>
          <li><span>✅</span> Correção automática: vês logo o que está certo</li>
          <li><span>🏆</span> XP, níveis, medalhas e sequências diárias</li>
        </ul>
      </div>
      <form class="card auth-form" id="auth-form">
        <h2>${isLogin ? "Entrar" : "Criar conta"}</h2>
        <label>Nome de utilizador <input type="text" name="username" autocomplete="username" required minlength="3" maxlength="30"></label>
        <label>Palavra-passe <input type="password" name="password" autocomplete="${isLogin ? "current-password" : "new-password"}" required minlength="6"></label>
        <p class="form-error" id="form-error"></p>
        <button class="btn btn-primary" type="submit">${isLogin ? "Entrar" : "Começar a aprender"}</button>
        <p class="small">${isLogin ? 'Ainda não tens conta? <a href="#/registar">Regista-te</a>' : 'Já tens conta? <a href="#/login">Entra aqui</a>'}</p>
      </form>
    </section>`;
  const form = view.querySelector("#auth-form");
  form.onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    try {
      await api(isLogin ? "/login" : "/register", { method: "POST", body: data });
      await loadProfile();
      location.hash = "#/";
    } catch (err) {
      form.querySelector("#form-error").textContent = err.message;
    }
  };
}

function moduleCard(m) {
  const pct = m.exercises_total ? Math.round((m.exercises_done / m.exercises_total) * 100) : 0;
  const complete = m.exercises_done === m.exercises_total;
  return `
    <a class="card module-card" href="#/modulo/${m.id}">
      <div class="top"><span class="emoji">${m.icon}</span><span class="pill ${complete ? "done" : ""}">${complete ? "✓ Concluído" : `${m.exercises_done}/${m.exercises_total}`}</span></div>
      <h3>${esc(m.title)}</h3>
      <p>${esc(m.summary)}</p>
      <div class="progress"><span style="width:${pct}%"></span></div>
    </a>`;
}

/** Os módulos agrupados por tema (Desenho, Animação, Interação), pela ordem do curso. */
function moduleTracks(modules) {
  const tracks = [];
  for (const m of modules) {
    if (tracks.at(-1)?.name !== m.track) tracks.push({ name: m.track, modules: [] });
    tracks.at(-1).modules.push(m);
  }
  return tracks
    .map((t) => {
      const done = t.modules.reduce((n, m) => n + m.exercises_done, 0);
      const total = t.modules.reduce((n, m) => n + m.exercises_total, 0);
      return `
        <section class="track">
          <div class="track-title"><h3>${esc(t.name)}</h3><span class="small">${done}/${total} exercícios</span></div>
          <div class="grid modules">${t.modules.map(moduleCard).join("")}</div>
        </section>`;
    })
    .join("");
}

async function dashboardView() {
  setNav("painel");
  const [modules, board] = await Promise.all([api("/modules"), api("/leaderboard"), loadProfile()]);
  const p = profile;
  const next = modules.find((m) => m.exercises_done < m.exercises_total) ?? modules[0];
  view.innerHTML = `
    <div class="hello">
      <div><p class="eyebrow">${esc(p.level.title)}</p><h1>Olá, ${esc(p.username)}! 👋</h1></div>
      <a class="btn btn-yellow" href="#/modulo/${next.id}">${p.exercises_done ? "Continuar" : "Começar"}: ${esc(next.title)} →</a>
    </div>
    <div class="grid stats">
      <div class="card stat"><span class="icon">⭐</span><span class="num">${p.level.level}</span><span class="small">Nível</span></div>
      <div class="card stat"><span class="icon">⚡</span><span class="num">${p.level.xp}</span><span class="small">XP total</span></div>
      <div class="card stat"><span class="icon">🔥</span><span class="num">${p.streak}</span><span class="small">Dias seguidos (recorde: ${p.best_streak})</span></div>
      <div class="card stat"><span class="icon">✅</span><span class="num">${p.exercises_done}<span class="small">/${p.exercises_total}</span></span><span class="small">Exercícios resolvidos</span></div>
    </div>
    <div class="grid dash">
      <section>
        <div class="section-title"><h2>O teu percurso</h2><a href="#/modulos" class="small">Ver todos</a></div>
        ${moduleTracks(modules)}
      </section>
      <aside class="grid">
        <section class="card">
          <div class="section-title"><h2>Medalhas</h2><span class="small">${p.badges.filter((b) => b.earned).length}/${p.badges.length}</span></div>
          <div class="grid badges">${p.badges
            .map((b) => `<div class="badge ${b.earned ? "" : "locked"}" title="${esc(b.description)}"><span class="b-icon">${b.icon}</span>${esc(b.name)}</div>`)
            .join("")}</div>
        </section>
        <section class="card">
          <div class="section-title"><h2>Classificação</h2></div>
          <ol class="board">${board
            .map((u, i) => `<li class="${u.me ? "me" : ""}"><span class="pos">${i + 1}</span><span>${esc(u.username)} <span class="small">nv. ${u.level}</span></span><span>${u.xp} XP</span></li>`)
            .join("")}</ol>
        </section>
        <a class="card free-card" href="#/livre"><span class="emoji">🧪</span><div><b>Caderno livre</b><br><span class="small">Experimenta o que quiseres, sem exercícios.</span></div></a>
      </aside>
    </div>`;
}

async function modulesView() {
  setNav("modulos");
  const modules = await api("/modules");
  view.innerHTML = `
    <div class="hello"><div><p class="eyebrow">Curso de p5.js</p><h1>Módulos</h1></div></div>
    ${moduleTracks(modules)}`;
}

/** Nos exemplos das lições com setup(), acrescenta um botão para os executar ali mesmo. */
function runnableExamples(root) {
  root.querySelectorAll("pre > code.language-js").forEach((codeEl) => {
    const code = codeEl.textContent;
    if (!/function\s+(setup|draw)\s*\(/.test(code)) return;
    const pre = codeEl.parentElement;
    const box = document.createElement("div");
    box.className = "example";
    pre.replaceWith(box);
    box.append(pre);
    const bar = document.createElement("div");
    bar.className = "example-bar";
    bar.innerHTML = `<button class="btn btn-run btn-small">▶ Experimentar</button>`;
    box.append(bar);
    let preview = null;
    const btn = bar.querySelector("button");
    btn.onclick = () => {
      if (preview) {
        preview.destroy();
        preview = null;
        box.querySelector(".example-out")?.remove();
        btn.textContent = "▶ Experimentar";
        return;
      }
      const out = document.createElement("div");
      out.className = "example-out";
      out.innerHTML = `<div class="stage"></div><div class="console"></div>`;
      box.append(out);
      preview = new Preview(out.querySelector(".stage"), out.querySelector(".console"));
      cleanup.push(() => preview?.destroy());
      preview.run(code);
      btn.textContent = "■ Fechar";
    };
  });
}

async function moduleView(id) {
  setNav("modulos");
  const m = await api(`/modules/${id}`);
  view.innerHTML = `
    <div class="crumbs"><a href="#/modulos">Módulos</a> / ${esc(m.title)}</div>
    <div class="grid lesson-layout">
      <article class="card lesson prose">${md(m.lesson)}
        <div style="margin-top:28px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <button class="btn ${m.lesson_read ? "btn-ghost" : "btn-primary"}" id="read-btn" ${m.lesson_read ? "disabled" : ""}>
            ${m.lesson_read ? "✓ Lição lida" : "Terminei de ler (+5 XP)"}
          </button>
          ${m.exercises[0] ? `<a class="btn btn-yellow" href="#/exercicio/${m.exercises[0].id}">Praticar →</a>` : ""}
        </div>
      </article>
      <aside class="side">
        <section class="card">
          <p class="eyebrow">Exercícios</p>
          <ul class="ex-list">${m.exercises
            .map(
              (ex) => `<li><a href="#/exercicio/${ex.id}" class="${ex.done ? "done" : ""}">
                <span class="check">${ex.done ? "✓" : ""}</span>
                <span>${esc(ex.title)}<br><span class="stars">${stars(ex.difficulty)}</span></span>
                <span class="pill">${ex.xp} XP</span></a></li>`,
            )
            .join("")}</ul>
        </section>
      </aside>
    </div>`;
  runnableExamples(view.querySelector(".lesson"));
  const btn = view.querySelector("#read-btn");
  btn.onclick = async () => {
    btn.disabled = true;
    const r = await api(`/modules/${id}/read`, { method: "POST" });
    btn.textContent = "✓ Lição lida";
    btn.className = "btn btn-ghost";
    await loadProfile();
    celebrate(r);
  };
}

function testCard(test, i, result) {
  const cls = result ? (result.passed ? "pass" : "fail") : "";
  const status = result ? (result.passed ? "✓ Passou" : "✗ Falhou") : "";
  const actual = result ? (result.error ? `<span class="err">${esc(result.error)}</span>` : esc(result.actual ?? "")) : "";
  return `
    <li class="test ${cls}">
      <div class="t-head"><span>${i + 1}. ${esc(test.name)}</span><span>${status}</span></div>
      <div class="t-cols">
        <div><div class="t-label">Esperado</div><pre>${esc(JSON.stringify(test.expected))}</pre></div>
        ${result ? `<div><div class="t-label">Obtido</div><pre>${actual}</pre></div>` : ""}
      </div>
      <details><summary>Como é verificado</summary><pre>${esc(test.expr)}</pre></details>
    </li>`;
}

async function exerciseView(id) {
  setNav("modulos");
  const ex = await api(`/exercises/${id}`);
  // O rascunho é de cada aluno: num computador partilhado, outro aluno não o pode ver.
  const draftKey = `lp-draft:${profile.username.toLowerCase()}:${id}`;
  const initial = store.get(draftKey) ?? ex.last_code ?? ex.starter;

  view.innerHTML = `
    <div class="crumbs"><a href="#/modulos">Módulos</a> / <a href="#/modulo/${ex.module.id}">${esc(ex.module.title)}</a> / ${esc(ex.title)}</div>
    <div class="grid ex-layout">
      <section class="grid">
        <div class="card">
          <div class="ex-head">
            <h1>${esc(ex.title)}</h1>
            <span class="stars">${stars(ex.difficulty)}</span>
            <span class="pill">${ex.xp} XP</span>
            ${ex.done ? '<span class="pill done">✓ Resolvido</span>' : ""}
          </div>
          <div class="statement prose">${md(ex.statement)}</div>
          <button class="btn btn-ghost" id="hint-btn" style="margin-top:8px">💡 Mostrar pista</button>
          <div class="hint prose" id="hint" hidden>${md(ex.hint)}</div>
        </div>
        <div class="card">
          <p class="eyebrow">Verificações</p>
          <ul class="tests" id="tests">${ex.tests.map((t, i) => testCard(t, i)).join("")}</ul>
        </div>
      </section>
      <section class="grid">
        ${workspaceHtml(`
          <button class="btn btn-ghost" id="reset-btn" title="Apaga o teu código e volta ao início do exercício">↺ Recomeçar</button>
          <button class="btn btn-ghost" id="check-btn" title="Corre as verificações sem submeter">✓ Verificar</button>
          <button class="btn btn-primary" id="submit-btn">Submeter</button>`)}
        <div class="feedback" id="feedback"></div>
        ${ex.next_id ? `<p style="text-align:right;margin:0"><a href="#/exercicio/${ex.next_id}">Próximo exercício →</a></p>` : `<p style="text-align:right;margin:0"><a href="#/modulos">Voltar aos módulos →</a></p>`}
      </section>
    </div>`;

  const $ = (sel) => view.querySelector(sel);
  const testsEl = $("#tests");
  const feedbackEl = $("#feedback");
  let saveTimer = null;
  const ws = workspace(view, initial, {
    onChange: (code) => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => store.set(draftKey, code === ex.starter ? null : code), 300);
    },
  });
  if (initial.trim()) ws.run();

  $("#hint-btn").onclick = () => ($("#hint").hidden = !$("#hint").hidden);

  // Recomeçar pede confirmação com um segundo clique (sem janelas de diálogo).
  const resetBtn = $("#reset-btn");
  let resetArmed = null;
  const disarm = () => {
    clearTimeout(resetArmed);
    resetArmed = null;
    resetBtn.textContent = "↺ Recomeçar";
    resetBtn.classList.remove("armed");
  };
  resetBtn.onclick = () => {
    if (!resetArmed) {
      resetBtn.textContent = "Tens a certeza? Clica outra vez";
      resetBtn.classList.add("armed");
      resetArmed = setTimeout(disarm, 3500);
      return;
    }
    disarm();
    store.set(draftKey, null);
    ws.editor.setValue(ex.starter);
    testsEl.innerHTML = ex.tests.map((t, i) => testCard(t, i)).join("");
    feedbackEl.innerHTML = "";
    if (ex.starter.trim()) ws.run();
    else ws.stop();
  };

  const checkBtn = $("#check-btn");
  const submitBtn = $("#submit-btn");
  const check = async () => {
    const results = await runChecks(ws.editor.getValue(), ex.tests);
    testsEl.innerHTML = ex.tests.map((t, i) => testCard(t, i, results[i])).join("");
    return results;
  };
  checkBtn.onclick = async () => {
    checkBtn.disabled = submitBtn.disabled = true;
    feedbackEl.innerHTML = `<div class="card thinking"><span class="spinner"></span> A verificar…</div>`;
    const results = await check();
    const passed = results.filter((r) => r.passed).length;
    feedbackEl.innerHTML = `<div class="verdict ${passed === results.length ? "ok" : "ko"}"><span class="big">${passed === results.length ? "👍" : "🔎"}</span><p>${passed}/${results.length} verificações passam.${passed === results.length ? " Já podes submeter!" : ""}</p></div>`;
    checkBtn.disabled = submitBtn.disabled = false;
  };

  submitBtn.onclick = async () => {
    checkBtn.disabled = submitBtn.disabled = true;
    feedbackEl.innerHTML = `<div class="card thinking"><span class="spinner"></span> A verificar…</div>`;
    const code = ws.editor.getValue();
    const results = await check();
    try {
      const r = await api(`/exercises/${id}/submit`, {
        method: "POST",
        body: {
          code: code.slice(0, 20000),
          results: results.map((x) => ({ passed: x.passed, actual: x.actual?.slice(0, 4000) ?? null, error: x.error?.slice(0, 4000) ?? null })),
        },
      });
      profile = r.profile;
      renderHud();
      renderFeedback(feedbackEl, r);
      if (r.accepted) {
        const rect = submitBtn.getBoundingClientRect();
        if (r.xp_gained) burst(rect.left + rect.width / 2, rect.top);
        celebrate(r);
      }
    } catch (err) {
      feedbackEl.innerHTML = `<div class="verdict ko"><span class="big">⚠️</span><p>${esc(err.message)}</p></div>`;
    }
    checkBtn.disabled = submitBtn.disabled = false;
  };
}

function renderFeedback(el, r) {
  let headline;
  if (r.accepted) {
    headline = r.already_done ? "Continua certo! Já tinhas resolvido este exercício." : `Exercício resolvido! Ganhaste ${r.xp_gained} XP.`;
  } else {
    headline = `Passaram ${r.tests_passed} de ${r.tests_total} verificações. Revê as que falharam e tenta outra vez!`;
  }
  el.innerHTML = `<div class="verdict ${r.accepted ? "ok" : "ko"}"><span class="big">${r.accepted ? "🎉" : "💪"}</span><p>${esc(headline)}</p></div>`;
}

const FREE_EXAMPLE = `// O teu caderno livre: experimenta à vontade!
// O código fica guardado neste browser.

function setup() {
  createCanvas(400, 400);
  noStroke();
}

function draw() {
  background(20, 24, 40, 25);
  let x = width / 2 + cos(frameCount * 0.03) * 120;
  let y = height / 2 + sin(frameCount * 0.05) * 120;
  fill(255, 140, 80);
  circle(x, y, 40);
  fill(120, 200, 255);
  circle(mouseX, mouseY, 20);
}
`;

async function freeView() {
  setNav("livre");
  const key = `lp-livre:${profile.username.toLowerCase()}`;
  const initial = store.get(key) ?? FREE_EXAMPLE;
  view.innerHTML = `
    <div class="hello"><div><p class="eyebrow">Sem exercícios, sem verificações</p><h1>🧪 Caderno livre</h1></div></div>
    <div class="grid free-layout">
      <section class="grid">${workspaceHtml(`
        <button class="btn btn-ghost" id="new-btn" title="Volta ao exemplo inicial">↺ Exemplo</button>
        <button class="btn btn-ghost" id="dl-btn" title="Descarrega um ficheiro .html que abre em qualquer browser">⬇ Descarregar</button>`)}
      </section>
    </div>`;
  let saveTimer = null;
  const ws = workspace(view, initial, {
    onChange: (code) => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => store.set(key, code), 300);
    },
  });
  ws.run();
  view.querySelector("#dl-btn").onclick = () => download("sketch.html", standaloneHtml(ws.editor.getValue()));
  const newBtn = view.querySelector("#new-btn");
  newBtn.onclick = () => {
    if (!newBtn.classList.contains("armed")) {
      newBtn.classList.add("armed");
      newBtn.textContent = "Apagar o teu código? Clica outra vez";
      setTimeout(() => {
        newBtn.classList.remove("armed");
        newBtn.textContent = "↺ Exemplo";
      }, 3500);
      return;
    }
    newBtn.classList.remove("armed");
    newBtn.textContent = "↺ Exemplo";
    ws.editor.setValue(FREE_EXAMPLE);
    store.set(key, null);
    ws.run();
  };
}

// ---------- Router ----------

async function route() {
  for (const fn of cleanup.splice(0)) fn();
  const hash = location.hash || "#/";
  const [, page, id] = hash.split("/");
  window.scrollTo(0, 0);

  if (page === "login" || page === "registar") {
    if (profile) return (location.hash = "#/");
    topbar.hidden = true;
    return authView(page === "login" ? "login" : "register");
  }

  if (!profile) {
    try {
      await loadProfile();
    } catch {
      return;
    }
  }
  try {
    if (!page) await dashboardView();
    else if (page === "modulos") await modulesView();
    else if (page === "modulo") await moduleView(id);
    else if (page === "exercicio") await exerciseView(id);
    else if (page === "livre") await freeView();
    else view.innerHTML = `<div class="empty"><h2>Página não encontrada</h2><a href="#/">Voltar ao painel</a></div>`;
  } catch (err) {
    if (!(err instanceof ApiError && err.message === "Sessão terminada.")) {
      console.error(err);
      view.innerHTML = `<div class="empty"><h2>😕 ${esc(err.message)}</h2><a href="#/">Voltar ao painel</a></div>`;
    }
  }
}

addEventListener("hashchange", route);
route();
