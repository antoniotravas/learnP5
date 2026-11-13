---
id: variaveis
track: Desenho
title: Variáveis
icon: 📦
summary: Guardar valores com let, fazer contas, width e height.
---

# Variáveis

Imagina que desenhaste um boneco com 20 formas e agora queres mudá-lo de sítio. Vais alterar 40 números à mão? Com **variáveis**, mudas um só valor e o desenho todo acompanha.

## Criar e usar uma variável

Uma variável é uma "caixa" com um **nome** onde guardas um **valor**:

```js
let x = 200;
let y = 150;

function setup() {
  createCanvas(400, 300);
  background(230);
  circle(x, y, 80);          // círculo em (200, 150)
  circle(x + 100, y, 40);    // 100 píxeis mais à direita
}
```

- `let x = 200;` cria a variável `x` com o valor 200;
- depois, onde escreveres `x`, o p5 usa o valor que lá está.

Para mudar o valor de uma variável que já existe, escreves só `x = 50;` (sem `let`).

## Contas

| Operação | Símbolo | Exemplo |
|---|---|---|
| somar | `+` | `x + 10` |
| subtrair | `-` | `y - 30` |
| multiplicar | `*` | `tamanho * 2` |
| dividir | `/` | `width / 2` |

## Nomes de variáveis

- Começam por uma letra e não têm espaços nem acentos: `tamanho`, `posX`, `corFundo`.
- Maiúsculas e minúsculas são diferentes: `posX` e `posx` são duas variáveis!
- Escolhe nomes que digam o que a variável guarda.

## width e height

O p5 tem variáveis já prontas. Duas das mais úteis: **`width`** (a largura da tela) e **`height`** (a altura). Assim, o centro é sempre `(width / 2, height / 2)`, seja qual for o tamanho da tela:

```js
function setup() {
  createCanvas(300, 200);
  background(30);
  fill(255, 100, 150);
  circle(width / 2, height / 2, 100);   // sempre no centro
}
```

## Ver o valor de uma variável

Para espreitar o que está dentro de uma variável, usa `print(x);` (ou `console.log(x);`). O valor aparece na **consola**, por baixo do resultado.

> 💡 Uma variável criada **fora** das funções (no topo do sketch) pode ser usada em todo o lado. Uma criada **dentro** de uma função só existe lá dentro.

=== exercicio centro-sempre
title: Sempre no centro
difficulty: 1

--- enunciado
A tela tem **500 × 300**. Desenha um círculo com **100** de diâmetro **no centro** da tela.

Não escrevas os números do centro à mão: usa **`width`** e **`height`**. Assim, se mudares o tamanho da tela, o círculo continua no centro.

--- inicio
function setup() {
  createCanvas(500, 300);
  background(220);
  // desenha o círculo no centro, usando width e height

}

--- pista
O centro é `(width / 2, height / 2)`: escreve `circle(width / 2, height / 2, 100);`.

--- teste: O círculo está no centro
verifica.argumentos("circle")
=> [[250, 150, 100]]

--- teste: Usaste width / 2
verifica.noCodigo("width\\s*/\\s*2")
=> true

--- teste: Usaste height / 2
verifica.noCodigo("height\\s*/\\s*2")
=> true

--- solucao
function setup() {
  createCanvas(500, 300);
  background(220);
  circle(width / 2, height / 2, 100);
}

=== exercicio tamanho-variavel
title: Um tamanho para todos
difficulty: 1

--- enunciado
1. No topo do sketch, cria uma variável **`tamanho`** com o valor **80**.
2. Desenha um **quadrado** em (50, 100) e um **círculo** com centro em (250, 140). O lado do quadrado e o diâmetro do círculo têm de ser dados pela variável `tamanho` (não escrevas 80 dentro do `square` nem do `circle`).

Experimenta depois mudar o valor de `tamanho`: as duas formas mudam juntas!

--- inicio
// cria aqui a variável tamanho

function setup() {
  createCanvas(400, 300);
  background(240);

}

--- pista
`let tamanho = 80;` no topo; depois `square(50, 100, tamanho);` e `circle(250, 140, tamanho);`.

--- teste: A variável tamanho vale 80
verifica.variavel("tamanho")
=> 80

--- teste: O quadrado está certo
verifica.argumentos("square")
=> [[50, 100, 80]]

--- teste: O círculo está certo
verifica.argumentos("circle")
=> [[250, 140, 80]]

--- teste: O quadrado e o círculo usam a variável
verifica.noCodigo("square\\([^)]*tamanho") && verifica.noCodigo("circle\\([^)]*tamanho")
=> true

--- solucao
let tamanho = 80;

function setup() {
  createCanvas(400, 300);
  background(240);
  square(50, 100, tamanho);
  circle(250, 140, tamanho);
}

=== exercicio rosto
title: Um rosto que muda de sítio
difficulty: 2

--- enunciado
O rosto do código inicial foi desenhado com números fixos. Torna-o fácil de mudar de sítio:

1. em cada forma, troca os números pelas variáveis **`x`** e **`y`** (o centro da cabeça), com contas: por exemplo, o olho esquerdo fica em `x - 40, y - 30`;
2. no fim, muda os valores para **`x = 150`** e **`y = 220`**. O rosto todo tem de se mudar para lá.

--- inicio
let x = 200;
let y = 200;

function setup() {
  createCanvas(400, 400);
  background(255, 240, 200);
  circle(200, 200, 200);          // cabeça
  circle(160, 170, 30);           // olho esquerdo
  circle(240, 170, 30);           // olho direito
  line(160, 250, 240, 250);       // boca
}

--- pista
A cabeça é `circle(x, y, 200);`. O olho direito está 40 para a direita e 30 para cima do centro: `circle(x + 40, y - 30, 30);`. A boca vai de `x - 40, y + 50` até `x + 40, y + 50`.

--- teste: x vale 150 e y vale 220
[verifica.variavel("x"), verifica.variavel("y")]
=> [150, 220]

--- teste: A cabeça e os olhos acompanharam
verifica.argumentos("circle")
=> [[150, 220, 200], [110, 190, 30], [190, 190, 30]]

--- teste: A boca acompanhou
verifica.argumentos("line")
=> [[110, 270, 190, 270]]

--- solucao
let x = 150;
let y = 220;

function setup() {
  createCanvas(400, 400);
  background(255, 240, 200);
  circle(x, y, 200);
  circle(x - 40, y - 30, 30);
  circle(x + 40, y - 30, 30);
  line(x - 40, y + 50, x + 40, y + 50);
}
