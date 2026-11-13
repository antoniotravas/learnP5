// Corre dentro do iframe (sandbox, sem acesso à página principal) que executa o sketch do aluno.
// Carregado depois do p5.js e antes do código do aluno. A configuração vem em window.__CFG:
//   { mode: "run" | "check", code, token, seed }
// Em modo "run" o sketch anima normalmente; em modo "check" o ciclo do draw() fica parado e é a
// verificação que avança os frames (avanca), mexe o rato (rato, clica) e carrega em teclas (tecla),
// por isso os resultados são sempre os mesmos. Fala com a página principal só por postMessage.

(function () {
  "use strict";
  const CFG = window.__CFG;
  const CHECK = CFG.mode === "check";
  const post = (msg) => parent.postMessage({ lp5: CFG.token, ...msg }, "*");

  // ---------- Erros ----------
  let firstError = null;
  const errors = [];

  /** Explica em português os erros de JavaScript mais comuns. */
  function explain(msg) {
    const rules = [
      [/^(?:Uncaught )?ReferenceError: (\S+) is not defined/, (m) => `«${m[1]}» não está definido. Escreveste bem o nome? Maiúsculas e minúsculas contam (fill ≠ Fill).`],
      [/Cannot access '(\S+)' before initialization/, (m) => `Estás a usar «${m[1]}» antes da linha onde é criado com let/const.`],
      [/(\S+) is not a function/, (m) => `«${m[1]}» não é uma função. Confirma o nome e se puseste os parênteses no sítio certo.`],
      [/Cannot read propert(?:y|ies) of (undefined|null)(?: \(reading '(.+)'\))?/, (m) => `Tentaste ler ${m[2] ? `«${m[2]}» ` : ""}de algo que é ${m[1]}. Uma variável ou posição de array está vazia?`],
      [/Cannot set propert(?:y|ies) of (undefined|null)/, (m) => `Tentaste mudar uma propriedade de algo que é ${m[1]}.`],
      [/Assignment to constant variable/, () => "Tentaste mudar o valor de uma constante (const). Usa let se o valor vai mudar."],
      [/Identifier '(\S+)' has already been declared/, (m) => `«${m[1]}» foi criado duas vezes (com let, const ou function). Cada nome só pode ser declarado uma vez.`],
      [/missing \) after argument list/, () => "Falta fechar um parêntese «)» ou falta uma vírgula entre os argumentos."],
      [/Unexpected end of input/, () => "O código acaba antes do tempo: falta fechar uma chaveta «}» ou um parêntese «)»."],
      [/Invalid or unexpected token/, () => "Há um carácter inválido. Aspas «curvas» copiadas de um documento? Usa aspas normais \" ou '."],
      [/Unexpected token '?(\S+?)'?$/, (m) => `Erro de sintaxe perto de «${m[1]}». Verifica parênteses, chavetas, vírgulas e ponto e vírgula.`],
      [/Unexpected identifier '?(\S+?)'?$/, (m) => `Erro de sintaxe perto de «${m[1]}». Falta uma vírgula, um operador ou um parêntese?`],
      [/Unexpected (string|number)/, () => "Erro de sintaxe: falta uma vírgula ou um operador entre dois valores?"],
      [/Maximum call stack size exceeded/, () => "Uma função chama-se a si própria sem parar (recursão infinita)."],
    ];
    for (const [re, fn] of rules) {
      const m = re.exec(msg);
      if (m) return fn(m);
    }
    return null;
  }

  function report(err, line) {
    const raw = String(err && err.message !== undefined ? `${err.name}: ${err.message}` : err).replace(/^Uncaught /, "");
    const custom = err && err.__lp5;
    const info = { message: custom ? err.message : raw, hint: custom ? null : explain(raw), line: line || null };
    errors.push(info);
    if (!firstError) firstError = info;
    post({ type: "error", ...info });
    if (CHECK) return;
    try {
      if (window.p5 && p5.instance) p5.instance.noLoop();
    } catch (e) {}
  }

  /** Linha do código do aluno onde aconteceu o erro (o código está num ficheiro à parte, sketch.js). */
  function lineOf(err, fallback) {
    const m = /sketch\.js:(\d+)/.exec((err && err.stack) || "");
    return m ? +m[1] : fallback;
  }

  addEventListener("error", (e) => {
    if (e.error && e.error.__reported) return;
    if (!e.error && /^Script error\.?$/.test(e.message || "")) {
      // Erro dentro do p5.js sem detalhes (não devia acontecer: os scripts vêm com crossorigin).
      report({ __lp5: true, message: "Ocorreu um erro dentro do p5.js. Confirma os argumentos das funções que usaste." }, null);
      return;
    }
    const fromSketch = !e.filename || /sketch\.js|^blob:/.test(e.filename);
    report(e.error || e.message, fromSketch ? lineOf(e.error, e.lineno) : lineOf(e.error, null));
  });
  addEventListener("unhandledrejection", (e) => {
    if (!(e.reason && e.reason.__reported)) report(e.reason, lineOf(e.reason, null));
  });

  // ---------- Proteção contra ciclos infinitos ----------
  // O código do aluno chega com __lp(linha) no início do corpo de cada for/while/do.
  let loopStart = Date.now();
  const LOOP_LIMIT = CHECK ? 1500 : 2500;
  window.__lp = function (line) {
    if (Date.now() - loopStart > LOOP_LIMIT) {
      loopStart = Infinity; // só avisa uma vez por chamada
      const e = new Error(`O ciclo da linha ${line} está a demorar demasiado e foi interrompido. Será um ciclo infinito? Confirma a condição e se a variável muda em cada volta.`);
      e.__lp5 = true;
      e.__line = line;
      report(e, line);
      e.__reported = true;
      throw e;
    }
  };
  const resetLoopClock = () => (loopStart = Date.now());

  // ---------- Consola ----------
  const logs = [];
  function fmt(v, depth = 0) {
    if (typeof v === "string") return depth ? JSON.stringify(v) : v;
    if (typeof v === "number") return String(Math.round(v * 1e4) / 1e4);
    if (v === undefined) return "undefined";
    if (v === null || typeof v === "boolean") return String(v);
    if (typeof v === "function") return `[função ${v.name || ""}]`;
    if (window.p5 && v instanceof p5.Color) return v.toString("#rrggbb");
    if (depth > 2) return "…";
    if (Array.isArray(v)) return `[${v.slice(0, 50).map((x) => fmt(x, depth + 1)).join(", ")}${v.length > 50 ? ", …" : ""}]`;
    try {
      return `{${Object.keys(v).slice(0, 20).map((k) => `${k}: ${fmt(v[k], depth + 1)}`).join(", ")}}`;
    } catch (e) {
      return String(v);
    }
  }
  for (const level of ["log", "info", "warn", "error"]) {
    const orig = console[level].bind(console);
    console[level] = (...args) => {
      orig(...args);
      const text = args.map((a) => fmt(a)).join(" ");
      if (logs.length < 1000) logs.push(text);
      if (logs.length <= 300) post({ type: "log", level, text });
    };
  }
  // print() do p5 também vai para a consola.

  // ---------- Modo de verificação: tempo parado, ecrã sem «retina» ----------
  if (CHECK) {
    window.requestAnimationFrame = () => 0;
    try {
      Object.defineProperty(window, "devicePixelRatio", { get: () => 1 });
    } catch (e) {}
  }

  // ---------- Registo das chamadas às funções de desenho ----------
  const SHAPES = ["ellipse", "circle", "rect", "square", "line", "point", "triangle", "quad", "arc", "text", "bezier", "curve", "image", "endShape"];
  const RECORDED = SHAPES.concat([
    "createCanvas", "resizeCanvas", "background", "clear", "fill", "noFill", "stroke", "noStroke", "strokeWeight",
    "colorMode", "rectMode", "ellipseMode", "angleMode", "textSize", "textAlign", "beginShape", "vertex",
    "translate", "rotate", "scale", "push", "pop", "frameRate", "noLoop", "loop",
    "random", "noise", "map", "dist", "constrain", "lerp", "lerpColor", "color", "print", "keyIsDown", "millis",
  ]);
  const calls = [];
  let bucket = 0; // 0 = setup (e código fora das funções); n = n-ésimo frame do draw()
  let depth = 0;

  const simple = (v, d = 0) => {
    if (typeof v === "number") return Math.round(v * 100) / 100;
    if (typeof v === "string" || typeof v === "boolean" || v === null) return v;
    if (v === undefined) return null;
    if (window.p5 && v instanceof p5.Color) return v.toString("#rrggbbaa").replace(/ff$/, "");
    if (Array.isArray(v) && d < 2) return v.slice(0, 50).map((x) => simple(x, d + 1));
    if (typeof v === "function") return "[função]";
    if (typeof v === "object" && d < 2) {
      const o = {};
      for (const k of Object.keys(v).slice(0, 30)) o[k] = simple(v[k], d + 1);
      return o;
    }
    return String(v);
  };

  /** Cor do canvas ("#rrggbb", ou "#rrggbbaa" se for transparente). */
  function hexColor(style) {
    if (typeof style !== "string") return null;
    if (/^#[0-9a-f]{6}$/i.test(style)) return style.toLowerCase();
    const m = /^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)$/.exec(style);
    if (!m) return style;
    const h = (n) => (+n).toString(16).padStart(2, "0");
    const a = m[4] === undefined ? 1 : +m[4];
    return `#${h(m[1])}${h(m[2])}${h(m[3])}${a < 1 ? h(Math.round(a * 255)) : ""}`;
  }

  if (window.p5) {
    for (const name of RECORDED) {
      const orig = p5.prototype[name];
      if (typeof orig !== "function") continue;
      const isShape = SHAPES.includes(name);
      p5.prototype[name] = function (...args) {
        if (depth === 0 && calls.length < 100000) {
          const c = { f: name, a: args.map((x) => simple(x)), b: bucket };
          if (isShape) {
            try {
              const r = this._renderer;
              c.fill = r._doFill ? hexColor(this.drawingContext.fillStyle) : null;
              c.stroke = r._doStroke ? hexColor(this.drawingContext.strokeStyle) : null;
            } catch (e) {}
          }
          calls.push(c);
        }
        depth++;
        try {
          return orig.apply(this, args);
        } finally {
          depth--;
        }
      };
    }
    p5.prototype.registerMethod("pre", function () {
      bucket = this.frameCount;
      resetLoopClock();
    });
  }

  // ---------- Carregar o código do aluno ----------
  const EVENTS = ["setup", "draw", "mousePressed", "mouseReleased", "mouseClicked", "mouseMoved", "mouseDragged",
    "doubleClicked", "mouseWheel", "keyPressed", "keyReleased", "keyTyped", "windowResized"];

  function afterSketch() {
    // Cada chamada a uma função do aluno recomeça o relógio da proteção contra ciclos infinitos.
    for (const name of EVENTS) {
      const fn = window[name];
      if (typeof fn !== "function") continue;
      window[name] = function (...args) {
        resetLoopClock();
        if (name === "setup") {
          bucket = 0;
          if (CHECK) {
            randomSeed(CFG.seed);
            noiseSeed(CFG.seed);
          }
        }
        return fn.apply(this, args);
      };
    }
    if (typeof window.setup !== "function" && typeof window.draw !== "function" && !firstError) {
      report({ __lp5: true, message: "Não encontrei a função setup(). Um sketch de p5.js começa com function setup() { … }." }, null);
    }
  }

  const code = CFG.code + "\n//# sourceURL=sketch.js";
  const script = document.createElement("script");
  script.src = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
  script.onload = afterSketch;
  document.head.appendChild(script);

  // ---------- Depois de o p5 arrancar (o p5 também espera pelo «load») ----------
  addEventListener("load", () => {
    const inst = window.p5 && p5.instance;
    if (inst && CHECK && typeof window.draw === "function" && inst._setupDone && inst.frameCount === 0) {
      try {
        inst.redraw();
      } catch (e) {
        if (!e.__reported) report(e, lineOf(e, e.__line));
      }
    }
    const size = inst && inst._setupDone ? [inst.width, inst.height] : null;
    post({ type: "ready", size, ok: !!(inst && inst._setupDone) });
  });

  // ---------- O objeto `verifica` (só no modo de verificação) ----------
  const KEYS = { LEFT_ARROW: ["ArrowLeft", 37], RIGHT_ARROW: ["ArrowRight", 39], UP_ARROW: ["ArrowUp", 38], DOWN_ARROW: ["ArrowDown", 40],
    ArrowLeft: ["ArrowLeft", 37], ArrowRight: ["ArrowRight", 39], ArrowUp: ["ArrowUp", 38], ArrowDown: ["ArrowDown", 40],
    ENTER: ["Enter", 13], Enter: ["Enter", 13], ESCAPE: ["Escape", 27], Escape: ["Escape", 27], " ": [" ", 32], ESPACO: [" ", 32] };

  function makeVerifica() {
    const inst = () => {
      if (!(window.p5 && p5.instance && p5.instance._setupDone)) {
        throw new Error(firstError ? `O sketch tem um erro: ${firstError.hint || firstError.message}` : "O sketch não arrancou (falta a função setup()?).");
      }
      return p5.instance;
    };
    const canvasEl = () => inst().canvas;
    const hasDraw = () => typeof window.draw === "function";
    /** Chamadas do último frame desenhado (ou todas, se o sketch não tiver draw()). */
    const lastFrame = () => (hasDraw() ? calls.filter((c) => c.b === bucket) : calls);
    const named = (list, name) => list.filter((c) => c.f === name);

    function run(fn) {
      try {
        fn();
      } catch (e) {
        if (!e.__reported) report(e, lineOf(e, e.__line));
        throw new Error(`O sketch deu um erro: ${e.__lp5 ? e.message : explain(`${e.name}: ${e.message}`) || e.message}`);
      }
    }
    function mouseEvent(type, x, y, extra = {}) {
      const r = canvasEl().getBoundingClientRect();
      const ev = new MouseEvent(type, { clientX: r.left + x, clientY: r.top + y, bubbles: true, cancelable: true, button: 0, view: window, ...extra });
      run(() => window.dispatchEvent(ev));
    }
    function keyInfo(k) {
      if (KEYS[k]) return KEYS[k];
      if (typeof k === "string" && k.length === 1) return [k, k.toUpperCase().charCodeAt(0)];
      throw new Error(`Tecla desconhecida: ${k}`);
    }
    function keyEvent(type, k) {
      const [key, code] = keyInfo(k);
      const ev = new KeyboardEvent(type, { key, keyCode: code, which: code, charCode: type === "keypress" ? key.charCodeAt(0) : 0, bubbles: true, cancelable: true });
      run(() => window.dispatchEvent(ev));
    }

    const v = {
      /** Primeira mensagem de erro do sketch, ou null se não houve erros. */
      erro: () => (firstError ? firstError.hint ?? firstError.message : null),
      /** [largura, altura] do canvas. */
      tela: () => [inst().width, inst().height],
      /** Número do frame atual (frameCount). */
      frame: () => inst().frameCount,
      /** Avança n frames (corre o draw() n vezes). Devolve verifica, para encadear. */
      avanca: (n = 1) => {
        const p = inst();
        if (p._loop) {
          for (let i = 0; i < n; i++) {
            run(() => p.redraw());
            // Como no p5: pmouseX/pmouseY são a posição do rato no fim do frame anterior.
            p._setProperty("pmouseX", p.mouseX);
            p._setProperty("pmouseY", p.mouseY);
          }
        }
        return v;
      },
      /** Põe o rato em (x, y) (sem carregar no botão; se estiver carregado, arrasta). */
      rato: (x, y) => {
        mouseEvent("mousemove", x, y, inst().mouseIsPressed ? { buttons: 1 } : {});
        return v;
      },
      /** Carrega no botão do rato em (x, y) e mantém-no carregado. */
      prime: (x, y) => {
        mouseEvent("mousemove", x, y);
        mouseEvent("mousedown", x, y, { buttons: 1 });
        return v;
      },
      /** Larga o botão do rato. */
      solta: () => {
        const p = inst();
        mouseEvent("mouseup", p.mouseX, p.mouseY);
        mouseEvent("click", p.mouseX, p.mouseY);
        return v;
      },
      /** Clique completo em (x, y). */
      clica: (x, y) => v.prime(x, y).solta(),
      /** Carrega e larga uma tecla: "a", "r", " ", "LEFT_ARROW", "ENTER"… */
      tecla: (k) => v.segura(k).larga(k),
      /** Carrega numa tecla e mantém-na carregada (para keyIsDown). */
      segura: (k) => {
        keyEvent("keydown", k);
        if (keyInfo(k)[0].length === 1) keyEvent("keypress", k);
        return v;
      },
      larga: (k) => {
        keyEvent("keyup", k);
        return v;
      },
      /** Cor do pixel (x, y): "#rrggbb". */
      cor: (x, y) => {
        const p = inst();
        const d = p.pixelDensity();
        const px = p.drawingContext.getImageData(Math.floor(x * d), Math.floor(y * d), 1, 1).data;
        const h = (n) => n.toString(16).padStart(2, "0");
        return `#${h(px[0])}${h(px[1])}${h(px[2])}${px[3] < 255 ? h(px[3]) : ""}`;
      },
      /** A imagem muda ao avançar n frames? */
      mudou: (n = 1) => {
        const p = inst();
        const snap = () => p.drawingContext.getImageData(0, 0, p.canvas.width, p.canvas.height).data;
        const before = snap();
        v.avanca(n);
        const after = snap();
        for (let i = 0; i < before.length; i++) if (before[i] !== after[i]) return true;
        return false;
      },
      /** Quantas vezes a função `nome` foi chamada no último frame (ou no sketch todo, se não houver draw()). */
      chamadas: (nome) => named(lastFrame(), nome).length,
      /** Quantas vezes a função `nome` foi chamada no setup(). */
      noSetup: (nome) => calls.filter((c) => c.b === 0 && c.f === nome).length,
      /** Quantas vezes a função `nome` foi chamada desde o início. */
      todas: (nome) => named(calls, nome).length,
      /** A função `nome` foi chamada alguma vez? */
      usou: (nome) => calls.some((c) => c.f === nome),
      /** Argumentos de cada chamada a `nome` no último frame: [[x, y, d], …]. */
      argumentos: (nome) => named(lastFrame(), nome).map((c) => c.a),
      /** Formas desenhadas no último frame, com a cor: [{f, a, fill, stroke}, …] (só as funções em `nomes`, se indicadas). */
      formas: (...nomes) => lastFrame().filter((c) => (nomes.length ? nomes.includes(c.f) : SHAPES.includes(c.f)))
        .map((c) => ({ f: c.f, a: c.a, fill: c.fill ?? null, stroke: c.stroke ?? null })),
      /** Valor de uma variável global do aluno (aceita "bola.x" ou "bolas[0].x"); null se não existir. */
      variavel: (nome) => {
        if (!/^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*|\[\d+\])*$/.test(nome)) throw new Error(`Nome inválido: ${nome}`);
        try {
          return simple((0, eval)(nome));
        } catch (e) {
          return null;
        }
      },
      /** Existe uma variável ou função global com este nome? */
      existe: (nome) => {
        try {
          return (0, eval)(`typeof ${nome}`) !== "undefined";
        } catch (e) {
          return false;
        }
      },
      /** Chama uma função do aluno e devolve o resultado. */
      chama: (nome, ...args) => {
        const fn = (0, eval)(`typeof ${nome} === "function" ? ${nome} : null`);
        if (!fn) throw new Error(`Não encontrei a função ${nome}().`);
        let out;
        run(() => (out = fn(...args)));
        return simple(out);
      },
      /** O código do aluno. */
      codigo: () => CFG.code,
      /** O código (sem comentários) tem algo que corresponde à expressão regular? */
      noCodigo: (re, flags = "") => new RegExp(re, flags).test(CFG.code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")),
      /** Linhas escritas na consola (console.log / print). */
      consola: () => logs.slice(),
    };
    return v;
  }

  if (CHECK) {
    addEventListener("message", async (e) => {
      const d = e.data;
      if (!d || d.lp5 !== CFG.token || d.type !== "eval") return;
      try {
        const fn = new Function("verifica", `return (async () => (\n${d.expr}\n))();`);
        const value = await fn(makeVerifica());
        post({ type: "result", id: d.id, actual: JSON.stringify(value === undefined ? null : value) });
      } catch (err) {
        post({ type: "result", id: d.id, error: (err && err.message) || String(err) });
      }
    });
  } else {
    addEventListener("message", (e) => {
      const d = e.data;
      if (!d || d.lp5 !== CFG.token || !(window.p5 && p5.instance)) return;
      if (d.type === "pause") p5.instance.noLoop();
      if (d.type === "resume") p5.instance.loop();
    });
  }
})();
