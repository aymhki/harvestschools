<?php


const MCP_LIB_PREFIXES = [
    "Doctrine\\Deprecations\\" => ["doctrine-deprecations/src"],
    "Http\\Discovery\\" => ["php-http-discovery/src"],
    "Mcp\\" => ["mcp-sdk/src"],
    "Nyholm\\Psr7Server\\" => ["nyholm-psr7-server/src"],
    "Nyholm\\Psr7\\" => ["nyholm-psr7/src"],
    "Opis\\JsonSchema\\" => ["opis-json-schema/src"],
    "Opis\\String\\" => ["opis-string/src"],
    "Opis\\Uri\\" => ["opis-uri/src"],
    "PHPStan\\PhpDocParser\\" => ["phpstan-phpdoc-parser/src"],
    "Psr\\Clock\\" => ["psr-clock/src"],
    "Psr\\Container\\" => ["psr-container/src"],
    "Psr\\EventDispatcher\\" => ["psr-event-dispatcher/src"],
    "Psr\\Http\\Client\\" => ["psr-http-client/src"],
    "Psr\\Http\\Message\\" => ["psr-http-factory/src", "psr-http-message/src"],
    "Psr\\Http\\Server\\" => ["psr-http-server-handler/src", "psr-http-server-middleware/src"],
    "Psr\\Log\\" => ["psr-log/src"],
    "Symfony\\Component\\Uid\\" => ["symfony-uid"],
    "Symfony\\Polyfill\\Uuid\\" => ["symfony-polyfill-uuid"],
    "Webmozart\\Assert\\" => ["webmozart-assert/src"],
    "phpDocumentor\\Reflection\\" => ["phpdocumentor-reflection-common/src", "phpdocumentor-reflection-docblock/src", "phpdocumentor-type-resolver/src"],
];

spl_autoload_register(static function (string $class): void {
    foreach (MCP_LIB_PREFIXES as $prefix => $directories) {
        if (strncmp($class, $prefix, strlen($prefix)) !== 0) {
            continue;
        }

        $relative = str_replace('\\', DIRECTORY_SEPARATOR, substr($class, strlen($prefix))) . '.php';

        foreach ($directories as $directory) {
            $path = __DIR__ . DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . $directory . DIRECTORY_SEPARATOR . $relative;

            if (is_file($path)) {
                require_once $path;

                return;
            }
        }
    }
});

require_once __DIR__ . '/lib/symfony-polyfill-uuid/bootstrap.php';
