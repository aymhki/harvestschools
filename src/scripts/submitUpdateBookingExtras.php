<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:5173');

$dbConfig = require 'dbConfig.php';
$servername = $dbConfig['db_host'];
$username = $dbConfig['db_username'];
$password = $dbConfig['db_password'];
$dbname = $dbConfig['db_name'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $conn = null;
    $errorInfo = [
        'success' => true,
        'message' => '',
        'code' => 0
    ];

    try {
        $conn = new mysqli($servername, $username, $password, $dbname);

        if ($conn->connect_error) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Database connection failed: ' . $conn->connect_error;
            $errorInfo['code'] = 500;
            echo json_encode($errorInfo);
            return;
        }

        $formData = [];
        foreach ($_POST as $key => $value) {
            if (strpos($key, 'field_') === 0) {
                $fieldId = (int)substr($key, 6);
                $labelKey = 'label_' . $fieldId;

                if (isset($_POST[$labelKey])) {
                    $label = $_POST[$labelKey];
                    $formData[$label] = $value;
                } else {
                    $formData[$key] = $value;
                }
            } else {
                $formData[$key] = $value;
            }
        }

        if (!isset($formData['bookingId']) || empty($formData['bookingId'])) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Booking ID is missing';
            $errorInfo['code'] = 400;
            echo json_encode($errorInfo);
            return;
        }

        $bookingId = $formData['bookingId'];
        $conn->autocommit(false);

        $stmt = $conn->prepare("SELECT extra_id, cd_count, additional_attendees, payment_status  FROM booking_extras WHERE booking_id = ?");

        if (!$stmt) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Prepare select booking extras failed: ' . $conn->error;
            $errorInfo['code'] = 500;
            echo json_encode($errorInfo);
            return;
        }

        $stmt->bind_param("s", $bookingId);

        if (!$stmt->execute()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Execute failed: ' . $stmt->error;
            $errorInfo['code'] = 500;
            echo json_encode($errorInfo);
            return;
        }

        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'No booking found with the provided ID or no extras associated with this booking';
            $errorInfo['code'] = 404;
            echo json_encode($errorInfo);
            return;
        }

        $currentExtras = $result->fetch_assoc();
        $extraId = $currentExtras['extra_id'];
        $oldCdCount = $currentExtras['cd_count'];
        $oldAdditionalAttendees = $currentExtras['additional_attendees'];
        $oldPaymentStatus = $currentExtras['payment_status'];
        $newCdCount = isset($formData['Requested After Party CD(s) (250 EGP Each):']) ? intval($formData['Requested After Party CD(s) (250 EGP Each):']) : $oldCdCount;
        $newAdditionalAttendees = isset($formData['Requested Additional Attendee(s) (100 EGP Each):']) ? intval($formData['Requested Additional Attendee(s) (100 EGP Each):']) : $oldAdditionalAttendees;
        $newPaymentStatus = isset($formData['Extras Payment Status:']) ? $formData['Extras Payment Status:'] : $oldPaymentStatus;

        if ($newCdCount < 0 || $newAdditionalAttendees < 0 || empty($newPaymentStatus)) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'CD Count and Additional Attendees must be greater than or equal to 0 and Payment Status cannot be empty';
            $errorInfo['code'] = 400;
            $conn->rollback();
            echo json_encode($errorInfo);
            return;
        }

        $hasChanges = ($oldCdCount !== $newCdCount ||
            $oldAdditionalAttendees !== $newAdditionalAttendees ||
            $oldPaymentStatus !== $newPaymentStatus);

        if (!$hasChanges) {
            echo json_encode([
                'success' => true,
                'message' => 'No changes detected - booking extras already up to date',
                'code' => 200,
                'data' => [
                    'bookingId' => $bookingId,
                    'extraId' => $extraId,
                    'cdCount' => $newCdCount,
                    'additionalAttendees' => $newAdditionalAttendees,
                    'paymentStatus' => $newPaymentStatus
                ]
            ]);
            return;
        }

        $stmt = $conn->prepare("UPDATE booking_extras SET cd_count = ?, additional_attendees = ?, payment_status = ? WHERE extra_id = ?");

        if (!$stmt) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Prepare update booking extras failed: ' . $conn->error;
            $errorInfo['code'] = 500;
            $conn->rollback();
            echo json_encode($errorInfo);
            return;
        }

        $stmt->bind_param("iisi", $newCdCount, $newAdditionalAttendees, $newPaymentStatus, $extraId);

        if (!$stmt->execute()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Failed to update booking extras: ' . $stmt->error;
            $errorInfo['code'] = 500;
            $conn->rollback();
            echo json_encode($errorInfo);
            return;
        }

        if (!$conn->commit()) {
            $errorInfo['success'] = false;
            $errorInfo['message'] = 'Failed to commit transaction: ' . $conn->error;
            $errorInfo['code'] = 500;
            echo json_encode($errorInfo);
            return;
        }

        echo json_encode([
            'success' => true,
            'message' => 'Booking extras updated successfully',
            'code' => 200,
            'data' => [
                'bookingId' => $bookingId,
                'extraId' => $extraId,
                'changes' => [
                    'cdCount' => [
                        'old' => $oldCdCount,
                        'new' => $newCdCount
                    ],
                    'additionalAttendees' => [
                        'old' => $oldAdditionalAttendees,
                        'new' => $newAdditionalAttendees
                    ],
                    'paymentStatus' => [
                        'old' => $oldPaymentStatus,
                        'new' => $newPaymentStatus
                    ]
                ]
            ]
        ]);

    } catch (Exception $e) {
        $errorInfo['success'] = false;
        $errorInfo['message'] = 'An unexpected error occurred: ' . $e->getMessage();
        $errorInfo['code'] = 500;

        if ($conn !== null && !$conn->connect_error) {
            $conn->rollback();
        }

        echo json_encode($errorInfo);
    } finally {
        if ($conn !== null && !$conn->connect_error) {
            $conn->close();
        }
    }

} else {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method',
        'code' => 405
    ]);
}
?>