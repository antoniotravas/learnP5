<?php
/** Acesso à base de dados SQLite. */

final class Db
{
    private const SCHEMA = <<<'SQL'
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE COLLATE NOCASE,
            password_hash TEXT NOT NULL,
            xp INTEGER NOT NULL DEFAULT 0,
            streak INTEGER NOT NULL DEFAULT 0,
            best_streak INTEGER NOT NULL DEFAULT 0,
            last_active_date TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            exercise_id TEXT NOT NULL,
            code TEXT NOT NULL,
            tests_passed INTEGER NOT NULL,
            tests_total INTEGER NOT NULL,
            accepted INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS completions (
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            exercise_id TEXT NOT NULL,
            xp_awarded INTEGER NOT NULL,
            attempts INTEGER NOT NULL,
            completed_at TEXT NOT NULL DEFAULT (datetime('now')),
            PRIMARY KEY (user_id, exercise_id)
        );

        CREATE TABLE IF NOT EXISTS lesson_reads (
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            module_id TEXT NOT NULL,
            read_at TEXT NOT NULL DEFAULT (datetime('now')),
            PRIMARY KEY (user_id, module_id)
        );

        CREATE TABLE IF NOT EXISTS badges (
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            badge_id TEXT NOT NULL,
            earned_at TEXT NOT NULL DEFAULT (datetime('now')),
            PRIMARY KEY (user_id, badge_id)
        );

        -- Registos e logins falhados, para os limites anti-abuso.
        CREATE TABLE IF NOT EXISTS auth_events (
            ip TEXT NOT NULL,
            kind TEXT NOT NULL,
            username TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        CREATE INDEX IF NOT EXISTS auth_events_ip ON auth_events (ip, kind, created_at);

        SQL;

    private static ?PDO $pdo = null;

    public static function pdo(): PDO
    {
        if (self::$pdo === null) {
            $path = Config::get('LEARNP5_DB', dirname(__DIR__) . '/data/learnp5.db');
            if (!is_dir(dirname($path))) {
                mkdir(dirname($path), 0750, true);
            }
            self::$pdo = new PDO('sqlite:' . $path, options: [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 10,
            ]);
            self::$pdo->exec('PRAGMA foreign_keys = ON');
            self::$pdo->exec(self::SCHEMA);
        }
        return self::$pdo;
    }

    public static function run(string $sql, array $params = []): PDOStatement
    {
        $stmt = self::pdo()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public static function one(string $sql, array $params = []): ?array
    {
        return self::run($sql, $params)->fetch() ?: null;
    }

    public static function all(string $sql, array $params = []): array
    {
        return self::run($sql, $params)->fetchAll();
    }

    public static function value(string $sql, array $params = []): mixed
    {
        return self::run($sql, $params)->fetchColumn();
    }

    /** Lista com a primeira coluna de cada linha. */
    public static function column(string $sql, array $params = []): array
    {
        return self::run($sql, $params)->fetchAll(PDO::FETCH_COLUMN);
    }

    /** Executa `$fn` numa transação (tudo ou nada). */
    public static function transaction(callable $fn): mixed
    {
        $pdo = self::pdo();
        $pdo->beginTransaction();
        try {
            $result = $fn();
            $pdo->commit();
            return $result;
        } catch (Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }
}
