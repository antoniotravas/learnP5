---
id: cor
track: Desenho
title: Cor
icon: 🎨
summary: RGB, preenchimento e contorno, transparência.
---

# Cor

Até agora tudo foi branco, preto ou cinzento. Está na hora de dar cor aos desenhos!

## O modelo RGB

Os ecrãs formam todas as cores misturando luz **vermelha** (*Red*), **verde** (*Green*) e **azul** (*Blue*). Cada uma vai de **0** (nada) a **255** (o máximo):

| Código | Cor |
|---|---|
| `(255, 0, 0)` | vermelho |
| `(0, 255, 0)` | verde |
| `(0, 0, 255)` | azul |
| `(255, 255, 0)` | amarelo (vermelho + verde) |
| `(255, 255, 255)` | branco (tudo no máximo) |
| `(0, 0, 0)` | preto |

> 💡 Com luz, misturar cores dá cores mais **claras** — ao contrário das tintas!

## Preenchimento e contorno

Cada forma tem duas cores:

| Função | O que muda |
|---|---|
| `fill(r, g, b)` | a cor de **dentro** das formas |
| `stroke(r, g, b)` | a cor do **contorno** (e das linhas e pontos) |
| `noFill()` | formas sem preenchimento (só contorno) |
| `noStroke()` | formas sem contorno |
| `strokeWeight(n)` | a grossura do contorno |

Estas funções funcionam como um **pincel**: a cor escolhida fica ativa para todas as formas que vierem **depois**, até a mudares outra vez.

```js
function setup() {
  createCanvas(400, 200);
  background(250);
  strokeWeight(4);
  fill(255, 200, 0);
  stroke(200, 100, 0);
  circle(80, 100, 100);    // amarelo com contorno laranja
  circle(200, 100, 100);   // igual: o pincel não mudou
  noStroke();
  fill(0, 150, 255);
  circle(320, 100, 100);   // azul, sem contorno
}
```

Também podes usar um só número (cinzentos), nomes de cores em inglês (`fill("orange")`) ou códigos hexadecimais (`fill("#ff8800")`), como no CSS.

## Transparência

Um **quarto número** dá a opacidade (*alpha*): **0** é invisível e **255** é opaco.

```js
function setup() {
  createCanvas(300, 200);
  background(255);
  noStroke();
  fill(255, 0, 0, 120);
  circle(120, 100, 140);
  fill(0, 0, 255, 120);
  circle(180, 100, 140);   // onde se sobrepõem, fica roxo
}
```

=== exercicio semaforo
title: Semáforo
difficulty: 1

--- enunciado
Numa tela de **200 × 400** com fundo cinzento escuro (**40**), desenha as três luzes de um semáforo: três círculos com **100** de diâmetro, todos em **x = 100**:

| Luz | y | Cor (RGB) |
|---|---|---|
| vermelha | 80 | 255, 0, 0 |
| amarela | 200 | 255, 200, 0 |
| verde | 320 | 0, 200, 0 |

--- inicio
function setup() {
  createCanvas(200, 400);
  background(40);
  circle(100, 80, 100);
  circle(100, 200, 100);
  circle(100, 320, 100);
}

--- pista
Antes de cada `circle`, escolhe a cor com `fill(...)`. Por exemplo, `fill(255, 0, 0);` antes do primeiro.

--- teste: A luz de cima é vermelha
verifica.cor(100, 80)
=> "#ff0000"

--- teste: A luz do meio é amarela
verifica.cor(100, 200)
=> "#ffc800"

--- teste: A luz de baixo é verde
verifica.cor(100, 320)
=> "#00c800"

--- teste: O fundo é cinzento escuro
verifica.cor(10, 10)
=> "#282828"

--- solucao
function setup() {
  createCanvas(200, 400);
  background(40);
  fill(255, 0, 0);
  circle(100, 80, 100);
  fill(255, 200, 0);
  circle(100, 200, 100);
  fill(0, 200, 0);
  circle(100, 320, 100);
}

=== exercicio bandeira
title: Bandeira de Portugal
difficulty: 2

--- enunciado
Desenha uma versão simplificada da bandeira de Portugal numa tela de **600 × 400**, **sem contornos**:

1. um retângulo **verde** (0, 102, 0) do lado esquerdo: começa em (0, 0) e tem **240** de largura (2/5 da bandeira) e a altura toda;
2. um retângulo **vermelho** (255, 0, 0) no resto da bandeira: começa em x = 240;
3. um círculo **amarelo** (255, 255, 0) com centro em **(240, 200)** e **160** de diâmetro, por cima da divisão (é o lugar da esfera armilar).

--- inicio
function setup() {
  createCanvas(600, 400);

}

--- pista
`noStroke();` tira os contornos. Depois: `fill(0, 102, 0); rect(0, 0, 240, 400);`, a seguir o vermelho com `rect(240, 0, 360, 400);` e, por último, o círculo.

--- teste: O lado esquerdo é verde
verifica.cor(100, 200)
=> "#006600"

--- teste: O lado direito é vermelho
verifica.cor(500, 200)
=> "#ff0000"

--- teste: O círculo amarelo está na divisão
verifica.cor(240, 200)
=> "#ffff00"

--- teste: O círculo não tem contorno
verifica.formas("circle", "ellipse").length > 0 && verifica.formas("circle", "ellipse").every(f => f.stroke === null)
=> true

--- solucao
function setup() {
  createCanvas(600, 400);
  noStroke();
  fill(0, 102, 0);
  rect(0, 0, 240, 400);
  fill(255, 0, 0);
  rect(240, 0, 360, 400);
  fill(255, 255, 0);
  circle(240, 200, 160);
}

=== exercicio transparencia
title: Luzes que se misturam
difficulty: 2

--- enunciado
Numa tela de **400 × 400** com fundo **preto**, desenha três círculos **sem contorno**, com **200** de diâmetro e transparência **120**, por esta ordem:

1. vermelho (255, 0, 0) com centro em (150, 150);
2. verde (0, 255, 0) com centro em (250, 150);
3. azul (0, 0, 255) com centro em (200, 240).

Repara nas cores que aparecem onde os círculos se sobrepõem.

--- inicio
function setup() {
  createCanvas(400, 400);
  background(0);

}

--- pista
A transparência é o quarto número: `fill(255, 0, 0, 120);`. Não te esqueças do `noStroke();`.

--- teste: As cores e a transparência estão certas
verifica.formas("circle", "ellipse").map(f => f.fill)
=> ["#ff000078", "#00ff0078", "#0000ff78"]

--- teste: As posições estão certas
verifica.formas("circle", "ellipse").map(f => f.a.slice(0, 3).join())
=> ["150,150,200", "250,150,200", "200,240,200"]

--- teste: Não há contornos
verifica.formas("circle", "ellipse").every(f => f.stroke === null)
=> true

--- solucao
function setup() {
  createCanvas(400, 400);
  background(0);
  noStroke();
  fill(255, 0, 0, 120);
  circle(150, 150, 200);
  fill(0, 255, 0, 120);
  circle(250, 150, 200);
  fill(0, 0, 255, 120);
  circle(200, 240, 200);
}
