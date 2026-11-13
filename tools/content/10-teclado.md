---
id: teclado
track: Interação
title: O teclado
icon: ⌨️
summary: keyPressed(), key, keyIsDown() e as setas — o início de um jogo.
---

# O teclado

Com o teclado, os teus sketches começam a parecer **jogos**: mover uma nave, mudar de cor, escrever texto.

## keyPressed() e key

A função **`keyPressed()`** é chamada **uma vez** sempre que se carrega numa tecla. Lá dentro, a variável **`key`** diz qual foi:

```js
let fundo = 255;

function setup() {
  createCanvas(400, 200);
}

function draw() {
  background(fundo);
  text("Carrega em p (preto) ou b (branco)", 20, 100);
}

function keyPressed() {
  if (key === "p") {
    fundo = 0;
  }
  if (key === "b") {
    fundo = 255;
  }
}
```

> 💡 Clica primeiro no resultado do sketch: as teclas só chegam ao sketch se ele tiver o "foco".

## Teclas especiais: keyCode

Para as teclas que não são letras usa-se **`keyCode`** e as constantes do p5:

| Constante | Tecla |
|---|---|
| `LEFT_ARROW`, `RIGHT_ARROW` | setas ← → |
| `UP_ARROW`, `DOWN_ARROW` | setas ↑ ↓ |
| `ENTER`, `ESCAPE`, `BACKSPACE` | Enter, Esc, apagar |

```js
function keyPressed() {
  if (keyCode === LEFT_ARROW) {
    x = x - 10;
  }
}
```

## Teclas mantidas: keyIsDown()

O `keyPressed()` corre uma vez por toque. Para um movimento **contínuo** enquanto a tecla está carregada (como num jogo), pergunta no `draw()` com **`keyIsDown(código)`**:

```js
let x = 200;

function setup() {
  createCanvas(400, 200);
}

function draw() {
  background(20);
  if (keyIsDown(LEFT_ARROW)) {
    x = x - 5;
  }
  if (keyIsDown(RIGHT_ARROW)) {
    x = x + 5;
  }
  x = constrain(x, 0, width);   // não deixa sair da tela
  fill(0, 255, 150);
  triangle(x - 20, 180, x + 20, 180, x, 140);
}
```

`constrain(valor, mínimo, máximo)` "prende" um valor entre dois limites.

## Escrever texto: keyTyped()

`keyTyped()` é chamada quando se escreve um carácter (letras, números, espaço…). É a melhor para juntar letras num texto: `texto = texto + key;`.

=== exercicio teclas-de-cor
title: Teclas de cor
difficulty: 1

--- enunciado
O fundo da tela começa **branco** e muda de cor com o teclado:

| Tecla | Cor do fundo |
|---|---|
| `r` | vermelho (255, 0, 0) |
| `g` | verde (0, 200, 0) |
| `b` | azul (0, 0, 255) |

Guarda a cor em variáveis e muda-as dentro de `keyPressed()`.

--- inicio
let r = 255;
let g = 255;
let b = 255;

function setup() {
  createCanvas(400, 300);
}

function draw() {
  background(r, g, b);
}

function keyPressed() {

}

--- pista
`if (key === "r") { r = 255; g = 0; b = 0; }` — e o mesmo para as outras teclas.

--- teste: Começa branco
verifica.cor(5, 5)
=> "#ffffff"

--- teste: r, g e b mudam a cor
[verifica.tecla("r").avanca().cor(5, 5), verifica.tecla("g").avanca().cor(5, 5), verifica.tecla("b").avanca().cor(5, 5)]
=> ["#ff0000", "#00c800", "#0000ff"]

--- teste: Outras teclas não mudam nada
verifica.tecla("b").avanca().tecla("x").avanca().cor(5, 5)
=> "#0000ff"

--- solucao
let r = 255;
let g = 255;
let b = 255;

function setup() {
  createCanvas(400, 300);
}

function draw() {
  background(r, g, b);
}

function keyPressed() {
  if (key === "r") {
    r = 255;
    g = 0;
    b = 0;
  }
  if (key === "g") {
    r = 0;
    g = 200;
    b = 0;
  }
  if (key === "b") {
    r = 0;
    g = 0;
    b = 255;
  }
}

=== exercicio nave
title: Nave às setas
difficulty: 2

--- enunciado
A nave (um retângulo de **40 × 20** em `(x, 360)`) tem de se mexer com as setas:

- enquanto a **seta para a esquerda** estiver carregada, `x` diminui **5** por frame;
- enquanto a **seta para a direita** estiver carregada, `x` aumenta **5** por frame;
- a nave nunca sai da tela: `x` fica sempre entre **0** e **360** (`width - 40`).

Usa `keyIsDown()` dentro do `draw()`.

--- inicio
let x = 200;

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(10, 10, 30);

  fill(0, 255, 150);
  rect(x, 360, 40, 20);
}

--- pista
`if (keyIsDown(RIGHT_ARROW)) { x = x + 5; }`, o mesmo para a esquerda, e no fim `x = constrain(x, 0, width - 40);`.

--- teste: Anda para a direita com a seta →
verifica.segura("RIGHT_ARROW").avanca(10).variavel("x")
=> 250

--- teste: Anda para a esquerda com a seta ←
verifica.segura("LEFT_ARROW").avanca(10).variavel("x")
=> 150

--- teste: Para quando se larga a tecla
verifica.segura("RIGHT_ARROW").avanca(4).larga("RIGHT_ARROW").avanca(10).variavel("x")
=> 220

--- teste: Não sai da tela
[verifica.segura("LEFT_ARROW").avanca(100).variavel("x"), verifica.larga("LEFT_ARROW").segura("RIGHT_ARROW").avanca(200).variavel("x")]
=> [0, 360]

--- solucao
let x = 200;

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(10, 10, 30);
  if (keyIsDown(LEFT_ARROW)) {
    x = x - 5;
  }
  if (keyIsDown(RIGHT_ARROW)) {
    x = x + 5;
  }
  x = constrain(x, 0, width - 40);
  fill(0, 255, 150);
  rect(x, 360, 40, 20);
}

=== exercicio maquina-de-escrever
title: Máquina de escrever
difficulty: 2

--- enunciado
Cada letra que se escreve no teclado é acrescentada ao fim da variável **`texto`** (que começa vazia: `""`), e o texto aparece na tela com `text(texto, 20, 100)`.

Usa a função `keyTyped()`.

--- inicio
let texto = "";

function setup() {
  createCanvas(500, 200);
  textSize(32);
}

function draw() {
  background(255, 250, 230);
  fill(40);
  text(texto, 20, 100);
}

--- pista
`function keyTyped() { texto = texto + key; }`

--- teste: As letras juntam-se ao texto
verifica.tecla("o").tecla("l").tecla("a").variavel("texto")
=> "ola"

--- teste: O espaço também conta
verifica.tecla("o").tecla(" ").tecla("p").tecla("5").variavel("texto")
=> "o p5"

--- teste: O texto aparece na tela
verifica.tecla("o").tecla("i").avanca().argumentos("text").map(a => a[0])
=> ["oi"]

--- solucao
let texto = "";

function setup() {
  createCanvas(500, 200);
  textSize(32);
}

function draw() {
  background(255, 250, 230);
  fill(40);
  text(texto, 20, 100);
}

function keyTyped() {
  texto = texto + key;
}
