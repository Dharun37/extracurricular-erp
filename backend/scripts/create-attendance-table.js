import pool from '../config/database.js';

async function createAttendanceTable() {
  try {
    // Drop existing table if it has wrong structure
    await pool.execute('DROP TABLE IF EXISTS attendance');
    
    // Create simple attendance table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        enrollment_id INT NOT NULL,
        student_id INT NOT NULL,
        activity_id INT NOT NULL,
        status ENUM('present', 'absent', 'late', 'excused') DEFAULT 'present',
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_enrollment (enrollment_id),
        INDEX idx_student (student_id),
        INDEX idx_activity (activity_id),
        INDEX idx_date (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('Attendance table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createAttendanceTable();
