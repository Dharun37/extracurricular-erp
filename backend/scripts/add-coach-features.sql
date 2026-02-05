-- Update database schema to support coach features and student registration status

-- Add status tracking to activity_enrollments table
ALTER TABLE activity_enrollments
ADD COLUMN IF NOT EXISTS performance_remarks TEXT AFTER notes;

-- Modify status column to support more states
-- Note: status now supports: active, approved, rejected, withdrawn, completed
-- No ALTER needed if using VARCHAR, just document the valid values

-- Create attendance table for tracking student attendance
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT NOT NULL,
    activity_id INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'present', -- present, absent, late, excused
    session_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    notes TEXT,
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    marked_by INT, -- Coach/Teacher ID who marked attendance
    FOREIGN KEY (enrollment_id) REFERENCES activity_enrollments(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    INDEX idx_enrollment (enrollment_id),
    INDEX idx_activity (activity_id),
    INDEX idx_session_date (session_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_enrollment_status ON activity_enrollments(status);

-- Update existing enrollments to have 'active' status by default (if they don't have a status)
UPDATE activity_enrollments 
SET status = 'active' 
WHERE status IS NULL OR status = '';
