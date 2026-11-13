---
id: funcoes
track: Interação
title: Funções e arrays
icon: 🧩
summary: As tuas próprias funções, listas de valores e muitos objetos ao mesmo tempo.
---

# Funções e arrays

Os sketches estão a crescer. Duas ferramentas ajudam a mantê-los arrumados: **funções** (dar um nome a um bloco de código) e **arrays** (guardar muitos valores numa só variável).

## As tuas próprias funções

Já escreves funções há muito tempo: `setup()` e `draw()`! Podes criar outras. Com **parâmetros**, a mesma função desenha em sítios diferentes:

```js
function setup() {
  createCanvas(400, 200);
  background(200, 230, 255);
  arvore(80, 180);
  arvore(200, 180);
  arvore(320, 180);
}

function arvore(x, y) {
  fill(120, 80, 40);
  rect(x - 10, y - 60, 20, 60);     // tronco
  fill(40, 160, 70);
  circle(x, y - 80, 70);            // copa
}
```

`x` e `y` são os **parâmetros**: em cada chamada recebem os valores que estão entre parênteses.

## Funções que devolvem um valor

Com **`return`**, uma função faz uma conta e devolve o resultado:

```js
function dobro(n) {
  return n * 2;
}

function setup() {
  print(dobro(21));   // escreve 42 na consola
}
```

## Arrays

Um **array** é uma lista de valores, entre `[` e `]`:

```js
let cores = ["red", "orange", "gold"];
```

| Escreves | Dá |
|---|---|
| `cores[0]` | o primeiro elemento (`"red"`) — conta-se a partir de **0**! |
| `cores.length` | quantos elementos tem (3) |
| `cores.push("pink")` | acrescenta um elemento no fim |

Com um ciclo `for` percorres o array todo:

```js
for (let i = 0; i < cores.length; i++) {
  fill(cores[i]);
  circle(50 + i * 60, 50, 50);
}
```

## Objetos: juntar dados

Um **objeto** junta várias informações sobre a mesma coisa, entre `{` e `}`:

```js
let bola = { x: 100, y: 50, v: 2 };
bola.y = bola.y + bola.v;    // lê e muda com o ponto
```

Um array de objetos permite animar **muitas** coisas ao mesmo tempo:

```js
let bolas = [];

function setup() {
  createCanvas(400, 300);
}

function draw() {
  background(20);
  for (let i = 0; i < bolas.length; i++) {
    bolas[i].y = bolas[i].y + 2;
    circle(bolas[i].x, bolas[i].y, 20);
  }
}

function mousePressed() {
  bolas.push({ x: mouseX, y: mouseY });   // cada clique cria uma bola nova
}
```

=== exercicio jardim
title: Um jardim de funções
difficulty: 2

--- enunciado
1. Cria uma função **`flor(x, y)`** que desenha uma flor com centro em `(x, y)`: **4 pétalas** (círculos com 30 de diâmetro, à volta do centro) e, por cima, o miolo — um círculo **amarelo (255, 255, 0)** com **25** de diâmetro em `(x, y)`.
2. No `setup()`, chama a função **três vezes** para desenhar flores em **(100, 200)**, **(200, 150)** e **(300, 250)**.

--- inicio
function setup() {
  createCanvas(400, 400);
  background(120, 200, 120);
  // chama aqui a função flor três vezes
}

// cria aqui a função flor(x, y)

--- pista
As pétalas podem ficar em `(x - 15, y)`, `(x + 15, y)`, `(x, y - 15)` e `(x, y + 15)`. O miolo vem no fim: `fill(255, 255, 0); circle(x, y, 25);`.

--- teste: Existe a função flor
verifica.existe("flor")
=> true

--- teste: Os miolos amarelos estão nos três sítios
verifica.formas("circle", "ellipse").filter(f => f.fill === "#ffff00" && f.a[2] === 25).map(f => f.a[0] + "," + f.a[1]).sort()
=> ["100,200", "200,150", "300,250"]

--- teste: Cada flor tem pelo menos 4 pétalas
verifica.formas("circle", "ellipse").filter(f => f.fill !== "#ffff00").length >= 12
=> true

--- teste: O miolo fica por cima das pétalas
(() => { const f = verifica.formas("circle", "ellipse"); return f.length > 0 && f[f.length - 1].fill === "#ffff00"; })()
=> true

--- solucao
function setup() {
  createCanvas(400, 400);
  background(120, 200, 120);
  flor(100, 200);
  flor(200, 150);
  flor(300, 250);
}

function flor(x, y) {
  noStroke();
  fill(255, 120, 180);
  circle(x - 15, y, 30);
  circle(x + 15, y, 30);
  circle(x, y - 15, 30);
  circle(x, y + 15, 30);
  fill(255, 255, 0);
  circle(x, y, 25);
}

=== exercicio contas
title: Funções que devolvem
difficulty: 2

--- enunciado
Escreve duas funções que **devolvem** (com `return`) o resultado de uma conta:

1. **`media(a, b)`** — a média de dois números (`media(4, 10)` dá 7);
2. **`areaCirculo(r)`** — a área de um círculo de raio `r`: π × r × r (no p5, π é a constante **`PI`**).

O `setup()` do código inicial usa as funções para escrever os resultados na tela.

--- inicio
function setup() {
  createCanvas(400, 200);
  background(255);
  textSize(24);
  text("Média de 4 e 10: " + media(4, 10), 20, 80);
  text("Área (r = 2): " + areaCirculo(2), 20, 140);
}

// escreve aqui as funções media e areaCirculo

--- pista
`function media(a, b) { return (a + b) / 2; }` — atenção aos parênteses: sem eles, só o `b` é dividido!

--- teste: media(4, 10) dá 7
verifica.chama("media", 4, 10)
=> 7

--- teste: media(1, 2) dá 1.5
verifica.chama("media", 1, 2)
=> 1.5

--- teste: areaCirculo(2) dá 12.57 (arredondado)
verifica.chama("areaCirculo", 2)
=> 12.57

--- teste: areaCirculo(10) dá 314.16 (arredondado)
verifica.chama("areaCirculo", 10)
=> 314.16

--- solucao
function setup() {
  createCanvas(400, 200);
  background(255);
  textSize(24);
  text("Média de 4 e 10: " + media(4, 10), 20, 80);
  text("Área (r = 2): " + areaCirculo(2), 20, 140);
}

function media(a, b) {
  return (a + b) / 2;
}

function areaCirculo(r) {
  return PI * r * r;
}

=== exercicio chuva
title: Chuva de bolas
difficulty: 3

--- enunciado
Cria uma chuva de bolas com um **array de objetos**:

1. o array **`bolas`** começa vazio;
2. cada clique (`mousePressed()`) acrescenta ao array uma bola nova na posição do rato: `{ x: mouseX, y: mouseY }`;
3. em cada frame, **todas** as bolas descem **3** píxeis e são desenhadas com `circle(bola.x, bola.y, 20)`.

--- inicio
let bolas = [];

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(20, 30, 50);
  fill(120, 200, 255);
  // percorre o array: cada bola desce 3 e é desenhada

}

function mousePressed() {

}

--- pista
No `mousePressed()`: `bolas.push({ x: mouseX, y: mouseY });`. No `draw()`: `for (let i = 0; i < bolas.length; i++) { bolas[i].y = bolas[i].y + 3; circle(bolas[i].x, bolas[i].y, 20); }`.

--- teste: Cada clique cria uma bola
[verifica.variavel("bolas.length"), verifica.clica(100, 50).clica(300, 80).variavel("bolas.length")]
=> [0, 2]

--- teste: As bolas novas ficam onde se clicou
verifica.clica(100, 50).clica(300, 80).variavel("bolas").map(b => [b.x, b.y])
=> [[100, 50], [300, 80]]

--- teste: Todas as bolas são desenhadas
verifica.clica(100, 50).clica(300, 80).clica(200, 10).avanca().chamadas("circle")
=> 3

--- teste: As bolas descem 3 píxeis por frame
(() => { verifica.clica(100, 50); const y1 = verifica.avanca().argumentos("circle")[0][1]; const y2 = verifica.avanca(10).argumentos("circle")[0][1]; return y2 - y1; })()
=> 30

--- solucao
let bolas = [];

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(20, 30, 50);
  fill(120, 200, 255);
  for (let i = 0; i < bolas.length; i++) {
    bolas[i].y = bolas[i].y + 3;
    circle(bolas[i].x, bolas[i].y, 20);
  }
}

function mousePressed() {
  bolas.push({ x: mouseX, y: mouseY });
}
