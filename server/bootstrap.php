<?php
/** Carrega o backend e responde a um pedido /api/*. Usado por public/api.php. */

declare(strict_types=1);

date_default_timezone_set('Europe/Lisbon');

require __DIR__ . '/config.php';
require __DIR__ . '/Http.php';
require __DIR__ . '/Db.php';
require __DIR__ . '/Content.php';
require __DIR__ . '/Auth.php';
require __DIR__ . '/Gamification.php';
require __DIR__ . '/Routes.php';
