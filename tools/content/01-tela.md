---
id: tela
track: Desenho
title: A tela e as coordenadas
icon: 🖼️
summary: O que é o p5.js, setup(), createCanvas() e o sistema de coordenadas.
---

# A tela e as coordenadas

O **p5.js** é uma biblioteca de JavaScript criada para artistas, designers e estudantes: com poucas linhas de código consegues desenhar, animar e criar coisas interativas no browser. É usada em escolas e por artistas de todo o mundo, e tudo o que aprenderes aqui serve também para JavaScript "a sério".

## O primeiro sketch

Um programa de p5.js chama-se **sketch** (esboço). O mais simples de todos é este:

```js
function setup() {
  createCanvas(400, 300);
  background(220);
}
```

- `function setup() { ... }` define a função **setup**. O p5 corre-a **uma vez**, quando o sketch arranca.
- `createCanvas(400, 300)` cria a **tela** (o *canvas*) onde vais desenhar: 400 píxeis de largura e 300 de altura.
- `background(220)` pinta a tela toda de cinzento claro.

Carrega em **▶ Experimentar** por baixo do código para o veres a funcionar. Nos exercícios, carregas em **▶ Executar** (ou **Ctrl+Enter**).

> 💡 Cada instrução termina com `;` e o que está entre `{` e `}` pertence à função. Maiúsculas e minúsculas contam: `createCanvas` funciona, `createcanvas` dá erro.

## Tons de cinzento

Com um só número, de **0** a **255**, escolhes um cinzento:

| Valor | Cor |
|---|---|
| `background(0)` | preto |
| `background(127)` | cinzento médio |
| `background(220)` | cinzento claro |
| `background(255)` | branco |

## As coordenadas

Cada ponto da tela tem uma posição **(x, y)**:

- o **x** conta da esquerda para a direita;
- o **y** conta **de cima para baixo** (ao contrário da Matemática!);
- o ponto **(0, 0)** é o canto superior esquerdo.

Numa tela de 400 × 300, o canto inferior direito é (400, 300) e o centro é (200, 150). Experimenta este exemplo, que marca alguns pontos:

```js
function setup() {
  createCanvas(400, 300);
  background(240);
  strokeWeight(12);
  point(0, 0);       // canto superior esquerdo (só se vê um quarto do ponto)
  point(200, 150);   // centro
  point(380, 280);   // perto do canto inferior direito
  strokeWeight(2);
  line(0, 150, 400, 150);  // linha horizontal a meio
  line(200, 0, 200, 300);  // linha vertical a meio
}
```

## Pontos e linhas

| Função | O que desenha |
|---|---|
| `point(x, y)` | um ponto |
| `line(x1, y1, x2, y2)` | uma linha de (x1, y1) até (x2, y2) |
| `strokeWeight(n)` | a grossura dos pontos e linhas que vêm a seguir (em píxeis) |

## Comentários

Tudo o que vem depois de `//` até ao fim da linha é um **comentário**: o computador ignora-o. Serve para explicares o teu código (a ti próprio, daqui a uma semana!).

## Quando algo corre mal

Se houver um erro, a **consola** por baixo do resultado diz-te em que linha está e dá uma pista. Os erros mais comuns no início:

- esquecer um parêntese ou uma chaveta: `createCanvas(400, 300;`
- escrever mal um nome: `Background(220)` em vez de `background(220)`;
- esquecer a vírgula entre os números: `point(10 20)`.

> 🎯 Nos exercícios, o botão **✓ Verificar** corre verificações automáticas ao teu sketch: vês logo o que já está certo e o que falta.

=== exercicio primeira-tela
title: A primeira tela
difficulty: 1

--- enunciado
Cria um sketch com:

1. uma tela com **400** píxeis de largura e **300** de altura;
2. o fundo pintado de cinzento claro, com o valor **220**.

Carrega em **▶ Executar** para veres o resultado e depois em **✓ Verificar**.

--- inicio
function setup() {
  // escreve aqui o teu código

}

--- pista
Dentro do `setup()`, escreve `createCanvas(400, 300);` e na linha seguinte `background(220);`.

--- teste: A tela tem 400 × 300
verifica.tela()
=> [400, 300]

--- teste: O fundo é cinzento claro (220)
verifica.cor(200, 150)
=> "#dcdcdc"

--- teste: O sketch corre sem erros
verifica.erro()
=> null

--- solucao
function setup() {
  createCanvas(400, 300);
  background(220);
}

=== exercicio linhas-cruzadas
title: Linhas cruzadas
difficulty: 1

--- enunciado
Numa tela de **400 × 400** com fundo **branco** (255), desenha as duas diagonais:

- uma linha do canto superior esquerdo ao canto inferior direito;
- outra do canto superior direito ao canto inferior esquerdo.

Juntas, fazem um grande **X**.

--- inicio
function setup() {
  createCanvas(400, 400);

}

--- pista
O canto superior direito é `(400, 0)` e o inferior esquerdo é `(0, 400)`. A primeira linha é `line(0, 0, 400, 400);`.

--- teste: A tela tem 400 × 400
verifica.tela()
=> [400, 400]

--- teste: O fundo é branco
verifica.cor(10, 200)
=> "#ffffff"

--- teste: Há exatamente duas linhas
verifica.chamadas("line")
=> 2

--- teste: As linhas ligam os cantos opostos
verifica.argumentos("line").map(a => [a[0] + "," + a[1], a[2] + "," + a[3]].sort().join(" ")).sort()
=> ["0,0 400,400", "0,400 400,0"]

--- solucao
function setup() {
  createCanvas(400, 400);
  background(255);
  line(0, 0, 400, 400);
  line(400, 0, 0, 400);
}

=== exercicio ponto-central
title: Um ponto no centro
difficulty: 1

--- enunciado
Faz um "planeta" solitário no espaço:

1. tela de **300 × 300** com fundo **preto** (0);
2. a cor do traço branca: `stroke(255);`
3. traço com **20** píxeis de grossura;
4. um **ponto** exatamente no **centro** da tela.

--- inicio
function setup() {
  createCanvas(300, 300);
  background(0);
  stroke(255);

}

--- pista
O centro de uma tela de 300 × 300 é `(150, 150)`. Usa `strokeWeight(20);` **antes** de `point(150, 150);`.

--- teste: Há um ponto no centro
verifica.argumentos("point")
=> [[150, 150]]

--- teste: O traço tem grossura 20
verifica.argumentos("strokeWeight")
=> [[20]]

--- teste: O centro está branco
verifica.cor(150, 150)
=> "#ffffff"

--- teste: O resto da tela é preto
verifica.cor(20, 20)
=> "#000000"

--- solucao
function setup() {
  createCanvas(300, 300);
  background(0);
  stroke(255);
  strokeWeight(20);
  point(150, 150);
}
