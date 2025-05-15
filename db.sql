SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

CREATE TABLE `admin_sessions` (
                                  `id` text NOT NULL,
                                  `username` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `admin_users` (
                               `id` int(11) NOT NULL,
                               `username` varchar(50) NOT NULL,
                               `password_hash` text NOT NULL,
                               `permission_level` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DELIMITER $$
CREATE TRIGGER `hash_password_before_insert_for_admins` BEFORE INSERT ON `admin_users` FOR EACH ROW BEGIN
    SET NEW.password_hash = SHA2(NEW.password_hash, 256);
END
    $$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `validate_permission_level_before_insert` BEFORE INSERT ON `admin_users` FOR EACH ROW BEGIN
    DECLARE valid BOOLEAN DEFAULT TRUE;
    DECLARE perm_value VARCHAR(10);
    DECLARE error_msg VARCHAR(255);
    DECLARE comma_pos INT;
    DECLARE remaining_str VARCHAR(255);

    IF NEW.permission_level = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Permission level cannot be empty';
END IF;

SET remaining_str = NEW.permission_level;

    WHILE LENGTH(remaining_str) > 0 AND valid = TRUE DO
        SET comma_pos = LOCATE(',', remaining_str);

        IF comma_pos > 0 THEN
            SET perm_value = TRIM(SUBSTRING(remaining_str, 1, comma_pos - 1));
            SET remaining_str = SUBSTRING(remaining_str, comma_pos + 1);
ELSE
            SET perm_value = TRIM(remaining_str);
            SET remaining_str = '';
END IF;

        IF perm_value REGEXP '^[0-9]+$' = 0 THEN
            SET valid = FALSE;
            SET error_msg = CONCAT('Invalid permission level format: ', perm_value);
ELSE
            IF NOT EXISTS (SELECT 1 FROM available_permissions WHERE permission_id = CAST(perm_value AS UNSIGNED)) THEN
                SET valid = FALSE;
                SET error_msg = CONCAT('Permission level not found: ', perm_value);
END IF;
END IF;
END WHILE;

    IF valid = FALSE THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = error_msg;
END IF;
END
$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `validate_permission_level_before_update` BEFORE UPDATE ON `admin_users` FOR EACH ROW BEGIN
    DECLARE valid BOOLEAN DEFAULT TRUE;
    DECLARE perm_value VARCHAR(10);
    DECLARE error_msg VARCHAR(255);
    DECLARE comma_pos INT;
    DECLARE remaining_str VARCHAR(255);

    IF NEW.permission_level = '' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Permission level cannot be empty';
END IF;

SET remaining_str = NEW.permission_level;

    WHILE LENGTH(remaining_str) > 0 AND valid = TRUE DO
        SET comma_pos = LOCATE(',', remaining_str);

        IF comma_pos > 0 THEN
            SET perm_value = TRIM(SUBSTRING(remaining_str, 1, comma_pos - 1));
            SET remaining_str = SUBSTRING(remaining_str, comma_pos + 1);
ELSE
            SET perm_value = TRIM(remaining_str);
            SET remaining_str = '';
END IF;

        IF perm_value REGEXP '^[0-9]+$' = 0 THEN
            SET valid = FALSE;
            SET error_msg = CONCAT('Invalid permission level format: ', perm_value);
ELSE
            IF NOT EXISTS (SELECT 1 FROM available_permissions WHERE permission_id = CAST(perm_value AS UNSIGNED)) THEN
                SET valid = FALSE;
                SET error_msg = CONCAT('Permission level not found: ', perm_value);
END IF;
END IF;
END WHILE;

    IF valid = FALSE THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = error_msg;
END IF;
END
$$

DELIMITER ;

CREATE TABLE `available_permissions` (
                                         `permission_id` int(11) NOT NULL,
                                         `permission_name` varchar(100) NOT NULL,
                                         `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bookings` (
                            `booking_id` int(11) NOT NULL,
                            `auth_id` int(11) NOT NULL,
                            `booking_date` date DEFAULT NULL,
                            `booking_time` time DEFAULT NULL,
                            `status` enum('Pending','Confirmed','Cancelled','Completed') DEFAULT 'Confirmed',
                            `notes` text DEFAULT NULL,
                            `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
                            `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `booking_auth_credentials` (
                                            `auth_id` int(11) NOT NULL,
                                            `username` varchar(50) NOT NULL,
                                            `password_hash` varchar(255) NOT NULL,
                                            `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
                                            `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DELIMITER $$
CREATE TRIGGER `hash_password_before_update_for_bookings` BEFORE UPDATE ON `booking_auth_credentials` FOR EACH ROW BEGIN
    IF NEW.password_hash != OLD.password_hash THEN
        SET NEW.password_hash = SHA2(NEW.password_hash, 256);
END IF;
END
$$

DELIMITER ;

CREATE TABLE `booking_extras` (
                                  `extra_id` int(11) NOT NULL,
                                  `booking_id` int(11) NOT NULL,
                                  `cd_count` int(11) DEFAULT 0,
                                  `additional_attendees` int(11) DEFAULT 0,
                                  `payment_status` enum('Not Signed Up','Signed Up pending payment','Confirmed') DEFAULT 'Not Signed Up',
                                  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
                                  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `booking_parents` (
                                   `parent_id` int(11) NOT NULL,
                                   `name` varchar(100) NOT NULL,
                                   `email` varchar(100) DEFAULT NULL,
                                   `phone_number` varchar(20) DEFAULT NULL,
                                   `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
                                   `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `booking_parents_linker` (
                                          `booking_id` int(11) NOT NULL,
                                          `parent_id` int(11) NOT NULL,
                                          `is_primary` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `booking_sessions` (
                                    `id` text NOT NULL,
                                    `username` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `booking_students` (
                                    `student_id` int(11) NOT NULL,
                                    `name` varchar(100) NOT NULL,
                                    `school_division` enum('IGCSE','American','National','Kindergarten') NOT NULL,
                                    `grade` varchar(20) NOT NULL,
                                    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
                                    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `booking_students_linker` (
                                           `booking_id` int(11) NOT NULL,
                                           `student_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `booking_students_linker` VALUES(1, 38);
INSERT INTO `booking_students_linker` VALUES(1, 39);
INSERT INTO `booking_students_linker` VALUES(2, 40);
INSERT INTO `booking_students_linker` VALUES(5, 43);
INSERT INTO `booking_students_linker` VALUES(5, 44);

CREATE TABLE `job_applications` (
                                    `id` int(11) NOT NULL COMMENT 'ID',
                                    `application_time` date DEFAULT current_timestamp() COMMENT 'Application Time',
                                    `first_name` text DEFAULT NULL COMMENT 'First Name',
                                    `last_name` text DEFAULT NULL COMMENT 'Last Name',
                                    `date_of_birth` date DEFAULT NULL COMMENT 'Date of Birth',
                                    `email` text DEFAULT NULL COMMENT 'Email',
                                    `phone_number` text DEFAULT NULL COMMENT 'Phone Number',
                                    `gender` text DEFAULT NULL COMMENT 'Gender',
                                    `address_street` text DEFAULT NULL COMMENT 'Address Street',
                                    `address_district` text DEFAULT NULL COMMENT 'Address District',
                                    `address_district_other` text DEFAULT NULL COMMENT 'Address District: Other',
                                    `position_applying_for` text DEFAULT NULL COMMENT 'Position Applying For',
                                    `position_applying_for_other` text DEFAULT NULL COMMENT 'Position Applying For: Other',
                                    `position_applying_for_specialty` text DEFAULT NULL COMMENT 'Position Applying For Speciality',
                                    `high_school_name` text DEFAULT NULL COMMENT 'High School Name',
                                    `high_school_system` text DEFAULT NULL COMMENT 'High School System',
                                    `high_school_system_other` text DEFAULT NULL COMMENT 'High School System: Other',
                                    `high_school_graduation_date` date DEFAULT NULL COMMENT 'High School Graduation Date',
                                    `instituion_name` text DEFAULT NULL COMMENT 'Institution/University Name',
                                    `institution_major` text DEFAULT NULL COMMENT 'Institution/University Major',
                                    `institution_graduation_date` date DEFAULT NULL COMMENT 'Institution/University Graduation Date',
                                    `years_of_experience` text DEFAULT NULL COMMENT 'Years of Experience',
                                    `experience_details` text DEFAULT NULL COMMENT 'Experience Details',
                                    `skills_or_hobbies` text DEFAULT NULL COMMENT 'Skills or Hobbies',
                                    `other_details` text DEFAULT NULL COMMENT 'Other Details',
                                    `refrence_name` text DEFAULT NULL COMMENT 'Reference Name',
                                    `refrence_position` text DEFAULT NULL COMMENT 'Reference Position',
                                    `reference_email` text DEFAULT NULL COMMENT 'Reference Email',
                                    `reference_phone_number` text DEFAULT NULL COMMENT 'Reference Phone Number',
                                    `personal_photo_link` text DEFAULT NULL COMMENT 'Personal Photo Link',
                                    `cv_link` text DEFAULT NULL COMMENT 'CV Link',
                                    `cover_letter_link` text DEFAULT NULL COMMENT 'Cover Letter Link',
                                    `other_documents_link_first` text DEFAULT NULL COMMENT 'Other Documents Link: 1',
                                    `other_documents_link_second` text DEFAULT NULL COMMENT 'Other Documents Link: 2',
                                    `other_documents_link_third` text DEFAULT NULL COMMENT 'Other Documents Link: 3'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DELIMITER $$
CREATE TRIGGER `insert_cover_letter_url` BEFORE INSERT ON `job_applications` FOR EACH ROW BEGIN
    IF NEW.cover_letter_link IS NOT NULL AND NEW.cover_letter_link != '' THEN
      SET NEW.cover_letter_link = CONCAT('https://harvestschools.com/fileUploads/', NEW.cover_letter_link);
END IF;
END
$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `insert_cv_url` BEFORE INSERT ON `job_applications` FOR EACH ROW BEGIN
    IF NEW.cv_link IS NOT NULL AND NEW.cv_link != '' THEN
      SET NEW.cv_link = CONCAT('https://harvestschools.com/fileUploads/', NEW.cv_link);
END IF;
END
$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `insert_other_documents_first_url` BEFORE INSERT ON `job_applications` FOR EACH ROW BEGIN
    IF NEW.other_documents_link_first IS NOT NULL AND NEW.other_documents_link_first != '' THEN
      SET NEW.other_documents_link_first = CONCAT('https://harvestschools.com/fileUploads/', NEW.other_documents_link_first);
END IF;
END
$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `insert_other_documents_second_url` BEFORE INSERT ON `job_applications` FOR EACH ROW BEGIN
    IF NEW.other_documents_link_second IS NOT NULL AND NEW.other_documents_link_second != '' THEN
  		SET NEW.other_documents_link_second = CONCAT('https://harvestschools.com/fileUploads/', NEW.other_documents_link_second);
END IF;
END
$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `insert_other_documents_third_url` BEFORE INSERT ON `job_applications` FOR EACH ROW BEGIN
    IF NEW.other_documents_link_third IS NOT NULL AND NEW.other_documents_link_third != '' THEN
  		SET NEW.other_documents_link_third = CONCAT('https://harvestschools.com/fileUploads/', NEW.other_documents_link_third);
END IF;
END
$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `insert_personal_photo_url` BEFORE INSERT ON `job_applications` FOR EACH ROW BEGIN
    IF NEW.personal_photo_link IS NOT NULL AND NEW.personal_photo_link != '' THEN
  		SET NEW.personal_photo_link = CONCAT('https://harvestschools.com/fileUploads/', NEW.personal_photo_link);
END IF;
END
$$

DELIMITER ;

ALTER TABLE `admin_sessions`
    ADD KEY `fk_admin_username_from_admin_sessions` (`username`);

ALTER TABLE `admin_users`
    ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

ALTER TABLE `available_permissions`
    ADD PRIMARY KEY (`permission_id`);

ALTER TABLE `bookings`
    ADD PRIMARY KEY (`booking_id`),
  ADD KEY `fk_auth_credentials` (`auth_id`);

ALTER TABLE `booking_auth_credentials`
    ADD PRIMARY KEY (`auth_id`),
  ADD UNIQUE KEY `username` (`username`);

ALTER TABLE `booking_extras`
    ADD PRIMARY KEY (`extra_id`),
  ADD KEY `fk_booking_extras` (`booking_id`);

ALTER TABLE `booking_parents`
    ADD PRIMARY KEY (`parent_id`),
  ADD UNIQUE KEY `unique parent` (`name`,`email`,`phone_number`) USING BTREE;

ALTER TABLE `booking_parents_linker`
    ADD PRIMARY KEY (`booking_id`,`parent_id`),
  ADD KEY `parent_id` (`parent_id`);

ALTER TABLE `booking_sessions`
    ADD KEY `fk_booking_username_from_booking_sessions` (`username`);

ALTER TABLE `booking_students`
    ADD PRIMARY KEY (`student_id`),
  ADD UNIQUE KEY `unique student` (`name`,`school_division`,`grade`) USING BTREE;

ALTER TABLE `booking_students_linker`
    ADD PRIMARY KEY (`booking_id`,`student_id`),
  ADD KEY `student_id` (`student_id`);

ALTER TABLE `job_applications`
    ADD PRIMARY KEY (`id`);

ALTER TABLE `admin_users`
    MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

ALTER TABLE `bookings`
    MODIFY `booking_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

ALTER TABLE `booking_auth_credentials`
    MODIFY `auth_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

ALTER TABLE `booking_extras`
    MODIFY `extra_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

ALTER TABLE `booking_parents`
    MODIFY `parent_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

ALTER TABLE `booking_students`
    MODIFY `student_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

ALTER TABLE `job_applications`
    MODIFY `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'ID', AUTO_INCREMENT=124;

ALTER TABLE `admin_sessions`
    ADD CONSTRAINT `fk_admin_username_from_admin_sessions` FOREIGN KEY (`username`) REFERENCES `admin_users` (`username`) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE `booking_sessions`
    ADD CONSTRAINT `fk_booking_username_from_booking_sessions` FOREIGN KEY (`username`) REFERENCES `booking_auth_credentials` (`username`) ON DELETE NO ACTION ON UPDATE NO ACTION;
