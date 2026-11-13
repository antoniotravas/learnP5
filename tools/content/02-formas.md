---
id: formas
track: Desenho
title: Formas básicas
icon: 🔷
summary: Retângulos, círculos, elipses e triângulos — e porque é que a ordem conta.
---

# Formas básicas

Com meia dúzia de funções desenhas quase tudo. Em todas, os números entre parênteses (os **argumentos**) dizem **onde** fica a forma e **que tamanho** tem.

## Retângulos e quadrados

```
rect(x, y, largura, altura)
square(x, y, lado)
```

O ponto `(x, y)` é o **canto superior esquerdo** do retângulo.

## Círculos e elipses

```
circle(x, y, diâmetro)
ellipse(x, y, largura, altura)
```

Aqui o ponto `(x, y)` é o **centro**. Atenção: o terceiro número do `circle` é o **diâmetro**, não o raio.

## Triângulos e quadriláteros

```
triangle(x1, y1, x2, y2, x3, y3)
quad(x1, y1, x2, y2, x3, y3, x4, y4)
```

Dás as coordenadas de cada vértice (canto), uma a seguir à outra.

## Tudo junto

```js
function setup() {
  createCanvas(400, 300);
  background(230);
  rect(30, 40, 120, 80);           // retângulo
  square(180, 40, 80);             // quadrado
  circle(330, 80, 90);             // círculo
  ellipse(90, 220, 140, 70);       // elipse
  triangle(200, 270, 250, 170, 300, 270);  // triângulo
}
```

## A ordem conta

O p5 desenha como um pintor: cada forma fica **por cima** das que foram desenhadas antes. Se desenhares um círculo pequeno e depois um grande no mesmo sítio, o grande tapa o pequeno.

```js
function setup() {
  createCanvas(300, 150);
  background(230);
  // Esquerda: primeiro o grande, depois o pequeno (vê-se os dois)
  circle(80, 75, 100);
  circle(80, 75, 40);
  // Direita: primeiro o pequeno, depois o grande (o pequeno fica tapado)
  circle(220, 75, 40);
  circle(220, 75, 100);
}
```

## Mudar a referência: rectMode e ellipseMode

Se preferires que o `rect` seja posicionado pelo **centro**, escreve `rectMode(CENTER);` antes de o desenhar. Também existe `ellipseMode(CORNER)` para posicionar elipses pelo canto. Por agora, os valores por omissão chegam.

> 💡 Faz um esboço em papel quadriculado antes de programar: é muito mais fácil descobrir as coordenadas!

=== exercicio boneco-de-neve
title: Boneco de neve
difficulty: 1

--- enunciado
Numa tela de **400 × 400**, desenha um boneco de neve com **três círculos**, todos com o centro em **x = 200**:

| Parte | Centro (y) | Diâmetro |
|---|---|---|
| base | 300 | 160 |
| corpo | 190 | 110 |
| cabeça | 105 | 70 |

--- inicio
function setup() {
  createCanvas(400, 400);
  background(200, 230, 255);
  // a base:
  circle(200, 300, 160);

}

--- pista
Já tens a base. Falta `circle(200, 190, 110);` para o corpo e outro `circle` para a cabeça.

--- teste: Há três círculos
verifica.formas("circle", "ellipse").length
=> 3

--- teste: Estão todos centrados em x = 200
verifica.formas("circle", "ellipse").every(f => f.a[0] === 200)
=> true

--- teste: As alturas estão certas
verifica.formas("circle", "ellipse").map(f => f.a[1]).sort((a, b) => a - b)
=> [105, 190, 300]

--- teste: Os tamanhos estão certos
verifica.formas("circle", "ellipse").map(f => f.a[2]).sort((a, b) => a - b)
=> [70, 110, 160]

--- solucao
function setup() {
  createCanvas(400, 400);
  background(200, 230, 255);
  circle(200, 300, 160);
  circle(200, 190, 110);
  circle(200, 105, 70);
}

=== exercicio casa
title: Uma casa
difficulty: 2

--- enunciado
Desenha uma casa numa tela de **400 × 400**:

- **paredes**: um retângulo com o canto superior esquerdo em (100, 200), **200** de largura e **150** de altura;
- **telhado**: um triângulo com os vértices em (100, 200), (300, 200) e (200, 100);
- **porta**: um retângulo em (180, 280), com **40** de largura e **70** de altura.

Pensa na ordem: a porta tem de ficar **por cima** das paredes.

--- inicio
function setup() {
  createCanvas(400, 400);
  background(170, 220, 255);

}

--- pista
Paredes: `rect(100, 200, 200, 150);` — depois o `triangle(...)` com os três vértices e, no fim, a porta com outro `rect`.

--- teste: As paredes estão certas
verifica.argumentos("rect").some(a => a.join() === "100,200,200,150")
=> true

--- teste: O telhado está certo
verifica.argumentos("triangle").map(a => [a.slice(0, 2), a.slice(2, 4), a.slice(4, 6)].map(p => p.join()).sort().join(" "))
=> ["100,200 200,100 300,200"]

--- teste: A porta está certa
verifica.argumentos("rect").some(a => a.join() === "180,280,40,70")
=> true

--- teste: A porta fica por cima das paredes
(() => { const r = verifica.argumentos("rect").map(a => a.join()); return r.indexOf("180,280,40,70") > r.indexOf("100,200,200,150"); })()
=> true

--- solucao
function setup() {
  createCanvas(400, 400);
  background(170, 220, 255);
  rect(100, 200, 200, 150);
  triangle(100, 200, 300, 200, 200, 100);
  rect(180, 280, 40, 70);
}

=== exercicio alvo
title: O alvo
difficulty: 2

--- enunciado
Desenha um alvo com **três círculos** concêntricos (com o mesmo centro), em **(200, 200)**, numa tela de **400 × 400**. Os diâmetros são **300**, **200** e **100**.

Atenção à ordem: os três círculos têm de se ver todos!

--- inicio
function setup() {
  createCanvas(400, 400);
  background(240);
  circle(200, 200, 100);
  circle(200, 200, 200);
  circle(200, 200, 300);
}

--- pista
O último círculo a ser desenhado fica por cima. Começa pelo **maior**.

--- teste: Há três círculos com centro em (200, 200)
verifica.formas("circle", "ellipse").filter(f => f.a[0] === 200 && f.a[1] === 200).length
=> 3

--- teste: São desenhados do maior para o menor
verifica.formas("circle", "ellipse").map(f => f.a[2])
=> [300, 200, 100]

--- solucao
function setup() {
  createCanvas(400, 400);
  background(240);
  circle(200, 200, 300);
  circle(200, 200, 200);
  circle(200, 200, 100);
}
