<?php
//header('Content-Type: application/json');
//header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
//header('Pragma: no-cache');
//header('Expires: 0');
//
//$dbConfig = require 'dbConfig.php';
//$servername = $dbConfig['db_host'];
//$username = $dbConfig['db_username'];
//$password = $dbConfig['db_password'];
//$dbname = $dbConfig['db_name'];
//
//try {
//    $cookies = [];
//    foreach ($_COOKIE as $key => $value) {
//        $cookies[$key] = $value;
//    }
//
//    if (!isset($cookies['harvest_schools_admin_session_id'])) {
//        throw new Exception("Unauthorized: No session found", 401);
//    }
//
//    $sessionId = $cookies['harvest_schools_admin_session_id'];
//    $startTime = microtime(true);
//
//    $conn = new mysqli($servername, $username, $password, $dbname);
//    if ($conn->connect_error) {
//        throw new Exception("Connection failed: " . $conn->connect_error, 500);
//    }
//
//    $permissionSql = "SELECT u.permission_level
//                      FROM admin_sessions s
//                      JOIN admin_users u ON LOWER(s.username) = LOWER(u.username)
//                      WHERE s.id = ?";
//
//    $stmt = $conn->prepare($permissionSql);
//    if (!$stmt) {
//        throw new Exception("Prepare failed: " . $conn->error, 500);
//    }
//
//    $stmt->bind_param("s", $sessionId);
//    $stmt->execute();
//    $permissionResult = $stmt->get_result();
//    $stmt->close();
//
//    if ($permissionResult->num_rows == 0) {
//        throw new Exception("Invalid session", 401);
//    }
//
//    $permissionRow = $permissionResult->fetch_assoc();
//    $permissionLevels = explode(',', $permissionRow['permission_level']);
//    $cleanPermissionLevels = array_map(function($level) {
//        return intval(trim($level));
//    }, $permissionLevels);
//
//    $hasPermission = in_array(1, $cleanPermissionLevels);
//
//    if (!$hasPermission) {
//        throw new Exception("Permission denied", 403);
//    }
//
//    $sql = "SELECT
//                b.booking_id AS 'Booking ID',
//                s.student_id AS 'Student ID',
//                s.name AS 'Student Name',
//                s.school_division AS 'School Division',
//                s.grade AS 'Grade',
//                ac.username AS 'Booking Username',
//                ac.password_hash AS 'Booking Password',
//
//                -- First parent information
//                p1.name AS 'First Parent Name',
//                p1.email AS 'First Parent Email',
//                p1.phone_number AS 'First Parent Phone',
//
//                p2.name AS 'Second Parent Name',
//                p2.email AS 'Second Parent Email',
//                p2.phone_number AS 'Second Parent Phone',
//
//                e.cd_count AS 'CD Count',
//                e.additional_attendees AS 'Additional Attendees',
//                e.payment_status AS 'Payment Status',
//
//                s.created_at AS 'Student Created',
//                b.created_at AS 'Booking Created'
//            FROM booking_students s
//            JOIN booking_students_linker sl ON s.student_id = sl.student_id
//            JOIN bookings b ON sl.booking_id = b.booking_id
//            JOIN booking_auth_credentials ac ON b.auth_id = ac.auth_id
//            LEFT JOIN booking_extras e ON b.booking_id = e.booking_id
//
//            -- Join to get first parent (is_primary = 1)
//            LEFT JOIN (
//                SELECT pl.booking_id, p.parent_id, p.name, p.email, p.phone_number
//                FROM booking_parents p
//                JOIN booking_parents_linker pl ON p.parent_id = pl.parent_id
//                WHERE pl.is_primary = 1
//            ) AS p1 ON b.booking_id = p1.booking_id
//
//            -- Join to get second parent (is_primary = 0)
//            LEFT JOIN (
//                SELECT pl.booking_id, p.parent_id, p.name, p.email, p.phone_number
//                FROM booking_parents p
//                JOIN booking_parents_linker pl ON p.parent_id = pl.parent_id
//                WHERE pl.is_primary = 0
//            ) AS p2 ON b.booking_id = p2.booking_id
//
//            ORDER BY s.name, b.booking_id";
//
//    $result = $conn->query($sql);
//
//    if (!$result) {
//        throw new Exception("Query failed: " . $conn->error, 500);
//    }
//
//    $data = [];
//    $headers = [];
//    $firstRow = true;
//
//    if ($result->num_rows > 0) {
//        while ($row = $result->fetch_assoc()) {
//            if ($firstRow) {
//                $headers = array_keys($row);
//                $data[] = $headers;
//                $firstRow = false;
//            }
//
//            $rowData = [];
//            foreach ($headers as $header) {
//                $rowData[] = $row[$header];
//            }
//            $data[] = $rowData;
//        }
//    } else {
//        $headers = [
//            'Booking ID', 'Student ID', 'Student Name', 'School Division', 'Grade',
//            'Booking Username', 'Booking Password', 'First Parent Name', 'First Parent Email', 'First Parent Phone',
//            'Second Parent Name', 'Second Parent Email', 'Second Parent Phone',
//            'CD Count', 'Additional Attendees', 'Payment Status',
//            'Student Created', 'Booking Created'
//        ];
//        $data[] = $headers;
//    }
//
//    $endTime = microtime(true);
//    $executionTime = ($endTime - $startTime) * 1000;
//
//    echo json_encode([
//        'success' => true,
//        'data' => $data,
//        'executionTime' => $executionTime
//    ]);
//
//} catch (Exception $e) {
//    $statusCode = $e->getCode() ?: 500;
//    http_response_code($statusCode);
//
//    echo json_encode([
//        'success' => false,
//        'message' => $e->getMessage(),
//        'code' => $statusCode
//    ]);
//} finally {
//    if (isset($conn) && $conn->ping()) {
//        $conn->close();
//    }
//}
//?>
<?php
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
$dbConfig = require 'dbConfig.php';
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];

try {
    $cookies = [];
    foreach ($_COOKIE as $key => $value) {
        $cookies[$key] = $value;
    }

    if (!isset($cookies['harvest_schools_admin_session_id'])) {
        throw new Exception("Unauthorized: No session found", 401);
    }

    $sessionId = $cookies['harvest_schools_admin_session_id'];
    $startTime = microtime(true);

    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error, 500);
    }

    // Verify admin permissions
    $permissionSql = "SELECT u.permission_level
                      FROM admin_sessions s
                      JOIN admin_users u ON LOWER(s.username) = LOWER(u.username)
                      WHERE s.id = ?";
    $stmt = $conn->prepare($permissionSql);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error, 500);
    }

    $stmt->bind_param("s", $sessionId);
    $stmt->execute();
    $permissionResult = $stmt->get_result();
    $stmt->close();

    if ($permissionResult->num_rows == 0) {
        throw new Exception("Invalid session", 401);
    }

    $permissionRow = $permissionResult->fetch_assoc();
    $permissionLevels = explode(',', $permissionRow['permission_level']);
    $cleanPermissionLevels = array_map(function($level) {
        return intval(trim($level));
    }, $permissionLevels);

    $hasPermission = in_array(1, $cleanPermissionLevels);
    if (!$hasPermission) {
        throw new Exception("Permission denied", 403);
    }

    // Modified SQL to get all booking information with GROUP_CONCAT for related students and parents
    $sql = "SELECT 
                b.booking_id AS 'Booking ID',
                b.created_at AS 'Booking Created',
                b.booking_date AS 'Booking Date',
                b.booking_time AS 'Booking Time',
                b.status AS 'Booking Status',
                b.notes AS 'Booking Notes',
                ac.username AS 'Booking Username',
                ac.password_hash AS 'Booking Password',
                
                -- Students information (grouped)
                GROUP_CONCAT(DISTINCT s.student_id ORDER BY s.student_id SEPARATOR ', ') AS 'Student IDs',
                GROUP_CONCAT(DISTINCT s.name ORDER BY s.student_id SEPARATOR ', ') AS 'Student Names',
                GROUP_CONCAT(DISTINCT s.school_division ORDER BY s.student_id SEPARATOR ', ') AS 'School Divisions',
                GROUP_CONCAT(DISTINCT s.grade ORDER BY s.student_id SEPARATOR ', ') AS 'Grades',
                GROUP_CONCAT(DISTINCT s.created_at ORDER BY s.student_id SEPARATOR ', ') AS 'Students Created',
                
                -- Parents information (grouped)
                GROUP_CONCAT(DISTINCT CASE WHEN pl.is_primary = 1 THEN p.name ELSE NULL END ORDER BY p.parent_id SEPARATOR ', ') AS 'Primary Parent Names',
                GROUP_CONCAT(DISTINCT CASE WHEN pl.is_primary = 0 THEN p.name ELSE NULL END ORDER BY p.parent_id SEPARATOR ', ') AS 'Secondary Parent Names',
                GROUP_CONCAT(DISTINCT CASE WHEN pl.is_primary = 1 THEN p.email ELSE NULL END ORDER BY p.parent_id SEPARATOR ', ') AS 'Primary Parent Emails',
                GROUP_CONCAT(DISTINCT CASE WHEN pl.is_primary = 0 THEN p.email ELSE NULL END ORDER BY p.parent_id SEPARATOR ', ') AS 'Secondary Parent Emails',
                GROUP_CONCAT(DISTINCT CASE WHEN pl.is_primary = 1 THEN p.phone_number ELSE NULL END ORDER BY p.parent_id SEPARATOR ', ') AS 'Primary Parent Phones',
                GROUP_CONCAT(DISTINCT CASE WHEN pl.is_primary = 0 THEN p.phone_number ELSE NULL END ORDER BY p.parent_id SEPARATOR ', ') AS 'Secondary Parent Phones',
                
                -- Extras information
                e.cd_count AS 'CD Count',
                e.additional_attendees AS 'Additional Attendees',
                e.payment_status AS 'Payment Status'
                
            FROM bookings b
            JOIN booking_auth_credentials ac ON b.auth_id = ac.auth_id
            LEFT JOIN booking_students_linker sl ON b.booking_id = sl.booking_id
            LEFT JOIN booking_students s ON sl.student_id = s.student_id
            LEFT JOIN booking_parents_linker pl ON b.booking_id = pl.booking_id
            LEFT JOIN booking_parents p ON pl.parent_id = p.parent_id
            LEFT JOIN booking_extras e ON b.booking_id = e.booking_id
            
            GROUP BY b.booking_id
            ORDER BY b.booking_id";

    $result = $conn->query($sql);
    if (!$result) {
        throw new Exception("Query failed: " . $conn->error, 500);
    }

    $data = [];
    $headers = [];
    $firstRow = true;

    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            if ($firstRow) {
                $headers = array_keys($row);
                $data[] = $headers;
                $firstRow = false;
            }

            $rowData = [];
            foreach ($headers as $header) {
                // Clean up empty values to avoid ", , ," patterns
                if ($row[$header] === null || $row[$header] === '') {
                    $rowData[] = '';
                } else {
                    // Remove empty entries from comma-separated lists
                    if (strpos($header, 'Parent') !== false && strpos($row[$header], ', , ') !== false) {
                        $values = explode(', ', $row[$header]);
                        $values = array_filter($values, function($value) {
                            return $value !== null && $value !== '';
                        });
                        $rowData[] = implode(', ', $values);
                    } else {
                        $rowData[] = $row[$header];
                    }
                }
            }

            $data[] = $rowData;
        }
    } else {
        // If no data, provide headers
        $headers = [
            'Booking ID', 'Booking Created', 'Booking Date', 'Booking Time', 'Booking Status', 'Booking Notes',
            'Booking Username', 'Booking Password', 'Student IDs', 'Student Names',
            'School Divisions', 'Grades', 'Students Created',
            'Primary Parent Names', 'Secondary Parent Names',
            'Primary Parent Emails', 'Secondary Parent Emails',
            'Primary Parent Phones', 'Secondary Parent Phones',
            'CD Count', 'Additional Attendees', 'Payment Status'
        ];
        $data[] = $headers;
    }

    $endTime = microtime(true);
    $executionTime = ($endTime - $startTime) * 1000;

    echo json_encode([
        'success' => true,
        'data' => $data,
        'executionTime' => $executionTime
    ]);

} catch (Exception $e) {
    $statusCode = $e->getCode() ?: 500;
    http_response_code($statusCode);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'code' => $statusCode
    ]);
} finally {
    if (isset($conn) && $conn->ping()) {
        $conn->close();
    }
}
?>