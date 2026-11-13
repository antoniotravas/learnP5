<?php
/**
 * Configuração. Cada valor vem de config.local.php (não versionado, ver config.example.php)
 * ou, se lá não estiver, de uma variável de ambiente com o mesmo nome.
 * Com LEARNP5_IGNORE_LOCAL_CONFIG=1 (usado nos testes), o config.local.php é ignorado.
 */

final class Config
{
    private static ?array $local = null;

    public static function get(string $key, ?string $default = null): ?string
    {
        if (self::$local === null) {
            $file = __DIR__ . '/config.local.php';
            self::$local = is_file($file) && getenv('LEARNP5_IGNORE_LOCAL_CONFIG') !== '1' ? (array) require $file : [];
        }
        if (isset(self::$local[$key]) && self::$local[$key] !== '') {
            return (string) self::$local[$key];
        }
        $env = getenv($key);
        return $env === false || $env === '' ? $default : $env;
    }
}
