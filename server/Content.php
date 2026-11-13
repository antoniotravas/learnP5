<?php
/** Conteúdo do curso (lições e exercícios), lido de content.json. */

final class Content
{
    /** @var list<array> */
    public static array $modules = [];
    /** Exercícios por id, cada um com `module_id`. */
    public static array $exercises = [];
    public static array $modulesById = [];

    public static function load(): void
    {
        $json = file_get_contents(__DIR__ . '/content.json');
        self::$modules = json_decode($json, true, flags: JSON_THROW_ON_ERROR);
        foreach (self::$modules as $m) {
            self::$modulesById[$m['id']] = $m;
            foreach ($m['exercises'] as $ex) {
                self::$exercises[$ex['id']] = $ex + ['module_id' => $m['id']];
            }
        }
    }
}

Content::load();
