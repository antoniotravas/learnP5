## site para aprender p5.js (desenho e animação com código)

## objetivo

    Com este projeto pretende-se que alunos do ensino secundário português aprendam programação
    criativa com o p5.js: desenhar, animar e criar sketches interativos.
    É o irmão do LearnGit (../../LearnGit/learngit), do LearnFrontend e do LearnPython, com o mesmo backend PHP.

## O que vai conter

     - Uma parte teórica sobre os vários temas (lições em Markdown em cada módulo, com exemplos que se executam
       ali mesmo, com o botão «Experimentar»).

     - Exercícios que o aluno resolve num editor de código (CodeMirror) com o resultado ao lado, num iframe isolado.

     - O resultado dos exercícios é avaliado só por verificações automáticas ao sketch (formas desenhadas,
       cores dos píxeis, variáveis, reação ao rato e ao teclado). NÃO há IA neste projeto.

     - Um «Caderno livre» para experimentar sem exercícios (guardado no browser, descarregável como .html).

## Motivação

    Para o aluno estar sempre motivado, a aplicação é gamificada (XP, níveis, medalhas, sequências).

## Notas para o desenvolvimento

    - As ferramentas e os testes são em Node (não há Python neste projeto): npm install, depois npm test.
    - O conteúdo está em tools/content/NN-id.md: um ficheiro por módulo, com a lição, os exercícios, as verificações
      e a solução de referência de cada um (formato explicado no topo de tools/content_lib.mjs).
      O server/content.json (sem as soluções) é gerado com node tools/build_content.mjs.
    - Cada exercício precisa de uma solução que passe e de um código inicial que NÃO passe (os testes confirmam).
    - O motor está em public/static/js/: sketch.js (cria os iframes, proteção de ciclos infinitos, pré-visualização,
      runChecks) e harness.js (corre dentro do iframe: regista as chamadas de desenho, explica os erros em português
      e implementa o objeto verifica.*). editor.js e app.js (SPA).
    - Nas verificações, o draw() não corre sozinho: é o verifica.avanca(n) que avança frames, e rato/clica/tecla/segura
      simulam eventos. randomSeed/noiseSeed fixos (42) e pixelDensity 1, por isso os resultados são estáveis.
      Cada verificação corre num iframe novo.
    - Os iframes têm sandbox="allow-scripts" (origem opaca) e carregam o p5 e o harness com crossorigin: o servidor
      tem de mandar Access-Control-Allow-Origin nos .js (está no .htaccess e no dev-router.php).
    - p5.js 1.11.13 servido localmente (public/static/vendor/).
    - Deploy: node tools/build_dist.mjs gera dist/learnp5-site.zip.
    - Tudo em português europeu. Não fazer commits sem o utilizador pedir.
