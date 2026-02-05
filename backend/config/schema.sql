-- Extra-Curricular Activity Module Database Schema (MySQL)
-- Run this script to create the required tables

-- Table: activities
-- Stores information about extra-curricular activities
-- Note: Requires users table to exist first (for coach_id foreign key)
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- e.g., sports, music, dance, art, drama, technology
    coach_id INT NULL, -- Foreign key to users table (role='teacher')
    venue VARCHAR(255), -- e.g., "Sports Ground", "Music Room"
    schedule VARCHAR(255), -- e.g., "Mon/Wed 4-5 PM"
    description TEXT,
    max_students INT DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_coach_id (coach_id),
    FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: activity_enrollments
-- Stores student enrollments in activities
-- Note: student_id is a foreign key that will link to the main ERP's student table
CREATE TABLE IF NOT EXISTS activity_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL, -- Will be linked to main ERP student table later
    activity_id INT NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- active, withdrawn, completed
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (student_id, activity_id),
    INDEX idx_student (student_id),
    INDEX idx_activity (activity_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
-- Note: Requires users table with teacher IDs: 2 (John Smith), 3 (Sarah Johnson), 4 (Mike Davis), 5 (Emily Brown)
INSERT INTO activities (name, category, coach_id, venue, schedule, description, max_students) VALUES
    ('Football Training', 'sports', 2, 'Sports Ground A', 'Mon/Wed/Fri 4-6 PM', 'Basic football skills and team play', 25),
    ('Basketball Club', 'sports', 2, 'Indoor Court 1', 'Tue/Thu 4-5:30 PM', 'Basketball fundamentals and practice games', 20),
    ('Guitar Classes', 'music', NULL, 'Music Room 1', 'Wed 3-4 PM', 'Learn acoustic guitar from beginner to intermediate', 15),
    ('Classical Dance', 'dance', NULL, 'Dance Studio', 'Tue/Thu 5-6 PM', 'Learn classical dance forms', 20),
    ('Art & Painting', 'art', 5, 'Art Room', 'Fri 3-5 PM', 'Explore various art mediums and techniques', 15),
    ('Drama Club', 'drama', NULL, 'Auditorium', 'Mon/Wed 5-6:30 PM', 'Theatre, acting, and stage performance', 25),
    ('Chess Club', 'academics', 5, 'Library', 'Thu 4-5 PM', 'Strategic thinking and chess tournaments', 30),
    ('Robotics Club', 'technology', NULL, 'Lab 2', 'Sat 10-12 PM', 'Build and program robots', 12),
    ('Swimming', 'sports', 3, 'Swimming Pool', 'Mon/Wed/Fri 3-4 PM', 'Swimming lessons for all levels', 15),
    ('Debate Club', 'academics', 5, 'Conference Room', 'Fri 4-6 PM', 'Develop public speaking and critical thinking skills', 20),
    -- Activities for Coach Sarah Johnson (ID: 3)
    ('Volleyball Training', 'sports', 3, 'Indoor Court 2', 'Tue/Thu 5-6:30 PM', 'Indoor volleyball techniques and team strategies', 22),
    ('Badminton Club', 'sports', 3, 'Indoor Court 3', 'Mon/Wed 4-5 PM', 'Singles and doubles badminton training', 18),
    ('Yoga & Wellness', 'sports', 3, 'Yoga Studio', 'Sat 9-10 AM', 'Yoga postures, breathing, and meditation', 20),
    -- Activities for Coach Mike Davis (ID: 4)
    ('Cricket Academy', 'sports', 4, 'Cricket Ground', 'Wed/Fri 4-6 PM', 'Cricket batting, bowling, and fielding skills', 24),
    ('Track & Field', 'sports', 4, 'Athletics Track', 'Tue/Thu 3:30-5 PM', 'Running, jumping, and throwing events', 30),
    ('Table Tennis', 'sports', 4, 'Indoor Court 4', 'Mon/Wed 5-6 PM', 'Table tennis techniques and competition prep', 16),
    -- Activities for Coach Emily Brown (ID: 5)
    ('Photography Club', 'art', 5, 'Media Lab', 'Thu 4-6 PM', 'Digital photography and photo editing basics', 15),
    ('Creative Writing', 'academics', 5, 'Library', 'Tue 5-6:30 PM', 'Poetry, short stories, and creative expression', 20),
    ('Science Experiments', 'academics', 5, 'Science Lab', 'Fri 3-5 PM', 'Hands-on science experiments and projects', 18)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert sample enrollments
INSERT INTO activity_enrollments (activity_id, student_id, status, notes) VALUES
    (1, 1001, 'approved', 'Experienced player'),
    (1, 1002, 'active', 'Wants to join football'),
    (1, 1003, 'approved', 'New to the sport'),
    (2, 1001, 'approved', 'Good dribbling skills'),
    (2, 1004, 'active', 'Basketball enthusiast'),
    (11, 1005, 'approved', 'Volleyball experience'),
    (11, 1006, 'active', 'First time player'),
    (12, 1007, 'approved', 'Badminton player'),
    (14, 1008, 'approved', 'Cricket fan'),
    (14, 1009, 'active', 'Wants to learn bowling'),
    (15, 1010, 'approved', 'Good runner'),
    (17, 1011, 'approved', 'Photography hobby'),
    (17, 1012, 'active', 'DSLR owner'),
    (18, 1013, 'approved', 'Loves writing'),
    (19, 1014, 'approved', 'Science enthusiast')
ON DUPLICATE KEY UPDATE student_id=student_id;

