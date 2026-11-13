<?php
/** Carrega o backend e responde a um pedido /api/*. Usado por public/api.php. */

declare(strict_types=1);

date_default_timezone_set('Europe/Lisbon');

// Compatibilidade com PHP 8.0 (o XAMPP traz o 8.0): array_is_list só existe a partir do 8.1.
if (!function_exists('array_is_list')) {
    function array_is_list(array $a): bool
    {
        return $a === [] || array_keys($a) === range(0, count($a) - 1);
    }
}

require __DIR__ . '/config.php';
require __DIR__ . '/Http.php';
require __DIR__ . '/Db.php';
require __DIR__ . '/Content.php';
require __DIR__ . '/Auth.php';
require __DIR__ . '/Gamification.php';
require __DIR__ . '/Routes.php';
