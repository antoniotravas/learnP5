---
id: ciclos
track: Animação
title: Ciclos for
icon: 🔁
summary: Repetir sem copiar e colar: filas, grelhas e degradés.
---

# Ciclos for

Para desenhar 10 círculos em fila, podias escrever 10 linhas quase iguais. E para 100? Para 1000? Os **ciclos** repetem código por ti.

## O ciclo for

```js
for (let i = 0; i < 10; i++) {
  circle(20 + i * 40, 100, 30);
}
```

Lê-se assim: "começa com `i` a valer 0; **enquanto** `i` for menor do que 10, corre o código entre chavetas e soma 1 ao `i`".

| Parte | Significa |
|---|---|
| `let i = 0` | o contador começa em 0 |
| `i < 10` | repete enquanto isto for verdade |
| `i++` | no fim de cada volta, soma 1 ao contador |

Em cada volta, o `i` tem um valor diferente (0, 1, 2, …, 9). Usando-o nas contas, cada círculo fica num sítio diferente:

```js
function setup() {
  createCanvas(420, 120);
  background(240);
  for (let i = 0; i < 10; i++) {
    fill(i * 25, 100, 255 - i * 25);    // a cor também muda com o i
    circle(30 + i * 40, 60, 34);
  }
}
```

## Ciclos dentro de ciclos: grelhas

Um ciclo dentro de outro percorre **linhas e colunas**. O de fora escolhe a linha; o de dentro percorre as colunas dessa linha:

```js
function setup() {
  createCanvas(300, 300);
  background(255);
  for (let linha = 0; linha < 6; linha++) {
    for (let coluna = 0; coluna < 6; coluna++) {
      fill(coluna * 40, linha * 40, 200);
      square(coluna * 50, linha * 50, 50);
    }
  }
}
```

## O resto da divisão: %

`a % b` é o resto da divisão de `a` por `b`. É muito útil para **alternar**: `i % 2` vale 0 nos números pares e 1 nos ímpares.

> ⚠️ Se a condição nunca ficar falsa (por exemplo, `i--` em vez de `i++`), o ciclo nunca acaba: é um **ciclo infinito**. Aqui o sketch é interrompido e a consola avisa-te.

=== exercicio fila-de-circulos
title: Dez em fila
difficulty: 1

--- enunciado
Usa um ciclo **`for`** para desenhar **10 círculos** numa tela de **500 × 100**:

- todos com **40** de diâmetro e centro em **y = 50**;
- o primeiro em **x = 25**, e cada um **50** píxeis à direita do anterior (25, 75, 125, …, 475).

--- inicio
function setup() {
  createCanvas(500, 100);
  background(250);

}

--- pista
`for (let i = 0; i < 10; i++) { circle(25 + i * 50, 50, 40); }`

--- teste: Há dez círculos nas posições certas
verifica.argumentos("circle").map(a => a[0])
=> [25, 75, 125, 175, 225, 275, 325, 375, 425, 475]

--- teste: Todos em y = 50 com 40 de diâmetro
verifica.argumentos("circle").every(a => a[1] === 50 && a[2] === 40)
=> true

--- teste: Usaste um ciclo for
verifica.noCodigo("for\\s*\\(")
=> true

--- solucao
function setup() {
  createCanvas(500, 100);
  background(250);
  for (let i = 0; i < 10; i++) {
    circle(25 + i * 50, 50, 40);
  }
}

=== exercicio degrade
title: Degradé
difficulty: 2

--- enunciado
Numa tela de **256 × 100**, faz um degradé de **azul** (à esquerda) para **vermelho** (à direita) com **linhas verticais**:

- para cada `x` de **0** a **255**, desenha uma linha de `(x, 0)` até `(x, 100)`;
- a cor do traço é `(x, 0, 255 - x)`: na esquerda é azul puro e na direita vermelho puro.

São 256 linhas — só com um ciclo!

--- inicio
function setup() {
  createCanvas(256, 100);

}

--- pista
`for (let x = 0; x < 256; x++) { stroke(x, 0, 255 - x); line(x, 0, x, 100); }`

--- teste: Há 256 linhas
verifica.chamadas("line")
=> 256

--- teste: São linhas verticais, de cima a baixo, em x = 0, 1, 2, …
verifica.formas("line").every((f, i) => f.a.join() === [i, 0, i, 100].join())
=> true

--- teste: A primeira linha é azul
verifica.formas("line")[0].stroke
=> "#0000ff"

--- teste: A do meio é roxa
verifica.formas("line")[128].stroke
=> "#80007f"

--- teste: A última linha é vermelha
verifica.formas("line")[255].stroke
=> "#ff0000"

--- solucao
function setup() {
  createCanvas(256, 100);
  for (let x = 0; x < 256; x++) {
    stroke(x, 0, 255 - x);
    line(x, 0, x, 100);
  }
}

=== exercicio xadrez
title: Tabuleiro de xadrez
difficulty: 3

--- enunciado
Desenha um tabuleiro de xadrez **8 × 8** numa tela de **400 × 400**: cada casa é um quadrado de **50 × 50**.

- A casa do canto superior esquerdo é **branca** (255) e as cores vão alternando com o **preto** (0), na horizontal e na vertical.
- Usa **dois ciclos `for`**, um dentro do outro.

--- inicio
function setup() {
  createCanvas(400, 400);
  noStroke();

}

--- pista
Dentro dos dois ciclos (`linha` e `coluna`), a casa é branca quando `(linha + coluna) % 2 === 0`. Usa `if`/`else` para escolher o `fill` e depois `square(coluna * 50, linha * 50, 50);`.

--- teste: As 64 casas têm a cor certa
(() => { for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { if (verifica.cor(i * 50 + 25, j * 50 + 25) !== ((i + j) % 2 ? "#000000" : "#ffffff")) return false; } return true; })()
=> true

--- teste: Usaste dois ciclos for
verifica.noCodigo("for\\s*\\([\\s\\S]*for\\s*\\(")
=> true

--- solucao
function setup() {
  createCanvas(400, 400);
  noStroke();
  for (let linha = 0; linha < 8; linha++) {
    for (let coluna = 0; coluna < 8; coluna++) {
      if ((linha + coluna) % 2 === 0) {
        fill(255);
      } else {
        fill(0);
      }
      square(coluna * 50, linha * 50, 50);
    }
  }
}
