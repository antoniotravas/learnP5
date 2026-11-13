<?php
// Copia este ficheiro para config.local.php (que não é versionado) e preenche os valores.
// Qualquer valor em falta é lido das variáveis de ambiente com o mesmo nome.
return [
    'LEARNP5_DB' => '',                  // caminho da base de dados SQLite (por omissão: ../data/learnp5.db)
    'LEARNP5_SECURE_COOKIES' => '1',     // 1 em produção (HTTPS)
    'LEARNP5_SUBMIT_LIMIT' => '60',      // submissões por aluno por hora
    'LEARNP5_REGISTER_LIMIT' => '60',    // contas novas por IP por hora (uma turma sai toda pelo mesmo IP)
];
