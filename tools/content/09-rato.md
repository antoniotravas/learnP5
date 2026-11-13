---
id: rato
track: Interação
title: O rato
icon: 🖱️
summary: mouseX, mouseY, mouseIsPressed e mousePressed() para sketches interativos.
---

# O rato

Até agora, o sketch fazia sempre o mesmo. Com o rato, quem está a ver passa a participar!

## Onde está o rato?

O p5 atualiza estas variáveis em cada frame:

| Variável | O que guarda |
|---|---|
| `mouseX`, `mouseY` | a posição atual do rato na tela |
| `pmouseX`, `pmouseY` | a posição do rato no frame **anterior** |
| `mouseIsPressed` | `true` enquanto o botão está carregado, `false` caso contrário |

```js
function setup() {
  createCanvas(400, 300);
}

function draw() {
  background(30);
  fill(255, 200, 0);
  circle(mouseX, mouseY, 40);     // a bola segue o rato
  if (mouseIsPressed) {
    fill(255, 0, 80);
    circle(mouseX, mouseY, 80);   // e cresce quando carregas
  }
}
```

## Funções de eventos

Também podes escrever funções que o p5 chama **sozinho** quando algo acontece:

| Função | Quando é chamada |
|---|---|
| `mousePressed()` | uma vez, quando carregas no botão |
| `mouseReleased()` | quando largas o botão |
| `mouseClicked()` | quando fazes um clique (carregar e largar) |
| `mouseMoved()` | quando o rato se mexe sem botão carregado |
| `mouseDragged()` | quando o rato se mexe com o botão carregado |

```js
let cliques = 0;

function setup() {
  createCanvas(300, 200);
  textSize(48);
  textAlign(CENTER, CENTER);
}

function draw() {
  background(240);
  text(cliques, width / 2, height / 2);
}

function mousePressed() {
  cliques = cliques + 1;    // conta cada clique, uma só vez
}
```

> 💡 **Qual a diferença?** `mouseIsPressed` no `draw()` é verdadeiro em **todos** os frames enquanto o botão está em baixo (60 vezes por segundo!). `mousePressed()` corre **uma vez** por clique. Para contar cliques, usa a função.

## O rato está dentro de uma forma?

`dist(x1, y1, x2, y2)` dá a distância entre dois pontos. O rato está dentro de um círculo quando a distância ao centro é menor do que o **raio** (metade do diâmetro):

```js
if (dist(mouseX, mouseY, 200, 150) < 50) {
  // o rato está dentro do círculo de centro (200, 150) e diâmetro 100
}
```

## Escrever texto

`text("Olá", x, y)` escreve texto na tela; `textSize(32)` muda o tamanho da letra e `textAlign(CENTER, CENTER)` centra o texto no ponto (x, y).

=== exercicio segue-o-rato
title: Segue o rato
difficulty: 1

--- enunciado
Numa tela de **400 × 300**, desenha em cada frame um círculo com **50** de diâmetro na **posição do rato**. Pinta o fundo em cada frame, para não deixar rasto.

--- inicio
function setup() {
  createCanvas(400, 300);
}

function draw() {
  background(20, 20, 40);
  fill(100, 200, 255);
  circle(200, 150, 50);
}

--- pista
Troca `200, 150` por `mouseX, mouseY`.

--- teste: O círculo vai para onde está o rato
verifica.rato(100, 50).avanca().argumentos("circle")
=> [[100, 50, 50]]

--- teste: E continua a seguir o rato
verifica.rato(320, 260).avanca().argumentos("circle")
=> [[320, 260, 50]]

--- teste: Não deixa rasto
verifica.rato(100, 50).avanca().rato(300, 250).avanca().cor(100, 50)
=> "#141428"

--- solucao
function setup() {
  createCanvas(400, 300);
}

function draw() {
  background(20, 20, 40);
  fill(100, 200, 255);
  circle(mouseX, mouseY, 50);
}

=== exercicio pincel
title: Pincel
difficulty: 2

--- enunciado
Transforma o sketch num programa de desenho (tela de **400 × 400**, fundo branco só no `setup()`):

- **enquanto o botão do rato estiver carregado**, desenha uma linha **preta** com **8** de grossura, da posição anterior do rato (`pmouseX`, `pmouseY`) até à atual (`mouseX`, `mouseY`);
- sem o botão carregado, não desenha nada.

--- inicio
function setup() {
  createCanvas(400, 400);
  background(255);
}

function draw() {
  stroke(0);
  strokeWeight(8);

}

--- pista
`if (mouseIsPressed) { line(pmouseX, pmouseY, mouseX, mouseY); }`

--- teste: Sem carregar no botão, não pinta
verifica.rato(100, 100).avanca().rato(300, 100).avanca().cor(200, 100)
=> "#ffffff"

--- teste: Com o botão carregado, pinta
verifica.rato(100, 100).avanca().prime(100, 100).avanca().rato(300, 100).avanca().cor(200, 100)
=> "#000000"

--- teste: Depois de largar o botão, para de pintar
verifica.rato(100, 300).avanca().prime(100, 300).avanca().solta().rato(300, 300).avanca().cor(200, 300)
=> "#ffffff"

--- teste: O fundo não é apagado no draw()
verifica.avanca().chamadas("background")
=> 0

--- solucao
function setup() {
  createCanvas(400, 400);
  background(255);
}

function draw() {
  stroke(0);
  strokeWeight(8);
  if (mouseIsPressed) {
    line(pmouseX, pmouseY, mouseX, mouseY);
  }
}

=== exercicio botao
title: Um botão
difficulty: 3

--- enunciado
Faz um botão redondo que conta os cliques:

1. o botão é um círculo com centro em **(200, 200)** e **100** de diâmetro;
2. uma variável **`cliques`**, a começar em 0, aumenta **1** cada vez que se carrega **dentro** do botão (clicar fora não conta);
3. o número de cliques aparece escrito na tela com `text(cliques, 200, 330)`.

Usa a função `mousePressed()` e a função `dist()`.

--- inicio
let cliques = 0;

function setup() {
  createCanvas(400, 400);
  textSize(40);
  textAlign(CENTER, CENTER);
}

function draw() {
  background(240);
  fill(230, 60, 90);
  circle(200, 200, 100);
  fill(0);
  text(cliques, 200, 330);
}

function mousePressed() {

}

--- pista
Dentro do `mousePressed()`: `if (dist(mouseX, mouseY, 200, 200) < 50) { cliques = cliques + 1; }` (50 é o raio).

--- teste: Um clique no botão conta
verifica.clica(200, 200).variavel("cliques")
=> 1

--- teste: Um clique fora do botão não conta
verifica.clica(20, 20).clica(380, 380).variavel("cliques")
=> 0

--- teste: Conta perto da borda, por dentro
verifica.clica(240, 200).clica(200, 160).variavel("cliques")
=> 2

--- teste: O número aparece na tela
verifica.clica(200, 200).clica(210, 190).avanca().argumentos("text").some(a => String(a[0]) === "2")
=> true

--- solucao
let cliques = 0;

function setup() {
  createCanvas(400, 400);
  textSize(40);
  textAlign(CENTER, CENTER);
}

function draw() {
  background(240);
  fill(230, 60, 90);
  circle(200, 200, 100);
  fill(0);
  text(cliques, 200, 330);
}

function mousePressed() {
  if (dist(mouseX, mouseY, 200, 200) < 50) {
    cliques = cliques + 1;
  }
}
