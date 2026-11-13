---
id: draw
track: Animação
title: O ciclo draw()
icon: 🎞️
summary: Como uma animação funciona: frames, frameCount e variáveis que mudam.
---

# O ciclo draw()

Um desenho animado é uma sequência de imagens paradas (**frames**) mostradas muito depressa. O p5 faz o mesmo: além do `setup()`, podes escrever uma função **`draw()`**, que o p5 corre **sem parar**, cerca de **60 vezes por segundo**.

| Função | Quando corre |
|---|---|
| `setup()` | uma vez, no início |
| `draw()` | a seguir ao `setup()`, uma vez por frame, até parares o sketch |

## Movimento: uma variável que muda

Para algo se mexer, a sua posição tem de ser uma **variável** que muda um bocadinho em cada frame:

```js
let x = 0;

function setup() {
  createCanvas(400, 200);
}

function draw() {
  background(220);
  circle(x, 100, 40);
  x = x + 2;        // em cada frame, a bola anda 2 píxeis para a direita
}
```

> 💡 `x = x + 2` lê-se "o novo x é o x antigo mais 2". Há formas mais curtas de escrever o mesmo: `x += 2`. E para somar 1: `x++`.

## Porque é que o background() está no draw()?

Experimenta tirar o `background(220);` do `draw()` (e pô-lo no `setup()`): a bola deixa um **rasto**, porque cada frame é pintado por cima do anterior, sem apagar. Às vezes é mesmo isso que queremos (para fazer um "pincel", por exemplo).

## frameCount

O p5 conta os frames por ti na variável **`frameCount`**: vale 1 no primeiro frame, 2 no segundo, e assim por diante. É uma forma rápida de animar sem criar variáveis:

```js
function setup() {
  createCanvas(300, 300);
}

function draw() {
  background(30);
  fill(255, 180, 0);
  circle(150, 150, frameCount % 300);   // cresce e volta ao início
}
```

(O `%` é o **resto da divisão**: `frameCount % 300` vai de 0 a 299 e recomeça.)

## Velocidade

- `frameRate(30);` no `setup()` muda o número de frames por segundo.
- Para parar o `draw()`, usa `noLoop();` (e `loop();` para recomeçar).

=== exercicio bola-a-andar
title: A bola anda
difficulty: 1

--- enunciado
Faz uma bola andar para a direita:

1. no topo, uma variável **`x`** que começa em **0**;
2. no `draw()`: pinta o fundo (`background(220)`), desenha um círculo em **(x, 100)** com **40** de diâmetro e, a seguir, soma **3** ao `x`.

Assim, a bola anda 3 píxeis por frame.

--- inicio
let x = 0;

function setup() {
  createCanvas(400, 200);
}

function draw() {
  background(220);

}

--- pista
Dentro do `draw()`, depois do `background`: `circle(x, 100, 40);` e `x = x + 3;`.

--- teste: Há um círculo com 40 de diâmetro em y = 100
verifica.argumentos("circle").map(a => [a[1], a[2]])
=> [[100, 40]]

--- teste: A bola anda 3 píxeis por frame
(() => { const a = verifica.argumentos("circle")[0][0]; const b = verifica.avanca(10).argumentos("circle")[0][0]; return b - a; })()
=> 30

--- teste: O fundo é pintado em cada frame
verifica.avanca(2).chamadas("background")
=> 1

--- solucao
let x = 0;

function setup() {
  createCanvas(400, 200);
}

function draw() {
  background(220);
  circle(x, 100, 40);
  x = x + 3;
}

=== exercicio cresce
title: Um círculo que cresce
difficulty: 1

--- enunciado
Numa tela de **400 × 400**, desenha no `draw()` um círculo no **centro** cujo diâmetro é igual a **`frameCount`**. Pinta o fundo em cada frame.

No frame 50, por exemplo, o círculo tem 50 de diâmetro.

--- inicio
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(20, 30, 60);
  fill(255, 200, 0);
  circle(200, 200, 100);
}

--- pista
Troca o `100` por `frameCount`.

--- teste: No frame 50, o diâmetro é 50
verifica.avanca(49).argumentos("circle")
=> [[200, 200, 50]]

--- teste: No frame 120, o diâmetro é 120
verifica.avanca(119).argumentos("circle")
=> [[200, 200, 120]]

--- teste: Usaste frameCount
verifica.noCodigo("frameCount")
=> true

--- solucao
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(20, 30, 60);
  fill(255, 200, 0);
  circle(200, 200, frameCount);
}

=== exercicio rasto
title: Deixa rasto
difficulty: 2

--- enunciado
Numa tela de **400 × 400**:

1. pinta o fundo de **preto** só **uma vez**, no `setup()`;
2. no `draw()`, desenha um círculo **branco** sem contorno, com **20** de diâmetro, em `(frameCount * 4, 200)`.

Como o fundo não é apagado em cada frame, o círculo deixa um **rasto** branco.

--- inicio
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(0);
  noStroke();
  fill(255);
  circle(frameCount * 4, 200, 20);
}

--- pista
Passa o `background(0);` do `draw()` para o `setup()`.

--- teste: O fundo é pintado no setup()
verifica.noSetup("background") >= 1
=> true

--- teste: O fundo não é apagado no draw()
verifica.avanca(2).chamadas("background")
=> 0

--- teste: Fica um rasto branco
verifica.avanca(30).cor(40, 200)
=> "#ffffff"

--- teste: Fora do caminho continua preto
verifica.avanca(30).cor(40, 100)
=> "#000000"

--- solucao
function setup() {
  createCanvas(400, 400);
  background(0);
}

function draw() {
  noStroke();
  fill(255);
  circle(frameCount * 4, 200, 20);
}
