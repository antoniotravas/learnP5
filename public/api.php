<?php
// Ponto de entrada da API: o .htaccess encaminha /api/* para aqui.
// O código do servidor fica fora da pasta pública (../server).
require dirname(__DIR__) . '/server/bootstrap.php';

Routes::dispatch($_SERVER['REQUEST_METHOD'], parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');
