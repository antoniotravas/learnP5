<?php
/** XP, níveis, sequências de dias (streaks) e medalhas. */

final class Gamification
{
    public const XP_BY_DIFFICULTY = [1 => 10, 2 => 20, 3 => 30];
    public const FIRST_TRY_BONUS = 5;
    public const LESSON_READ_XP = 5;

    public const LEVEL_TITLES = [
        'Tela em Branco',
        'Primeiro Ponto',
        'Traço Firme',
        'Mestre das Formas',
        'Pintor RGB',
        'Animador',
        'Domador do draw()',
        'Artista Generativo',
        'Criador Interativo',
        'Lenda do p5',
    ];

    public const BADGES = [
        'primeiro_passo' => ['name' => 'Primeiro Sketch', 'icon' => '🐣', 'description' => 'Resolveste o teu primeiro exercício.'],
        'leitor' => ['name' => 'Leitor Atento', 'icon' => '📖', 'description' => 'Leste a tua primeira lição.'],
        'a_primeira' => ['name' => 'À Primeira!', 'icon' => '🎯', 'description' => 'Resolveste um exercício sem nenhum erro.'],
        'cinco' => ['name' => 'Em Ritmo', 'icon' => '🔥', 'description' => 'Resolveste 5 exercícios.'],
        'quinze' => ['name' => 'Imparável', 'icon' => '🚀', 'description' => 'Resolveste 15 exercícios.'],
        'modulo' => ['name' => 'Módulo Concluído', 'icon' => '🏅', 'description' => 'Completaste todos os exercícios de um módulo.'],
        'streak_3' => ['name' => 'Três Dias Seguidos', 'icon' => '📅', 'description' => 'Praticaste 3 dias seguidos.'],
        'streak_7' => ['name' => 'Semana Perfeita', 'icon' => '🗓️', 'description' => 'Praticaste 7 dias seguidos.'],
        'nivel_5' => ['name' => 'Pintor RGB', 'icon' => '🎨', 'description' => 'Chegaste ao nível 5.'],
        'ressalto' => ['name' => 'Física de Bolso', 'icon' => '⚽', 'description' => 'Puseste uma bola a ressaltar nas paredes.'],
        'desenho' => ['name' => 'Ilustrador', 'icon' => '✏️', 'description' => 'Completaste todos os exercícios de Desenho.'],
        'animacao' => ['name' => 'Animador', 'icon' => '🎞️', 'description' => 'Completaste todos os exercícios de Animação.'],
        'interacao' => ['name' => 'Criador de Jogos', 'icon' => '🕹️', 'description' => 'Completaste todos os exercícios de Interação.'],
        'tudo' => ['name' => 'Lenda do p5', 'icon' => '🏆', 'description' => 'Resolveste todos os exercícios do curso.'],
    ];

    /** XP total necessário para atingir `$level` (nível 1 = 0 XP). */
    public static function xpForLevel(int $level): int
    {
        return 25 * ($level - 1) ** 2;
    }

    public static function levelInfo(int $xp): array
    {
        $level = 1;
        while (self::xpForLevel($level + 1) <= $xp) {
            $level++;
        }
        $currentFloor = self::xpForLevel($level);
        $nextFloor = self::xpForLevel($level + 1);
        return [
            'level' => $level,
            'title' => self::LEVEL_TITLES[min($level - 1, count(self::LEVEL_TITLES) - 1)],
            'xp' => $xp,
            'xp_into_level' => $xp - $currentFloor,
            'xp_for_next' => $nextFloor - $currentFloor,
        ];
    }

    /**
     * Atualiza a sequência de dias consecutivos com atividade. Devolve o novo valor.
     * `$today` no formato Y-m-d (por omissão, hoje em Lisboa). Com `$save = false` não escreve na BD (testes).
     */
    public static function touchStreak(array &$user, ?string $today = null, bool $save = true): int
    {
        $today ??= date('Y-m-d');
        $last = $user['last_active_date'] ?? null;
        if ($last === $today) {
            return (int) $user['streak'];
        }
        $yesterday = (new DateTimeImmutable($today))->modify('-1 day')->format('Y-m-d');
        $streak = $last === $yesterday ? (int) $user['streak'] + 1 : 1;
        if ($save) {
            Db::run(
                'UPDATE users SET streak = ?, best_streak = MAX(best_streak, ?), last_active_date = ? WHERE id = ?',
                [$streak, $streak, $today, $user['id']],
            );
        }
        $user['streak'] = $streak;
        $user['last_active_date'] = $today;
        return $streak;
    }

    public static function addXp(int $userId, int $amount): void
    {
        Db::run('UPDATE users SET xp = xp + ? WHERE id = ?', [$amount, $userId]);
    }

    /** Verifica as condições de todas as medalhas e atribui as novas. Devolve as recém-ganhas. */
    public static function awardBadges(int $userId, bool $firstTry = false): array
    {
        $owned = array_flip(Db::column('SELECT badge_id FROM badges WHERE user_id = ?', [$userId]));
        $user = Db::one('SELECT xp, streak FROM users WHERE id = ?', [$userId]);
        $done = array_flip(Db::column('SELECT exercise_id FROM completions WHERE user_id = ?', [$userId]));
        $reads = (int) Db::value('SELECT COUNT(*) FROM lesson_reads WHERE user_id = ?', [$userId]);

        $allDone = fn(array $ids) => $ids && !array_diff($ids, array_keys($done));
        $moduleComplete = false;
        $trackIds = []; // Ids dos exercícios de cada tema (Desenho, Animação, Interação).
        $badgeIds = []; // Exercícios que dão uma medalha própria (ex.: 'ressalto').
        foreach (Content::$modules as $module) {
            $ids = array_column($module['exercises'], 'id');
            $moduleComplete = $moduleComplete || $allDone($ids);
            $trackIds[$module['track']] = [...$trackIds[$module['track']] ?? [], ...$ids];
            foreach ($module['exercises'] as $ex) {
                if (isset($ex['badge'])) {
                    $badgeIds[$ex['badge']][] = $ex['id'];
                }
            }
        }
        $anyDone = fn(array $ids) => (bool) array_intersect($ids, array_keys($done));
        $conditions = [
            'primeiro_passo' => count($done) >= 1,
            'leitor' => $reads >= 1,
            'a_primeira' => $firstTry,
            'cinco' => count($done) >= 5,
            'quinze' => count($done) >= 15,
            'modulo' => $moduleComplete,
            'streak_3' => $user['streak'] >= 3,
            'streak_7' => $user['streak'] >= 7,
            'nivel_5' => self::levelInfo($user['xp'])['level'] >= 5,
            'ressalto' => $anyDone($badgeIds['ressalto'] ?? []),
            'desenho' => $allDone($trackIds['Desenho'] ?? []),
            'animacao' => $allDone($trackIds['Animação'] ?? []),
            'interacao' => $allDone($trackIds['Interação'] ?? []),
            'tudo' => count($done) >= count(Content::$exercises),
        ];

        $new = [];
        foreach ($conditions as $badgeId => $earned) {
            if ($earned && !isset($owned[$badgeId])) {
                Db::run('INSERT INTO badges (user_id, badge_id) VALUES (?, ?)', [$userId, $badgeId]);
                $new[] = ['id' => $badgeId] + self::BADGES[$badgeId];
            }
        }
        return $new;
    }
}
