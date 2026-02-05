-- =====================================================
-- ENHANCED EXTRACURRICULAR ACTIVITIES MODULE SCHEMA
-- Professional ERP System for Educational Institutions
-- =====================================================

-- Use the existing database
USE `ERP`;

-- =====================================================
-- 1. CORE ENTITIES
-- =====================================================

-- Enhanced Activities Table (extends existing)
ALTER TABLE activities 
ADD COLUMN type ENUM('sports', 'music', 'dance', 'art', 'drama', 'technology', 'academics', 'other') DEFAULT 'other',
ADD COLUMN fee DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN quota INT NOT NULL DEFAULT 30,
ADD COLUMN min_age INT DEFAULT 5,
ADD COLUMN max_age INT DEFAULT 18,
ADD COLUMN min_grade INT DEFAULT 1,
ADD COLUMN max_grade INT DEFAULT 12,
ADD COLUMN status ENUM('active', 'inactive', 'cancelled') DEFAULT 'active',
ADD COLUMN registration_start DATETIME,
ADD COLUMN registration_end DATETIME,
ADD COLUMN term_start_date DATE,
ADD COLUMN term_end_date DATE,
ADD INDEX idx_status (status),
ADD INDEX idx_type (type),
ADD INDEX idx_registration_dates (registration_start, registration_end);

-- Venues Table (for conflict detection)
CREATE TABLE IF NOT EXISTS venues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) DEFAULT 'classroom',
    capacity INT DEFAULT 30,
    location VARCHAR(255),
    facilities TEXT,
    status ENUM('available', 'maintenance', 'unavailable') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Instructors Table
CREATE TABLE IF NOT EXISTS instructors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    specialization VARCHAR(255),
    qualifications TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. SCHEDULING SYSTEM
-- =====================================================

-- Schedules Table (with recurring logic)
CREATE TABLE IF NOT EXISTS activity_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activity_id INT NOT NULL,
    venue_id INT,
    instructor_id INT,
    day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    session_duration INT DEFAULT 60,
    recurrence_pattern VARCHAR(50) DEFAULT 'weekly',
    effective_from DATE NOT NULL,
    effective_until DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL,
    FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL,
    INDEX idx_activity (activity_id),
    INDEX idx_venue (venue_id),
    INDEX idx_instructor (instructor_id),
    INDEX idx_time_slot (day_of_week, start_time, end_time),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Session Instances (actual classes)
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL,
    activity_id INT NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue_id INT,
    instructor_id INT,
    status ENUM('scheduled', 'ongoing', 'completed', 'cancelled') DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES activity_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL,
    FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL,
    UNIQUE KEY unique_session (activity_id, session_date, start_time),
    INDEX idx_date (session_date),
    INDEX idx_status (status),
    INDEX idx_activity (activity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. ENROLLMENT SYSTEM
-- =====================================================

-- Enhanced Enrollments Table
ALTER TABLE activity_enrollments
ADD COLUMN grade_level INT,
ADD COLUMN priority INT DEFAULT 0,
ADD COLUMN enrolled_by INT,
ADD COLUMN payment_status ENUM('pending', 'paid', 'partial', 'waived') DEFAULT 'pending',
ADD COLUMN payment_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN cancelled_at TIMESTAMP NULL,
ADD COLUMN cancellation_reason TEXT,
ADD INDEX idx_status_priority (status, priority),
ADD INDEX idx_payment (payment_status),
ADD INDEX idx_enrolled_by (enrolled_by);

-- Waitlist Table
CREATE TABLE IF NOT EXISTS activity_waitlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    activity_id INT NOT NULL,
    grade_level INT,
    priority INT DEFAULT 0,
    position INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notified_at TIMESTAMP NULL,
    promoted_at TIMESTAMP NULL,
    status ENUM('waiting', 'notified', 'promoted', 'expired', 'cancelled') DEFAULT 'waiting',
    notes TEXT,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    UNIQUE KEY unique_waitlist (student_id, activity_id),
    INDEX idx_activity_position (activity_id, position),
    INDEX idx_status (status),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enrollment Conflicts Log
CREATE TABLE IF NOT EXISTS enrollment_conflicts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    attempted_activity_id INT NOT NULL,
    conflicting_activity_id INT,
    conflicting_schedule_id INT,
    conflict_type ENUM('time_overlap', 'venue_conflict', 'age_restriction', 'grade_restriction', 'quota_full') NOT NULL,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE,
    resolution_notes TEXT,
    INDEX idx_student (student_id),
    INDEX idx_conflict_type (conflict_type),
    INDEX idx_resolved (resolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. ATTENDANCE TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    student_id INT NOT NULL,
    enrollment_id INT NOT NULL,
    status ENUM('present', 'absent', 'late', 'excused') DEFAULT 'absent',
    check_in_time TIMESTAMP NULL,
    check_out_time TIMESTAMP NULL,
    remarks TEXT,
    marked_by INT,
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (enrollment_id) REFERENCES activity_enrollments(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (session_id, student_id),
    INDEX idx_student (student_id),
    INDEX idx_status (status),
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. EVALUATION & PROGRESS TRACKING
-- =====================================================

-- Skill Badges
CREATE TABLE IF NOT EXISTS skill_badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    icon_url VARCHAR(500),
    points INT DEFAULT 0,
    requirements TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student Evaluations
CREATE TABLE IF NOT EXISTS student_evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT NOT NULL,
    student_id INT NOT NULL,
    activity_id INT NOT NULL,
    evaluator_id INT NOT NULL,
    evaluation_date DATE NOT NULL,
    term VARCHAR(50),
    overall_rating DECIMAL(3,2),
    skill_ratings JSON,
    strengths TEXT,
    areas_for_improvement TEXT,
    coach_notes TEXT,
    parent_feedback TEXT,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (enrollment_id) REFERENCES activity_enrollments(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluator_id) REFERENCES instructors(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_activity (activity_id),
    INDEX idx_status (status),
    INDEX idx_term (term)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Badge Achievements
CREATE TABLE IF NOT EXISTS student_badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    badge_id INT NOT NULL,
    enrollment_id INT,
    awarded_by INT NOT NULL,
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (badge_id) REFERENCES skill_badges(id) ON DELETE CASCADE,
    FOREIGN KEY (enrollment_id) REFERENCES activity_enrollments(id) ON DELETE SET NULL,
    UNIQUE KEY unique_badge_student (student_id, badge_id),
    INDEX idx_student (student_id),
    INDEX idx_awarded_at (awarded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. RBAC & AUDIT
-- =====================================================

-- User Roles
CREATE TABLE IF NOT EXISTS user_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role ENUM('admin', 'coach', 'student', 'parent', 'staff') NOT NULL,
    entity_id INT,
    entity_type VARCHAR(50),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by INT,
    expires_at TIMESTAMP NULL,
    UNIQUE KEY unique_user_role (user_id, role, entity_id),
    INDEX idx_user_role (user_id, role),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INT,
    old_value JSON,
    new_value JSON,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample venues
INSERT INTO venues (name, type, capacity, location, status) VALUES
('Main Gymnasium', 'sports', 50, 'Building A, Ground Floor', 'available'),
('Music Room 1', 'music', 20, 'Building B, 2nd Floor', 'available'),
('Art Studio', 'art', 25, 'Building C, 1st Floor', 'available'),
('Dance Studio', 'dance', 30, 'Building A, 3rd Floor', 'available'),
('Computer Lab 1', 'technology', 30, 'Building D, 2nd Floor', 'available'),
('Auditorium', 'drama', 100, 'Building E, Ground Floor', 'available'),
('Swimming Pool', 'sports', 40, 'Sports Complex', 'available')
ON DUPLICATE KEY UPDATE name=name;

-- Insert sample instructors
INSERT INTO instructors (name, email, phone, specialization, status) VALUES
('Coach John Smith', 'john.smith@school.edu', '+1-555-0101', 'Football & Athletics', 'active'),
('Ms. Sarah Davis', 'sarah.davis@school.edu', '+1-555-0102', 'Basketball', 'active'),
('Mr. Michael Brown', 'michael.brown@school.edu', '+1-555-0103', 'Music - Guitar', 'active'),
('Ms. Priya Sharma', 'priya.sharma@school.edu', '+1-555-0104', 'Classical Dance', 'active'),
('Ms. Emily White', 'emily.white@school.edu', '+1-555-0105', 'Visual Arts', 'active'),
('Mr. David Wilson', 'david.wilson@school.edu', '+1-555-0106', 'Drama & Theatre', 'active'),
('Dr. James Anderson', 'james.anderson@school.edu', '+1-555-0107', 'Robotics & STEM', 'active')
ON DUPLICATE KEY UPDATE name=name;

-- Insert sample skill badges
INSERT INTO skill_badges (name, description, category, points) VALUES
('Team Player', 'Shows excellent teamwork and collaboration', 'sports', 10),
('Leadership', 'Demonstrates leadership qualities', 'general', 15),
('Perfect Attendance', 'Attended all sessions in the term', 'general', 20),
('Quick Learner', 'Masters new skills rapidly', 'general', 10),
('Creative Thinker', 'Shows exceptional creativity', 'arts', 15),
('Technical Expert', 'Advanced technical skills', 'technology', 20),
('Stage Performer', 'Confident in public performances', 'performing_arts', 15)
ON DUPLICATE KEY UPDATE name=name;

-- =====================================================
-- STORED PROCEDURES & FUNCTIONS
-- =====================================================

DELIMITER //

-- Function to check time slot conflicts
CREATE FUNCTION IF NOT EXISTS check_time_overlap(
    p_day VARCHAR(20),
    p_start_time TIME,
    p_end_time TIME,
    p_student_id INT,
    p_exclude_activity_id INT
) RETURNS BOOLEAN
READS SQL DATA
BEGIN
    DECLARE conflict_count INT;
    
    SELECT COUNT(*) INTO conflict_count
    FROM activity_enrollments ae
    JOIN activity_schedules asch ON ae.activity_id = asch.activity_id
    WHERE ae.student_id = p_student_id
    AND ae.status = 'active'
    AND ae.activity_id != p_exclude_activity_id
    AND asch.day_of_week = p_day
    AND asch.is_active = TRUE
    AND (
        (p_start_time >= asch.start_time AND p_start_time < asch.end_time)
        OR (p_end_time > asch.start_time AND p_end_time <= asch.end_time)
        OR (p_start_time <= asch.start_time AND p_end_time >= asch.end_time)
    );
    
    RETURN conflict_count > 0;
END//

DELIMITER ;
