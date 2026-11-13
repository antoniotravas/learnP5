<?php
/** Registo, login e sessões por cookie. */

final class Auth
{
    public const SESSION_COOKIE = 'lp_session';
    public const SESSION_DAYS = 30;
    private const ITERATIONS = 200000;

    /** Formato: pbkdf2_sha256$iterações$sal_hex$digest_hex (o mesmo do LearnPython e do LearnGit). */
    public static function hashPassword(string $password): string
    {
        $salt = random_bytes(16);
        $digest = hash_pbkdf2('sha256', $password, $salt, self::ITERATIONS);
        return 'pbkdf2_sha256$' . self::ITERATIONS . '$' . bin2hex($salt) . '$' . $digest;
    }

    public static function verifyPassword(string $password, string $stored): bool
    {
        $parts = explode('$', $stored);
        if (count($parts) !== 4) {
            return false;
        }
        [, $iterations, $saltHex, $digestHex] = $parts;
        $salt = @hex2bin($saltHex);
        if ($salt === false || (int) $iterations < 1) {
            return false;
        }
        return hash_equals($digestHex, hash_pbkdf2('sha256', $password, $salt, (int) $iterations));
    }

    public static function createSession(int $userId): string
    {
        $token = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
        Db::run('INSERT INTO sessions (token, user_id) VALUES (?, ?)', [$token, $userId]);
        return $token;
    }

    public static function deleteSession(string $token): void
    {
        Db::run('DELETE FROM sessions WHERE token = ?', [$token]);
    }

    public static function setCookie(string $token): void
    {
        self::cookie($token, time() + self::SESSION_DAYS * 86400);
    }

    public static function clearCookie(): void
    {
        self::cookie('', 1);
    }

    private static function cookie(string $value, int $expires): void
    {
        setcookie(self::SESSION_COOKIE, $value, [
            'expires' => $expires,
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
            'secure' => Config::get('LEARNP5_SECURE_COOKIES') === '1',
        ]);
    }

    /** Devolve o utilizador autenticado ou responde 401. */
    public static function currentUser(): array
    {
        $token = $_COOKIE[self::SESSION_COOKIE] ?? '';
        if (!is_string($token) || $token === '') {
            throw new HttpError(401, 'Sessão não iniciada.');
        }
        $user = Db::one(
            "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
             WHERE s.token = ? AND s.created_at > datetime('now', ?)",
            [$token, '-' . self::SESSION_DAYS . ' days'],
        );
        if ($user === null) {
            throw new HttpError(401, 'Sessão inválida ou expirada.');
        }
        return $user;
    }
}
