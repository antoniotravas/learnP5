---
id: aleatorio
track: Animação
title: Aleatório e ruído
icon: 🎲
summary: random(), noise() e map() para arte generativa.
---

# Aleatório e ruído

Na **arte generativa**, o artista escreve as regras e o computador escolhe os pormenores. Para isso precisamos de números que o próprio programa inventa.

## random()

| Escreves | Dá |
|---|---|
| `random(10)` | um número decimal entre 0 e 10 (sem chegar ao 10) |
| `random(50, 100)` | um número entre 50 e 100 |
| `random(["vermelho", "azul"])` | um dos elementos da lista, à sorte |

Cada vez que chamas `random`, sai um número diferente:

```js
function setup() {
  createCanvas(400, 300);
  background(20);
  noStroke();
  for (let i = 0; i < 100; i++) {
    fill(random(255), random(255), random(255), 180);
    circle(random(width), random(height), random(5, 40));
  }
}
```

Carrega várias vezes em **Experimentar**: o desenho é sempre diferente!

> 💡 Para números inteiros, usa `floor(random(6)) + 1` (um dado: 1 a 6).

## noise(): aleatório "suave"

O `random` salta de um valor para outro sem ligação nenhuma. O **`noise`** (ruído de Perlin) dá valores entre **0 e 1** que mudam **devagar**: valores próximos à entrada dão resultados próximos à saída. É ótimo para movimentos naturais, como uma folha ao vento.

```js
let t = 0;

function setup() {
  createCanvas(400, 200);
}

function draw() {
  background(240);
  let x = noise(t) * width;              // noise dá 0..1; vezes width dá 0..400
  let y = noise(t + 100) * height;       // outra "zona" do ruído para o y
  circle(x, y, 30);
  t = t + 0.01;                          // avançar devagar = movimento suave
}
```

## map(): mudar de escala

`map(valor, min1, max1, min2, max2)` converte um valor de uma escala para outra. Por exemplo, `map(x, 0, width, 0, 255)` transforma uma posição (0 a 400) numa cor (0 a 255):

```js
function setup() {
  createCanvas(400, 100);
  noStroke();
  for (let x = 0; x < width; x += 20) {
    fill(map(x, 0, width, 0, 255), 120, 200);
    rect(x, 0, 20, 100);
  }
}
```

> 🎯 Nas verificações dos exercícios, o `random` dá sempre a mesma sequência de números (com `randomSeed`), por isso o resultado é sempre o mesmo.

=== exercicio ceu-estrelado
title: Céu estrelado
difficulty: 1

--- enunciado
Numa tela de **400 × 400** com fundo azul-noite **(10, 10, 40)**, desenha **150 estrelas**: pontos brancos em posições **aleatórias**, espalhados por toda a tela.

Desenha tudo no `setup()` (as estrelas não se mexem).

--- inicio
function setup() {
  createCanvas(400, 400);
  background(10, 10, 40);
  stroke(255);
  strokeWeight(2);

}

--- pista
`for (let i = 0; i < 150; i++) { point(random(width), random(height)); }`

--- teste: Há 150 estrelas
verifica.chamadas("point")
=> 150

--- teste: Estão todas dentro da tela
verifica.argumentos("point").every(([x, y]) => x >= 0 && x <= 400 && y >= 0 && y <= 400)
=> true

--- teste: Estão espalhadas (posições aleatórias)
(() => { const p = verifica.argumentos("point"); return new Set(p.map(a => a[0])).size > 100 && p.some(a => a[0] < 100) && p.some(a => a[0] > 300) && p.some(a => a[1] < 100) && p.some(a => a[1] > 300); })()
=> true

--- solucao
function setup() {
  createCanvas(400, 400);
  background(10, 10, 40);
  stroke(255);
  strokeWeight(2);
  for (let i = 0; i < 150; i++) {
    point(random(width), random(height));
  }
}

=== exercicio bola-nervosa
title: Bola nervosa
difficulty: 2

--- enunciado
Numa tela de **400 × 400**, desenha em cada frame um círculo com **50** de diâmetro **perto do centro**: em cada frame, o centro fica num sítio aleatório entre **195 e 205** (no x e no y), por isso a bola "treme".

Pinta o fundo em cada frame.

--- inicio
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(250, 230, 200);
  fill(200, 60, 60);
  circle(200, 200, 50);
}

--- pista
`circle(200 + random(-5, 5), 200 + random(-5, 5), 50);` ou `circle(random(195, 205), random(195, 205), 50);`

--- teste: A bola fica sempre perto do centro
(() => { for (let i = 0; i < 60; i++) { const [x, y, d] = verifica.avanca().argumentos("circle")[0]; if (Math.abs(x - 200) > 5 || Math.abs(y - 200) > 5 || d !== 50) return false; } return true; })()
=> true

--- teste: A bola treme (muda de posição)
(() => { const xs = new Set(), ys = new Set(); for (let i = 0; i < 30; i++) { const [x, y] = verifica.avanca().argumentos("circle")[0]; xs.add(x); ys.add(y); } return xs.size > 10 && ys.size > 10; })()
=> true

--- solucao
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(250, 230, 200);
  fill(200, 60, 60);
  circle(200 + random(-5, 5), 200 + random(-5, 5), 50);
}

=== exercicio passeio-suave
title: Passeio suave
difficulty: 3

--- enunciado
Faz uma bola passear **suavemente** pela tela (**400 × 400**) com `noise()`:

1. cria uma variável **`t`** a começar em 0;
2. no `draw()`, a bola (30 de diâmetro) fica em `x = noise(t) * width` e `y = noise(t + 1000) * height`;
3. no fim de cada frame, soma **0.01** ao `t`.

Ao contrário do `random`, a bola não salta: desliza.

--- inicio
let t = 0;

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(230, 240, 255);
  let x = random(width);
  let y = random(height);
  circle(x, y, 30);
}

--- pista
Troca os `random(...)` por `noise(t) * width` e `noise(t + 1000) * height`, e acrescenta `t = t + 0.01;` no fim do `draw()`.

--- teste: Usaste noise()
verifica.avanca().usou("noise")
=> true

--- teste: A bola não dá saltos (move-se no máximo 10 píxeis por frame)
(() => { let [px, py] = verifica.argumentos("circle")[0]; for (let i = 0; i < 300; i++) { const [x, y] = verifica.avanca().argumentos("circle")[0]; if (Math.abs(x - px) > 10 || Math.abs(y - py) > 10) return false; px = x; py = y; } return true; })()
=> true

--- teste: A bola passeia (não fica parada)
(() => { const xs = []; for (let i = 0; i < 300; i++) xs.push(verifica.avanca().argumentos("circle")[0][0]); return Math.max(...xs) - Math.min(...xs) > 40; })()
=> true

--- teste: A bola fica dentro da tela
(() => { for (let i = 0; i < 200; i++) { const [x, y] = verifica.avanca().argumentos("circle")[0]; if (x < 0 || x > 400 || y < 0 || y > 400) return false; } return true; })()
=> true

--- solucao
let t = 0;

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(230, 240, 255);
  let x = noise(t) * width;
  let y = noise(t + 1000) * height;
  circle(x, y, 30);
  t = t + 0.01;
}
