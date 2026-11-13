// Corre sketches de p5.js num iframe isolado (sandbox="allow-scripts": o código do aluno não vê esta página)
// e fala com ele por postMessage. Usado pela pré-visualização e pelas verificações dos exercícios.

export const P5_VERSION = "1.11.13";
const P5_URL = `/static/vendor/p5-${P5_VERSION}.min.js`;
const HARNESS_URL = "/static/js/harness.js";
export const SEED = 42;

/**
 * Acrescenta `__lp(linha);` no início do corpo de cada ciclo for/while/do com chavetas, para o harness
 * conseguir parar um ciclo infinito em vez de bloquear o browser. Não muda o número das linhas.
 */
export function protectLoops(code) {
  const out = [];
  let i = 0;
  let line = 1;
  const n = code.length;
  const isId = (c) => /[\w$]/.test(c ?? "");
  // Salta espaços e comentários a partir de j; devolve a nova posição.
  const skipSpace = (j) => {
    for (;;) {
      while (j < n && /\s/.test(code[j])) j++;
      if (code.startsWith("//", j)) {
        while (j < n && code[j] !== "\n") j++;
      } else if (code.startsWith("/*", j)) {
        const end = code.indexOf("*/", j + 2);
        j = end < 0 ? n : end + 2;
      } else return j;
    }
  };
  // Salta uma string ou template que começa em j; devolve a posição a seguir.
  const skipString = (j) => {
    const q = code[j++];
    while (j < n && code[j] !== q) {
      if (code[j] === "\\") j++;
      else if (q !== "`" && code[j] === "\n") break;
      j++;
    }
    return j + 1;
  };
  // Encontra o ")" que fecha o "(" em j.
  const skipParens = (j) => {
    let depth = 0;
    while (j < n) {
      const c = code[j];
      if (c === '"' || c === "'" || c === "`") {
        j = skipString(j);
        continue;
      }
      if (code.startsWith("//", j) || code.startsWith("/*", j)) {
        j = skipSpace(j);
        continue;
      }
      if (c === "(") depth++;
      if (c === ")" && --depth === 0) return j + 1;
      j++;
    }
    return -1;
  };
  const inserts = []; // [posição a seguir à "{", linha do ciclo]
  while (i < n) {
    const c = code[i];
    if (c === "\n") line++;
    if (c === '"' || c === "'" || c === "`") {
      const end = skipString(i);
      for (let k = i; k < Math.min(end, n); k++) if (code[k] === "\n") line++;
      i = end;
      continue;
    }
    if (code.startsWith("//", i) || code.startsWith("/*", i)) {
      const end = skipSpace(i);
      for (let k = i; k < end; k++) if (code[k] === "\n") line++;
      i = end;
      continue;
    }
    if (!isId(code[i - 1])) {
      const word = /^(for|while|do)\b/.exec(code.slice(i, i + 6));
      if (word) {
        let j = i + word[1].length;
        if (word[1] !== "do") {
          j = skipSpace(j);
          j = code[j] === "(" ? skipParens(j) : -1;
        }
        if (j > 0) {
          j = skipSpace(j);
          if (code[j] === "{") inserts.push([j + 1, line]);
        }
        i += word[1].length;
        continue;
      }
    }
    i++;
  }
  let last = 0;
  for (const [pos, ln] of inserts) {
    out.push(code.slice(last, pos), `__lp(${ln});`);
    last = pos;
  }
  out.push(code.slice(last));
  return out.join("");
}

/** O documento do iframe: p5.js, o harness e (dentro da configuração) o código do aluno. */
export function srcdoc(code, mode, token) {
  const cfg = JSON.stringify({ mode, token, seed: SEED, code: protectLoops(code) }).replace(/</g, "\\u003c");
  const origin = location.origin;
  return `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}canvas{display:block}</style>
<script>window.__CFG=${cfg};</script>
<script crossorigin="anonymous" src="${origin}${P5_URL}"></script>
<script crossorigin="anonymous" src="${origin}${HARNESS_URL}"></script>
</head><body></body></html>`;
}

const newToken = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function makeFrame(code, mode) {
  const token = newToken();
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-scripts");
  frame.setAttribute("title", "Sketch de p5.js");
  frame.srcdoc = srcdoc(code, mode, token);
  return { frame, token };
}

/** Pré-visualização: corre o sketch dentro de `stage` e mostra a consola em `consoleEl`. */
export class Preview {
  constructor(stage, consoleEl, { onStatus } = {}) {
    this.stage = stage;
    this.consoleEl = consoleEl;
    this.onStatus = onStatus ?? (() => {});
    this.frame = null;
    this.token = null;
    this.size = null;
    this.onMessage = (e) => this.handle(e);
    addEventListener("message", this.onMessage);
    this.resizeObserver = new ResizeObserver(() => this.fit());
    this.resizeObserver.observe(stage);
  }

  run(code) {
    this.stop(false);
    this.consoleEl.innerHTML = "";
    const { frame, token } = makeFrame(code, "run");
    this.frame = frame;
    this.token = token;
    this.size = null;
    frame.className = "sketch-frame";
    frame.width = 400;
    frame.height = 400;
    this.stage.innerHTML = "";
    this.stage.append(frame);
    this.onStatus("running");
  }

  stop(showPlaceholder = true) {
    if (this.frame) this.frame.remove();
    this.frame = null;
    this.token = null;
    if (showPlaceholder) {
      this.stage.innerHTML = `<div class="stage-empty"><span>▶</span><p>Carrega em <b>Executar</b> (ou Ctrl+Enter) para veres o teu sketch.</p></div>`;
      this.onStatus("stopped");
    }
  }

  pause(paused) {
    this.frame?.contentWindow?.postMessage({ lp5: this.token, type: paused ? "pause" : "resume" }, "*");
  }

  destroy() {
    this.stop(false);
    removeEventListener("message", this.onMessage);
    this.resizeObserver.disconnect();
  }

  /** Encolhe o iframe (com transform) se o canvas não couber na largura disponível. */
  fit() {
    if (!this.frame || !this.size) return;
    const [w, h] = this.size;
    const avail = this.stage.clientWidth;
    const k = Math.min(1, avail / w);
    this.frame.width = w;
    this.frame.height = h;
    this.frame.style.transform = k < 1 ? `scale(${k})` : "";
    this.stage.style.height = `${Math.ceil(h * k) + 2}px`;
  }

  handle(e) {
    if (!this.frame || e.source !== this.frame.contentWindow || e.data?.lp5 !== this.token) return;
    const d = e.data;
    if (d.type === "ready") {
      if (d.size) {
        this.size = d.size;
        this.fit();
      }
    } else if (d.type === "log") {
      this.line(d.text, d.level === "error" ? "c-err" : d.level === "warn" ? "c-warn" : "");
    } else if (d.type === "error") {
      const where = d.line ? `Linha ${d.line}: ` : "";
      const el = this.line(`${where}${d.hint ?? d.message}`, "c-err");
      if (d.hint) {
        const small = document.createElement("small");
        small.textContent = d.message;
        el.append(small);
      }
      this.onStatus("error", d);
    }
  }

  line(text, cls = "") {
    const el = document.createElement("div");
    el.className = `c-line ${cls}`;
    el.textContent = text;
    if (this.consoleEl.childElementCount > 300) this.consoleEl.firstElementChild.remove();
    this.consoleEl.append(el);
    this.consoleEl.scrollTop = this.consoleEl.scrollHeight;
    return el;
  }
}

/** Contentor (fora do ecrã, mas com layout, para as coordenadas do rato funcionarem) dos iframes de verificação. */
function checkHost() {
  let host = document.getElementById("check-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "check-host";
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = "position:fixed;left:-20000px;top:0;width:1400px;height:1100px;overflow:hidden;visibility:hidden;pointer-events:none";
    document.body.append(host);
  }
  return host;
}

/** Corre uma verificação (expressão com `verifica`) num iframe novo. Devolve {actual} ou {error}. */
function evaluate(code, expr, timeout = 8000) {
  return new Promise((resolve) => {
    const { frame, token } = makeFrame(code, "check");
    frame.width = 1300;
    frame.height = 1000;
    let timer = null;
    const done = (result) => {
      clearTimeout(timer);
      removeEventListener("message", onMessage);
      frame.remove();
      resolve(result);
    };
    const onMessage = (e) => {
      if (e.source !== frame.contentWindow || e.data?.lp5 !== token) return;
      const d = e.data;
      if (d.type === "ready") frame.contentWindow.postMessage({ lp5: token, type: "eval", id: 1, expr }, "*");
      if (d.type === "result") done(d.error !== undefined ? { error: d.error } : { actual: d.actual });
    };
    addEventListener("message", onMessage);
    timer = setTimeout(() => done({ error: "O sketch demorou demasiado a responder. Há algum ciclo infinito?" }), timeout);
    checkHost().append(frame);
  });
}

/** Corre as verificações de um exercício sobre o código do aluno. Devolve [{passed, actual, error}]. */
export async function runChecks(code, tests) {
  const results = [];
  for (const t of tests) {
    const r = await evaluate(code, t.expr);
    results.push(r.error !== undefined ? { passed: false, error: r.error } : { passed: r.actual === JSON.stringify(t.expected), actual: r.actual });
  }
  return results;
}

/** Para os testes automáticos: corre as verificações de `ex` sobre `code` e junta o nome de cada uma. */
export async function runExercise(ex, code) {
  const results = await runChecks(code, ex.tests);
  return results.map((r, k) => ({ ...r, name: ex.tests[k].name }));
}

/** Página HTML autónoma com o sketch (para o aluno descarregar e abrir fora do site). */
export function standaloneHtml(code, title = "O meu sketch") {
  const safe = code.replace(/<\/script/gi, "<\\/script");
  return `<!doctype html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8">
  <title>${title.replace(/</g, "&lt;")}</title>
  <script src="https://cdn.jsdelivr.net/npm/p5@${P5_VERSION}/lib/p5.min.js"></script>
  <style>body { margin: 0; }</style>
</head>
<body>
<script>
${safe}
</script>
</body>
</html>
`;
}
