/**
 * Setup User Tables Script
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function setupUsers() {
  let connection;
  
  try {
    console.log('Connecting to MySQL...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'erp_extracurricular',
      multipleStatements: true
    });

    console.log('Connected successfully\n');

    // Create users table
    console.log('Creating users table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        role ENUM('student', 'teacher', 'admin', 'parent') NOT NULL DEFAULT 'student',
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        profile_image VARCHAR(500),
        date_of_birth DATE,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_role (role),
        INDEX idx_status (status),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   Users table created');

    // Create students table
    console.log('Creating students table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        student_code VARCHAR(50) UNIQUE,
        grade INT,
        section VARCHAR(10),
        admission_date DATE,
        parent_id INT,
        emergency_contact VARCHAR(20),
        medical_notes TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user (user_id),
        INDEX idx_grade (grade)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   Students table created');

    // Create teachers table
    console.log('Creating teachers table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS teachers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        employee_code VARCHAR(50) UNIQUE,
        department VARCHAR(100),
        specialization VARCHAR(255),
        qualification TEXT,
        join_date DATE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   Teachers table created');

    // Insert sample users
    console.log('Inserting sample users...');
    await connection.query(`
      INSERT INTO users (id, email, first_name, last_name, phone, role, status, date_of_birth) VALUES
        (1, 'admin@school.edu', 'System', 'Admin', '555-0001', 'admin', 'active', '1980-01-15'),
        (2, 'john.smith@school.edu', 'John', 'Smith', '555-0101', 'teacher', 'active', '1985-03-20'),
        (3, 'sarah.johnson@school.edu', 'Sarah', 'Johnson', '555-0102', 'teacher', 'active', '1988-07-12'),
        (4, 'mike.davis@school.edu', 'Mike', 'Davis', '555-0103', 'teacher', 'active', '1982-11-08'),
        (5, 'emily.brown@school.edu', 'Emily', 'Brown', '555-0104', 'teacher', 'active', '1990-05-25'),
        (1001, 'alice.wilson@school.edu', 'Alice', 'Wilson', '555-1001', 'student', 'active', '2010-04-15'),
        (1002, 'bob.johnson@school.edu', 'Bob', 'Johnson', '555-1002', 'student', 'active', '2010-08-22'),
        (1003, 'charlie.brown@school.edu', 'Charlie', 'Brown', '555-1003', 'student', 'active', '2011-01-10'),
        (1004, 'diana.miller@school.edu', 'Diana', 'Miller', '555-1004', 'student', 'active', '2010-12-05'),
        (1005, 'evan.taylor@school.edu', 'Evan', 'Taylor', '555-1005', 'student', 'active', '2011-06-18'),
        (1006, 'fiona.anderson@school.edu', 'Fiona', 'Anderson', '555-1006', 'student', 'active', '2010-09-30'),
        (1007, 'george.thomas@school.edu', 'George', 'Thomas', '555-1007', 'student', 'active', '2011-03-14'),
        (1008, 'hannah.jackson@school.edu', 'Hannah', 'Jackson', '555-1008', 'student', 'active', '2010-07-07'),
        (1009, 'ian.white@school.edu', 'Ian', 'White', '555-1009', 'student', 'active', '2011-11-22'),
        (1010, 'julia.harris@school.edu', 'Julia', 'Harris', '555-1010', 'student', 'active', '2010-02-28')
      ON DUPLICATE KEY UPDATE email = VALUES(email)
    `);
    console.log('   Sample users inserted');

    // Insert sample students
    console.log('Inserting sample students...');
    await connection.query(`
      INSERT INTO students (user_id, student_code, grade, section, admission_date) VALUES
        (1001, 'STU-2024-001', 10, 'A', '2024-06-01'),
        (1002, 'STU-2024-002', 10, 'A', '2024-06-01'),
        (1003, 'STU-2024-003', 9, 'B', '2024-06-01'),
        (1004, 'STU-2024-004', 10, 'B', '2024-06-01'),
        (1005, 'STU-2024-005', 11, 'A', '2024-06-01'),
        (1006, 'STU-2024-006', 9, 'A', '2024-06-01'),
        (1007, 'STU-2024-007', 11, 'B', '2024-06-01'),
        (1008, 'STU-2024-008', 10, 'A', '2024-06-01'),
        (1009, 'STU-2024-009', 9, 'B', '2024-06-01'),
        (1010, 'STU-2024-010', 11, 'A', '2024-06-01')
      ON DUPLICATE KEY UPDATE student_code = VALUES(student_code)
    `);
    console.log('   Sample students inserted');

    // Insert sample teachers
    console.log('Inserting sample teachers...');
    await connection.query(`
      INSERT INTO teachers (user_id, employee_code, department, specialization, join_date) VALUES
        (2, 'EMP-001', 'Physical Education', 'Football, Athletics', '2015-08-01'),
        (3, 'EMP-002', 'Physical Education', 'Volleyball, Badminton, Yoga', '2018-01-15'),
        (4, 'EMP-003', 'Physical Education', 'Cricket, Track & Field', '2016-06-01'),
        (5, 'EMP-004', 'Arts & Academics', 'Photography, Creative Writing', '2020-03-01')
      ON DUPLICATE KEY UPDATE employee_code = VALUES(employee_code)
    `);
    console.log('   Sample teachers inserted');
    
    // Verify
    const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [studentCount] = await connection.query('SELECT COUNT(*) as count FROM students');
    const [teacherCount] = await connection.query('SELECT COUNT(*) as count FROM teachers');

    console.log('\nData Summary:');
    console.log(`   - Users: ${userCount[0].count}`);
    console.log(`   - Students: ${studentCount[0].count}`);
    console.log(`   - Teachers: ${teacherCount[0].count}`);
    console.log('\nUser setup completed!');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupUsers();
