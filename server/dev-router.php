<?php
// Router para testar localmente com o servidor embutido do PHP (faz o papel do .htaccess):
//   php -S localhost:8000 server/dev-router.php

$public = dirname(__DIR__) . '/public';
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');

if (str_starts_with($path, '/api/')) {
    require $public . '/api.php';
    return;
}

$file = realpath($public . ($path === '/' ? '/index.html' : $path));
if ($file === false || !is_file($file) || !str_starts_with($file, realpath($public)) || str_contains($path, '/.')
    || pathinfo($file, PATHINFO_EXTENSION) === 'php') {
    http_response_code(404);
    echo 'Not Found';
    return;
}

$types = ['html' => 'text/html; charset=utf-8', 'js' => 'text/javascript; charset=utf-8', 'css' => 'text/css; charset=utf-8', 'svg' => 'image/svg+xml', 'png' => 'image/png'];
header('Content-Type: ' . ($types[pathinfo($file, PATHINFO_EXTENSION)] ?? 'application/octet-stream'));
header('Cache-Control: no-cache');
// Os iframes dos sketches (sandbox, origem opaca) carregam o p5.js e o harness com crossorigin.
header('Access-Control-Allow-Origin: *');
readfile($file);
