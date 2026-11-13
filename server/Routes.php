<?php
/** Endpoints da API (/api/*). */

final class Routes
{
    /** Logins falhados permitidos em 15 minutos, por nome de utilizador e por IP (uma turma partilha o IP da escola). */
    private const LOGIN_FAILS_PER_USER = 10;
    private const LOGIN_FAILS_PER_IP = 100;

    /** [método, padrão, handler]; os grupos do padrão são passados ao handler. */
    private const ROUTES = [
        ['POST', '#^/api/register$#', 'register'],
        ['POST', '#^/api/login$#', 'login'],
        ['POST', '#^/api/logout$#', 'logout'],
        ['GET', '#^/api/me$#', 'me'],
        ['GET', '#^/api/modules$#', 'listModules'],
        ['GET', '#^/api/modules/([^/]+)$#', 'getModule'],
        ['POST', '#^/api/modules/([^/]+)/read$#', 'markLessonRead'],
        ['GET', '#^/api/leaderboard$#', 'leaderboard'],
        ['GET', '#^/api/exercises/([^/]+)$#', 'getExercise'],
        ['POST', '#^/api/exercises/([^/]+)/submit$#', 'submit'],
    ];

    public static function dispatch(string $method, string $path): void
    {
        try {
            $allowed = false;
            foreach (self::ROUTES as [$routeMethod, $pattern, $handler]) {
                if (!preg_match($pattern, $path, $m)) {
                    continue;
                }
                if ($routeMethod !== $method) {
                    $allowed = true;
                    continue;
                }
                $args = array_map('rawurldecode', array_slice($m, 1));
                Http::json(self::$handler(...$args));
                return;
            }
            throw $allowed ? new HttpError(405, 'Method Not Allowed') : new HttpError(404, 'Not Found');
        } catch (HttpError $e) {
            Http::json(['detail' => $e->detail], $e->status);
        } catch (Throwable $e) {
            error_log((string) $e);
            Http::json(['detail' => 'Erro interno do servidor.'], 500);
        }
    }

    // ---------- Autenticação ----------

    private static function credentials(): array
    {
        $body = Http::body();
        return [Http::string($body, 'username', 3, 30), Http::string($body, 'password', 6, 200)];
    }

    private static function clientIp(): string
    {
        return $_SERVER['REMOTE_ADDR'] ?? '?';
    }

    /** Quantos eventos `$kind` vieram deste IP (e, se indicado, para este nome) desde `$since` (ex.: '-1 hour'). */
    private static function countAuthEvents(string $kind, string $since, ?string $username = null): int
    {
        Db::run("DELETE FROM auth_events WHERE created_at <= datetime('now', '-1 hour')");
        $sql = "SELECT COUNT(*) FROM auth_events WHERE ip = ? AND kind = ? AND created_at > datetime('now', ?)";
        $params = [self::clientIp(), $kind, $since];
        if ($username !== null) {
            $sql .= ' AND username = ?';
            $params[] = strtolower($username);
        }
        return (int) Db::value($sql, $params);
    }

    private static function recordAuthEvent(string $kind, ?string $username = null): void
    {
        Db::run(
            'INSERT INTO auth_events (ip, kind, username) VALUES (?, ?, ?)',
            [self::clientIp(), $kind, $username === null ? null : strtolower($username)],
        );
    }

    private static function register(): array
    {
        [$username, $password] = self::credentials();
        $limit = (int) Config::get('LEARNP5_REGISTER_LIMIT', '60');
        if (self::countAuthEvents('register', '-1 hour') >= $limit) {
            throw new HttpError(429, 'Foram criadas demasiadas contas a partir desta rede. Tenta outra vez daqui a uma hora.');
        }
        if (!preg_match('/^[A-Za-z0-9_.-]+$/D', $username)) {
            throw new HttpError(400, "O nome de utilizador só pode ter letras, números, '_', '.' e '-'.");
        }
        if (Db::one('SELECT 1 FROM users WHERE username = ?', [$username])) {
            throw new HttpError(409, 'Esse nome de utilizador já existe.');
        }
        Db::run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [$username, Auth::hashPassword($password)]);
        Auth::setCookie(Auth::createSession((int) Db::pdo()->lastInsertId()));
        self::recordAuthEvent('register');
        return ['ok' => true];
    }

    private static function login(): array
    {
        [$username, $password] = self::credentials();
        if (self::countAuthEvents('login_fail', '-15 minutes', $username) >= self::LOGIN_FAILS_PER_USER
            || self::countAuthEvents('login_fail', '-15 minutes') >= self::LOGIN_FAILS_PER_IP) {
            throw new HttpError(429, 'Demasiadas tentativas falhadas. Espera uns minutos e tenta outra vez.');
        }
        $row = Db::one('SELECT * FROM users WHERE username = ?', [$username]);
        if ($row === null || !Auth::verifyPassword($password, $row['password_hash'])) {
            self::recordAuthEvent('login_fail', $username);
            throw new HttpError(401, 'Nome de utilizador ou palavra-passe incorretos.');
        }
        Auth::setCookie(Auth::createSession($row['id']));
        return ['ok' => true];
    }

    private static function logout(): array
    {
        $token = $_COOKIE[Auth::SESSION_COOKIE] ?? '';
        if (is_string($token) && $token !== '') {
            Auth::deleteSession($token);
        }
        Auth::clearCookie();
        return ['ok' => true];
    }

    // ---------- Perfil e progresso ----------

    private static function profile(int $userId): array
    {
        $user = Db::one('SELECT * FROM users WHERE id = ?', [$userId]);
        $earned = [];
        foreach (Db::all('SELECT * FROM badges WHERE user_id = ?', [$userId]) as $r) {
            $earned[$r['badge_id']] = $r['earned_at'];
        }
        $badges = [];
        foreach (Gamification::BADGES as $id => $badge) {
            $badges[] = ['id' => $id] + $badge + ['earned' => isset($earned[$id]), 'earned_at' => $earned[$id] ?? null];
        }
        return [
            'username' => $user['username'],
            'streak' => $user['streak'],
            'best_streak' => $user['best_streak'],
            'level' => Gamification::levelInfo($user['xp']),
            'exercises_done' => (int) Db::value('SELECT COUNT(*) FROM completions WHERE user_id = ?', [$userId]),
            'exercises_total' => count(Content::$exercises),
            'badges' => $badges,
        ];
    }

    private static function me(): array
    {
        return self::profile(Auth::currentUser()['id']);
    }

    /** Ids dos exercícios resolvidos pelo utilizador, como chaves. */
    private static function doneIds(int $userId): array
    {
        return array_flip(Db::column('SELECT exercise_id FROM completions WHERE user_id = ?', [$userId]));
    }

    private static function listModules(): array
    {
        $user = Auth::currentUser();
        $done = self::doneIds($user['id']);
        $read = array_flip(Db::column('SELECT module_id FROM lesson_reads WHERE user_id = ?', [$user['id']]));
        return array_map(fn($m) => [
            'id' => $m['id'],
            'track' => $m['track'],
            'title' => $m['title'],
            'icon' => $m['icon'],
            'summary' => $m['summary'],
            'lesson_read' => isset($read[$m['id']]),
            'exercises_total' => count($m['exercises']),
            'exercises_done' => count(array_filter($m['exercises'], fn($ex) => isset($done[$ex['id']]))),
        ], Content::$modules);
    }

    private static function findModule(string $moduleId): array
    {
        return Content::$modulesById[$moduleId] ?? throw new HttpError(404, 'Módulo não encontrado.');
    }

    private static function getModule(string $moduleId): array
    {
        $user = Auth::currentUser();
        $module = self::findModule($moduleId);
        $done = self::doneIds($user['id']);
        $read = Db::one('SELECT 1 FROM lesson_reads WHERE user_id = ? AND module_id = ?', [$user['id'], $moduleId]);
        return [
            'id' => $module['id'],
            'track' => $module['track'],
            'title' => $module['title'],
            'icon' => $module['icon'],
            'lesson' => $module['lesson'],
            'lesson_read' => $read !== null,
            'exercises' => array_map(fn($ex) => [
                'id' => $ex['id'],
                'title' => $ex['title'],
                'difficulty' => $ex['difficulty'],
                'xp' => Gamification::XP_BY_DIFFICULTY[$ex['difficulty']],
                'done' => isset($done[$ex['id']]),
            ], $module['exercises']),
        ];
    }

    private static function markLessonRead(string $moduleId): array
    {
        $user = Auth::currentUser();
        self::findModule($moduleId);
        return Db::transaction(function () use ($user, $moduleId) {
            $inserted = Db::run(
                'INSERT OR IGNORE INTO lesson_reads (user_id, module_id) VALUES (?, ?)', [$user['id'], $moduleId]
            )->rowCount();
            $xp = 0;
            if ($inserted) {
                $xp = Gamification::LESSON_READ_XP;
                Gamification::addXp($user['id'], $xp);
                Gamification::touchStreak($user);
            }
            return ['xp_gained' => $xp, 'new_badges' => Gamification::awardBadges($user['id'])];
        });
    }

    private static function leaderboard(): array
    {
        $user = Auth::currentUser();
        $rows = Db::all(
            'SELECT u.username, u.xp, u.streak, COUNT(c.exercise_id) AS done
             FROM users u LEFT JOIN completions c ON c.user_id = u.id
             GROUP BY u.id ORDER BY u.xp DESC, done DESC LIMIT 50'
        );
        return array_map(fn($r) => $r + [
            'level' => Gamification::levelInfo($r['xp'])['level'],
            'me' => $r['username'] === $user['username'],
        ], $rows);
    }

    // ---------- Exercícios ----------

    private static function findExercise(string $exerciseId): array
    {
        return Content::$exercises[$exerciseId] ?? throw new HttpError(404, 'Exercício não encontrado.');
    }

    private static function getExercise(string $exerciseId): array
    {
        $user = Auth::currentUser();
        $ex = self::findExercise($exerciseId);
        $module = Content::$modulesById[$ex['module_id']];
        $ids = array_column($module['exercises'], 'id');
        $idx = array_search($exerciseId, $ids, true);
        $done = Db::one('SELECT 1 FROM completions WHERE user_id = ? AND exercise_id = ?', [$user['id'], $exerciseId]);
        $last = Db::one(
            'SELECT code FROM submissions WHERE user_id = ? AND exercise_id = ? ORDER BY id DESC LIMIT 1',
            [$user['id'], $exerciseId],
        );
        return [
            'id' => $ex['id'],
            'title' => $ex['title'],
            'difficulty' => $ex['difficulty'],
            'xp' => Gamification::XP_BY_DIFFICULTY[$ex['difficulty']],
            'statement' => $ex['statement'],
            'starter' => $ex['starter'], // código inicial no editor
            'last_code' => $last['code'] ?? null,
            'hint' => $ex['hint'],
            'tests' => $ex['tests'],
            'done' => $done !== null,
            'module' => ['id' => $module['id'], 'title' => $module['title']],
            'next_id' => $ids[$idx + 1] ?? null,
        ];
    }

    /** Valida o corpo de uma submissão: {code, results: [{passed, actual, error}]}. */
    private static function submission(): array
    {
        $body = Http::body();
        $code = Http::string($body, 'code', 0, 20000);
        $raw = $body['results'] ?? null;
        if (!is_array($raw) || !array_is_list($raw)) {
            throw Http::invalid(['body', 'results'], 'Input should be a valid list', 'list_type');
        }
        $results = [];
        foreach ($raw as $i => $r) {
            $loc = ['body', 'results', $i];
            if (!is_array($r) || !is_bool($r['passed'] ?? null)) {
                throw Http::invalid([...$loc, 'passed'], 'Input should be a valid boolean', 'bool_type');
            }
            $results[] = [
                'passed' => $r['passed'],
                'actual' => Http::optionalString($r, 'actual', 5000, $loc),
                'error' => Http::optionalString($r, 'error', 5000, $loc),
            ];
        }
        return [$code, $results];
    }

    private static function submit(string $exerciseId): array
    {
        $user = Auth::currentUser();
        [$code, $results] = self::submission();
        $ex = self::findExercise($exerciseId);
        if (count($results) !== count($ex['tests'])) {
            throw new HttpError(400, 'Número de resultados de testes inválido.');
        }

        $limit = (int) Config::get('LEARNP5_SUBMIT_LIMIT', '60');
        $recent = (int) Db::value(
            "SELECT COUNT(*) FROM submissions WHERE user_id = ? AND created_at > datetime('now', '-1 hour')",
            [$user['id']],
        );
        if ($recent >= $limit) {
            throw new HttpError(429, 'Atingiste o limite de submissões por hora. Faz uma pausa e tenta daqui a pouco.');
        }

        $passed = count(array_filter($results, fn($r) => $r['passed']));
        $accepted = $passed === count($results);

        return Db::transaction(function () use ($user, $exerciseId, $ex, $code, $results, $passed, $accepted) {
            $userId = $user['id'];
            $levelBefore = Gamification::levelInfo(Db::value('SELECT xp FROM users WHERE id = ?', [$userId]))['level'];
            $previousAttempts = (int) Db::value(
                'SELECT COUNT(*) FROM submissions WHERE user_id = ? AND exercise_id = ?', [$userId, $exerciseId]
            );
            $alreadyDone = Db::one(
                'SELECT 1 FROM completions WHERE user_id = ? AND exercise_id = ?', [$userId, $exerciseId]
            ) !== null;

            Db::run(
                'INSERT INTO submissions (user_id, exercise_id, code, tests_passed, tests_total, accepted)
                 VALUES (?, ?, ?, ?, ?, ?)',
                [$userId, $exerciseId, $code, $passed, count($results), (int) $accepted],
            );
            Gamification::touchStreak($user);

            $xpGained = 0;
            $firstTry = false;
            if ($accepted && !$alreadyDone) {
                $firstTry = $previousAttempts === 0;
                $xpGained = Gamification::XP_BY_DIFFICULTY[$ex['difficulty']] + ($firstTry ? Gamification::FIRST_TRY_BONUS : 0);
                Db::run(
                    'INSERT INTO completions (user_id, exercise_id, xp_awarded, attempts) VALUES (?, ?, ?, ?)',
                    [$userId, $exerciseId, $xpGained, $previousAttempts + 1],
                );
                Gamification::addXp($userId, $xpGained);
            }

            $newBadges = Gamification::awardBadges($userId, $firstTry);
            $profile = self::profile($userId);

            return [
                'accepted' => $accepted,
                'tests_passed' => $passed,
                'tests_total' => count($results),
                'already_done' => $alreadyDone,
                'first_try' => $firstTry,
                'xp_gained' => $xpGained,
                'level_up' => $profile['level']['level'] > $levelBefore,
                'new_badges' => $newBadges,
                'profile' => $profile,
            ];
        });
    }
}
