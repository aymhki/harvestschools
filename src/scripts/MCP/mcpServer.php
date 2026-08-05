<?php

require_once __DIR__ . '/autoload.php';
require_once __DIR__ . '/../Public/SchoolInfo/publicSchoolInfoHelpers.php';
require_once __DIR__ . '/../Public/SchoolInfo/publicRateLimit.php';
require_once __DIR__ . '/HarvestDatabaseSessionStore.php';
require_once __DIR__ . '/mcpTools.php';

use Mcp\Server;
use Mcp\Server\Transport\Http\Middleware\CorsMiddleware;
use Mcp\Server\Transport\Http\Middleware\DnsRebindingProtectionMiddleware;
use Mcp\Server\Transport\Http\Middleware\ProtocolVersionMiddleware;
use Mcp\Server\Transport\StreamableHttpTransport;
use Nyholm\Psr7\Factory\Psr17Factory;
use Nyholm\Psr7Server\ServerRequestCreator;

const MCP_SERVER_NAME = 'harvest-school-info';

const MCP_SERVER_VERSION = '1.0.0';

const MCP_SESSION_TTL_SECONDS = 3600;

const MCP_RATE_LIMIT_MAX_REQUESTS = 120;

const MCP_INSTRUCTIONS = 'Read-only access to published Harvest International Schools information. '
    . 'Never state a tuition fee when isTuitionPublished is false - say the fee is not published and refer the user '
    . 'to the admissions department. Do not invent facts that are absent from these tools.';

const MCP_ALLOWED_HOSTS = [
    'harvestschools.com',
    'www.harvestschools.com',
    'localhost',
    '127.0.0.1',
    '[::1]',
];


function mcp_database_connection(): ?mysqli {
    static $connection = null;

    if ($connection instanceof mysqli) {
        return $connection;
    }

    $docRoot = rtrim($_SERVER['DOCUMENT_ROOT'] ?? '', '/\\');
    $configPath = dirname($docRoot) . '/configs/dbConfig.php';

    if (!is_file($configPath)) {
        return null;
    }

    $dbConfig = require $configPath;
    $candidate = @new mysqli($dbConfig['db_host'], $dbConfig['db_username'], $dbConfig['db_password'], $dbConfig['db_name']);

    if ($candidate->connect_error) {
        return null;
    }

    $candidate->set_charset('utf8mb4');

    $connection = $candidate;

    return $connection;
}

if (!public_rate_limit_allow('mcp-server', MCP_RATE_LIMIT_MAX_REQUESTS, 60)) {
    header('Content-Type: application/json');
    public_rate_limit_reject();
}

$mcpConnection = mcp_database_connection();

if ($mcpConnection === null) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo json_encode(['jsonrpc' => '2.0', 'id' => null, 'error' => ['code' => -32603, 'message' => 'Session storage is unavailable.']]);
    exit;
}

$mcpBuilder = Server::builder()
    ->setServerInfo(MCP_SERVER_NAME, MCP_SERVER_VERSION)
    ->setInstructions(MCP_INSTRUCTIONS)
    ->setSession(new HarvestDatabaseSessionStore($mcpConnection, MCP_SESSION_TTL_SECONDS));

foreach (mcp_tool_schemas() as $mcpToolName => $mcpToolSchema) {
    $mcpBuilder->addTool(
        handler: static function (
            string $query = '',
            string $language = 'en',
            string $department = '',
            string $stage = '',
            string $division = '',
            string $fromDate = '',
            string $toDate = '',
            string $section = '',
        ) use ($mcpToolName): string {
            return mcp_tool_invoke($mcpToolName, compact(
                'query', 'language', 'department', 'stage', 'division', 'fromDate', 'toDate', 'section'
            ));
        },
        name: $mcpToolName,
        title: $mcpToolSchema['title'],
        description: $mcpToolSchema['description'],
        inputSchema: $mcpToolSchema['inputSchema'],
    );
}

$mcpServer = $mcpBuilder->build();

$psr17Factory = new Psr17Factory();
$requestCreator = new ServerRequestCreator($psr17Factory, $psr17Factory, $psr17Factory, $psr17Factory);

$transport = new StreamableHttpTransport(
    $requestCreator->fromGlobals(),
    $psr17Factory,
    $psr17Factory,
    null,
    [
        new CorsMiddleware(['*'], ['GET', 'POST', 'DELETE', 'OPTIONS']),
        new DnsRebindingProtectionMiddleware(MCP_ALLOWED_HOSTS, $psr17Factory, $psr17Factory),
        new ProtocolVersionMiddleware(),
    ]
);

$response = $mcpServer->run($transport);

if (!headers_sent()) {
    http_response_code($response->getStatusCode());

    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Credentials: false');
    header('Access-Control-Allow-Methods: POST, GET, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Accept, Mcp-Session-Id, MCP-Protocol-Version, Last-Event-ID');
    header('Access-Control-Expose-Headers: Mcp-Session-Id');

    foreach ($response->getHeaders() as $name => $values) {
        foreach ($values as $index => $value) {
            header($name . ': ' . $value, $index === 0);
        }
    }
}

$body = $response->getBody();

if ($body->isSeekable()) {
    $body->rewind();
}

while (!$body->eof()) {
    echo $body->read(8192);
}

$mcpConnection->close();
