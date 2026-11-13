---
id: condicoes
track: Animação
title: Condições
icon: 🔀
summary: if e else para tomar decisões — e uma bola que ressalta nas paredes.
---

# Condições

Uma bola que anda para a direita acaba por sair da tela e nunca mais volta. Para a fazer voltar, o programa tem de **tomar decisões**: "**se** a bola passou da borda, **então** faz isto". É para isso que serve o **`if`**.

## if

```js
if (x > width) {
  x = 0;
}
```

O código entre `{` e `}` só corre **se** a condição entre parênteses for verdadeira.

## Comparações

| Escreves | Significa |
|---|---|
| `a > b` | a maior do que b |
| `a < b` | a menor do que b |
| `a >= b` | a maior ou igual a b |
| `a <= b` | a menor ou igual a b |
| `a === b` | a igual a b |
| `a !== b` | a diferente de b |

> ⚠️ `=` **guarda** um valor numa variável; `===` **compara** dois valores. Trocá-los é um dos erros mais comuns!

## else

Com `else` ("senão") escolhes o que fazer quando a condição é falsa:

```js
if (x < width / 2) {
  background(0, 0, 100);   // metade esquerda: azul
} else {
  background(200, 0, 0);   // metade direita: vermelho
}
```

## Juntar condições

- `&&` — **e**: as duas condições têm de ser verdadeiras;
- `||` — **ou**: basta uma ser verdadeira.

```js
if (x < 0 || x > width) {
  // a bola saiu por um dos lados
}
```

## Velocidade e ressalto

Para uma bola ressaltar, guardamos a **velocidade** numa variável. Quando bate numa parede, a velocidade troca de sinal (de `+3` passa a `-3`): a bola passa a andar no sentido contrário.

```js
let x = 100;
let vx = 3;

function setup() {
  createCanvas(400, 150);
}

function draw() {
  background(230);
  circle(x, 75, 40);
  x = x + vx;
  if (x > width || x < 0) {
    vx = -vx;     // troca o sentido
  }
}
```

=== exercicio volta-ao-inicio
title: Volta ao início
difficulty: 1

--- enunciado
A bola do código inicial anda para a direita e sai da tela para sempre. Acrescenta uma condição para que, quando **`x` passar da largura da tela** (`width`), volte a **0**.

--- inicio
let x = 0;

function setup() {
  createCanvas(400, 200);
}

function draw() {
  background(220);
  circle(x, 100, 40);
  x = x + 5;
}

--- pista
No fim do `draw()`: `if (x > width) { x = 0; }`.

--- teste: A bola volta ao início e nunca se afasta da tela
(() => { let max = 0, voltou = false, antes = verifica.variavel("x"); for (let i = 0; i < 200; i++) { const x = verifica.avanca().variavel("x"); max = Math.max(max, x); if (x < antes) voltou = true; antes = x; } return [voltou, max <= 405]; })()
=> [true, true]

--- teste: A bola continua em y = 100
verifica.avanca(100).argumentos("circle").map(a => a[1])
=> [100]

--- solucao
let x = 0;

function setup() {
  createCanvas(400, 200);
}

function draw() {
  background(220);
  circle(x, 100, 40);
  x = x + 5;
  if (x > width) {
    x = 0;
  }
}

=== exercicio metade
title: Esquerda ou direita
difficulty: 2

--- enunciado
A bola anda da esquerda para a direita. Muda a cor do fundo conforme o lado em que ela está:

- se `x` for **menor** do que metade da largura (`width / 2`), o fundo é azul-escuro: **(20, 30, 80)**;
- senão, o fundo é laranja: **(240, 140, 40)**.

--- inicio
let x = 0;

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(20, 30, 80);
  fill(255);
  circle(x, 200, 50);
  x = x + 2;
}

--- pista
Troca o `background(...)` por um `if (x < width / 2) { ... } else { ... }` com um `background` em cada parte.

--- teste: No início, o fundo é azul-escuro
verifica.cor(5, 5)
=> "#141e50"

--- teste: Depois de passar o meio, o fundo é laranja
verifica.avanca(120).cor(5, 5)
=> "#f08c28"

--- teste: Usaste if e else
verifica.noCodigo("if\\s*\\(") && verifica.noCodigo("else")
=> true

--- solucao
let x = 0;

function setup() {
  createCanvas(400, 400);
}

function draw() {
  if (x < width / 2) {
    background(20, 30, 80);
  } else {
    background(240, 140, 40);
  }
  fill(255);
  circle(x, 200, 50);
  x = x + 2;
}

=== exercicio ressalto
title: Bola saltitona
difficulty: 3
badge: ressalto

--- enunciado
Faz uma bola com **30** de diâmetro ressaltar nas **quatro paredes** de uma tela de **400 × 300**.

- A bola tem posição `x`, `y` e velocidade `vx` (horizontal) e `vy` (vertical).
- Em cada frame, soma a velocidade à posição.
- Quando bate numa parede da esquerda ou da direita, troca o sinal de `vx`; quando bate em cima ou em baixo, troca o sinal de `vy`.

A bola nunca pode sair da tela.

--- inicio
let x = 200;
let y = 150;
let vx = 4;
let vy = 3;

function setup() {
  createCanvas(400, 300);
}

function draw() {
  background(30, 40, 60);
  fill(255, 120, 80);
  circle(x, y, 30);
  x = x + vx;
  y = y + vy;
}

--- pista
`if (x > width || x < 0) { vx = -vx; }` — e o mesmo para o `y`, com `height` e `vy`.

--- teste: A bola nunca sai da tela
(() => { for (let i = 0; i < 400; i++) { const [x, y] = verifica.avanca().argumentos("circle")[0]; if (x < -5 || x > 405 || y < -5 || y > 305) return false; } return true; })()
=> true

--- teste: Ressalta nas paredes da esquerda e da direita
(() => { const xs = []; for (let i = 0; i < 400; i++) xs.push(verifica.avanca().argumentos("circle")[0][0]); return xs.some((x, i) => i > 1 && Math.sign(x - xs[i - 1]) !== Math.sign(xs[i - 1] - xs[i - 2])); })()
=> true

--- teste: Ressalta em cima e em baixo
(() => { const ys = []; for (let i = 0; i < 400; i++) ys.push(verifica.avanca().argumentos("circle")[0][1]); return ys.some((y, i) => i > 1 && Math.sign(y - ys[i - 1]) !== Math.sign(ys[i - 1] - ys[i - 2])); })()
=> true

--- solucao
let x = 200;
let y = 150;
let vx = 4;
let vy = 3;

function setup() {
  createCanvas(400, 300);
}

function draw() {
  background(30, 40, 60);
  fill(255, 120, 80);
  circle(x, y, 30);
  x = x + vx;
  y = y + vy;
  if (x > width || x < 0) {
    vx = -vx;
  }
  if (y > height || y < 0) {
    vy = -vy;
  }
}
