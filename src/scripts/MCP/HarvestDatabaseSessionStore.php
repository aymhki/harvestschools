<?php

use Mcp\Server\Session\SessionStoreInterface;
use Symfony\Component\Uid\Uuid;

final class HarvestDatabaseSessionStore implements SessionStoreInterface
{
    private const TABLE = 'mcp_sessions';

    public function __construct(
        private readonly mysqli $connection,
        private readonly int $ttl = 3600,
    ) {
    }

    public function exists(Uuid $id): bool
    {
        return $this->read($id) !== false;
    }

    public function read(Uuid $id): string|false
    {
        $statement = $this->connection->prepare(
            'SELECT payload FROM ' . self::TABLE . ' WHERE session_id = ? AND updated_at > (NOW() - INTERVAL ? SECOND) LIMIT 1'
        );

        if ($statement === false) {
            return false;
        }

        $sessionId = (string)$id;
        $ttl = $this->ttl;
        $statement->bind_param('si', $sessionId, $ttl);
        $statement->execute();
        $row = $statement->get_result()->fetch_assoc();
        $statement->close();

        return $row === null ? false : (string)$row['payload'];
    }

    public function write(Uuid $id, string $data): bool
    {
        $statement = $this->connection->prepare(
            'INSERT INTO ' . self::TABLE . ' (session_id, payload) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE payload = VALUES(payload), updated_at = NOW()'
        );

        if ($statement === false) {
            return false;
        }

        $sessionId = (string)$id;
        $statement->bind_param('ss', $sessionId, $data);
        $written = $statement->execute();
        $statement->close();

        return $written;
    }

    public function destroy(Uuid $id): bool
    {
        $statement = $this->connection->prepare('DELETE FROM ' . self::TABLE . ' WHERE session_id = ?');

        if ($statement === false) {
            return false;
        }

        $sessionId = (string)$id;
        $statement->bind_param('s', $sessionId);
        $destroyed = $statement->execute();
        $statement->close();

        return $destroyed;
    }

    /**
     * @return Uuid[]
     */
    public function gc(): array
    {
        $expired = [];
        $ttl = $this->ttl;

        $select = $this->connection->prepare(
            'SELECT session_id FROM ' . self::TABLE . ' WHERE updated_at <= (NOW() - INTERVAL ? SECOND)'
        );

        if ($select === false) {
            return $expired;
        }

        $select->bind_param('i', $ttl);
        $select->execute();
        $result = $select->get_result();

        while ($row = $result->fetch_assoc()) {
            if (Uuid::isValid((string)$row['session_id'])) {
                $expired[] = Uuid::fromString((string)$row['session_id']);
            }
        }

        $select->close();

        if ($expired !== []) {
            $delete = $this->connection->prepare(
                'DELETE FROM ' . self::TABLE . ' WHERE updated_at <= (NOW() - INTERVAL ? SECOND)'
            );

            if ($delete !== false) {
                $delete->bind_param('i', $ttl);
                $delete->execute();
                $delete->close();
            }
        }

        return $expired;
    }
}
