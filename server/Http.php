<?php
/** Respostas JSON e validação dos pedidos (formato {"detail": ...} igual ao dos outros projetos). */

/** Erro com código HTTP; responde {"detail": ...}. */
final class HttpError extends Exception
{
    public function __construct(public int $status, public string|array $detail)
    {
        parent::__construct(is_string($detail) ? $detail : 'Pedido inválido.');
    }
}

final class Http
{
    public static function json(mixed $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    }

    /** Corpo JSON do pedido (um objeto), ou 422. */
    public static function body(): array
    {
        $data = json_decode(file_get_contents('php://input') ?: '', true);
        if (!is_array($data) || array_is_list($data) && $data !== []) {
            throw self::invalid(['body'], 'Input should be a valid dictionary', 'model_attributes_type');
        }
        return $data;
    }

    public static function invalid(array $loc, string $msg, string $type): HttpError
    {
        return new HttpError(422, [['type' => $type, 'loc' => $loc, 'msg' => $msg]]);
    }

    /** Valida um campo de texto obrigatório com comprimento entre `$min` e `$max`. */
    public static function string(array $data, string $field, int $min = 0, int $max = PHP_INT_MAX, array $loc = ['body']): string
    {
        $loc = [...$loc, $field];
        if (!array_key_exists($field, $data)) {
            throw self::invalid($loc, 'Field required', 'missing');
        }
        $value = $data[$field];
        if (!is_string($value)) {
            throw self::invalid($loc, 'Input should be a valid string', 'string_type');
        }
        $len = mb_strlen($value, 'UTF-8');
        if ($len < $min) {
            throw self::invalid($loc, "String should have at least $min characters", 'string_too_short');
        }
        if ($len > $max) {
            throw self::invalid($loc, "String should have at most $max characters", 'string_too_long');
        }
        return $value;
    }

    /** Como `string`, mas aceita null ou campo ausente. */
    public static function optionalString(array $data, string $field, int $max, array $loc): ?string
    {
        return ($data[$field] ?? null) === null ? null : self::string($data, $field, 0, $max, $loc);
    }
}
