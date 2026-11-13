# 🎨 Learn p5

Site para aprender **programação criativa com p5.js** — desenho, animação e interação — pensado para alunos do
ensino secundário. Lições curtas com exemplos executáveis, exercícios num editor com o resultado ao lado e
gamificação (XP, níveis, medalhas, sequências diárias e classificação). É o irmão do LearnGit, do LearnFrontend e do
LearnPython e usa o mesmo backend. Não usa IA: os exercícios são corrigidos por verificações automáticas.

## O curso

| Tema | Módulos |
|------|---------|
| **Desenho** | A tela e as coordenadas · Formas básicas · Cor · Variáveis |
| **Animação** | O ciclo draw() · Condições · Ciclos for · Aleatório e ruído |
| **Interação** | O rato · O teclado · Funções e arrays |

11 módulos, 33 exercícios (3 por módulo, de ★ a ★★★), mais um **Caderno livre** para experimentar.

## Como funciona

| Parte | Tecnologia |
|-------|-----------|
| Backend / API | PHP 8.2 + SQLite (`server/`), sem dependências |
| Frontend | HTML, CSS e JavaScript simples (`public/`), com marked (Markdown) e CodeMirror 5 (editor) |
| Sketches | [p5.js](https://p5js.org) 1.11.13, servido localmente (`public/static/vendor/`), num iframe isolado |
| Avaliação | Expressões `verifica.*` corridas dentro do iframe (`harness.js`) |
| Ferramentas e testes | Node 22+ (`tools/`, `tests/`), com Playwright a usar o Chrome instalado |

Fluxo de um exercício:
1. O editor mostra o código inicial (ou o rascunho do aluno, guardado em `localStorage`, ou a última submissão).
2. **▶ Executar** (Ctrl+Enter) corre o sketch ao lado; os erros aparecem na consola **em português**, com a linha.
3. **✓ Verificar** / **Submeter** corre cada verificação num iframe novo, em modo controlado: o `draw()` não anda
   sozinho — a verificação avança frames, mexe o rato e carrega em teclas — e o `random()` tem semente fixa.
4. Ao submeter, os resultados e o código vão para o servidor (`POST /api/exercises/{id}/submit`). Se tudo passar,
   o aluno ganha XP.

Algumas das funções do `verifica` (lista completa em `public/static/js/harness.js`):

| Função | Devolve |
|--------|---------|
| `tela()` | `[largura, altura]` |
| `cor(x, y)` | cor do píxel, `"#rrggbb"` |
| `argumentos("circle")` | argumentos de cada `circle` do último frame |
| `formas()` | formas do último frame com a cor de preenchimento e de contorno |
| `variavel("x")` | valor de uma variável global (aceita `bola.x`, `bolas[0].y`) |
| `avanca(n)`, `rato(x, y)`, `clica(x, y)`, `tecla("r")`, `segura("LEFT_ARROW")` | simulam o tempo e os eventos (encadeiam-se) |
| `chama("media", 4, 10)` | resultado de uma função do aluno |
| `noCodigo("for\\s*\\(")` | se o código (sem comentários) tem esse padrão |

Estrutura:

```
public/          o que o browser vê (vai para public_html): index.html, static/, api.php, .htaccess
server/          o backend (fica FORA do public_html), content.json (gerado)
tools/content/   o curso: um ficheiro .md por módulo (lição + exercícios + verificações + soluções)
tools/           build_content.mjs, build_dist.mjs, content_lib.mjs
data/            base de dados SQLite (criada automaticamente)
tests/           testes (node --test): cada exercício no Chrome, o motor, a API e a interface
```

## Instalar e correr localmente

Precisas de PHP 8.2+ (com `pdo_sqlite` e `mbstring`).

```bash
php -S localhost:8000 server/dev-router.php
```

Abre <http://localhost:8000>. As opções (base de dados, limites) estão em `server/config.example.php`; copia-o para
`server/config.local.php` se quiseres mudar alguma.

## Acrescentar conteúdo

1. Edita (ou cria) um ficheiro em `tools/content/` — o formato está explicado no topo de `tools/content_lib.mjs`.
   Cada exercício tem enunciado, código inicial, pista, verificações e a solução de referência.
2. `node tools/build_content.mjs` (valida e escreve `server/content.json`, sem as soluções).
3. `npm test`: confirma que cada solução passa e que o código inicial sozinho não passa.

## Testes

```bash
npm install
npm test
```

Usa o Chrome instalado no computador. Os testes da API e da interface precisam do `php` no PATH (sem ele são
saltados); os dos exercícios e do motor só precisam do Chrome. Para correr só um exercício:
`EXERCICIO=casa npm test`.

## Publicar

```bash
node tools/build_dist.mjs
```

Gera `dist/learnp5-site.zip` com `public_html/` e `server/` (com um `config.local.php` de produção, cookies seguros).
Extrai-o em `domains/<domínio>/`. A pasta `data/` não vai no zip, por isso a base de dados do servidor nunca é
substituída.
