/**
 * Seed Enhanced Data
 * 
 * Populates new tables with sample data for testing
 */

import { query } from '../config/database.js';

async function seedData() {
  console.log('🌱 Starting data seeding...\n');

  try {
    // 1. Seed Venues
    console.log('📍 Seeding venues...');
    await query(`
      INSERT INTO venues (name, type, capacity, location, facilities, status) VALUES
      ('Main Gymnasium', 'sports', 100, 'Building A, Floor 1', 'Basketball court, volleyball net, bleachers. Equipment: Balls, cones, mats', 'available'),
      ('Auditorium', 'other', 300, 'Building B, Ground Floor', 'Stage, sound system, lighting. Equipment: Microphones, speakers', 'available'),
      ('Soccer Field', 'sports', 50, 'Behind Campus', 'Full-size field, goals, benches. Equipment: Soccer balls, cones', 'available'),
      ('Music Room', 'music', 30, 'Building C, Floor 2', 'Pianos, acoustic panels, storage. Equipment: Instruments, sheet music stands', 'available'),
      ('Art Studio', 'art', 25, 'Building C, Floor 3', 'Easels, sink, storage, natural lighting. Equipment: Paints, brushes, canvases', 'available')
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `);
    console.log('✅ Venues seeded\n');

    // 2. Seed Instructors
    console.log('👨‍🏫 Seeding instructors...');
    await query(`
      INSERT INTO instructors (name, email, phone, specialization, qualifications, status) VALUES
      ('Coach Mike Johnson', 'mike.johnson@school.edu', '555-0101', 'Basketball', 'Level 3 Basketball Coach Certification, 5 years experience', 'active'),
      ('Ms. Sarah Williams', 'sarah.williams@school.edu', '555-0102', 'Drama/Theater', 'MFA in Theater Arts, 8 years teaching experience', 'active'),
      ('Mr. David Chen', 'david.chen@school.edu', '555-0103', 'Soccer', 'UEFA B License, Former professional player', 'active'),
      ('Ms. Emily Taylor', 'emily.taylor@school.edu', '555-0104', 'Music/Piano', 'Master of Music Performance, Concert pianist', 'active'),
      ('Mr. Robert Martinez', 'robert.martinez@school.edu', '555-0105', 'Visual Arts', 'BFA Painting, MFA Sculpture, Exhibited artist', 'active')
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `);
    console.log('✅ Instructors seeded\n');

    // 3. Get activity and instructor IDs for schedules
    const activities = await query('SELECT id, name FROM activities ORDER BY id LIMIT 5');
    const instructors = await query('SELECT id FROM instructors LIMIT 5');
    const venues = await query('SELECT id FROM venues LIMIT 5');

    if (activities.rows.length === 0) {
      console.log('⚠️  No activities found. Please run db:setup first to create sample activities.\n');
      return;
    }

    // 4. Seed Activity Schedules
    console.log('📅 Seeding activity schedules...');
    
    const schedules = [
      // Basketball - Mon/Wed/Fri
      { activity_id: activities.rows[0]?.id, day: 'monday', start: '15:00:00', end: '17:00:00', venue_id: venues.rows[0]?.id, instructor_id: instructors.rows[0]?.id },
      { activity_id: activities.rows[0]?.id, day: 'wednesday', start: '15:00:00', end: '17:00:00', venue_id: venues.rows[0]?.id, instructor_id: instructors.rows[0]?.id },
      { activity_id: activities.rows[0]?.id, day: 'friday', start: '15:00:00', end: '17:00:00', venue_id: venues.rows[0]?.id, instructor_id: instructors.rows[0]?.id },
      
      // Drama Club - Tue/Thu
      { activity_id: activities.rows[1]?.id, day: 'tuesday', start: '16:00:00', end: '18:00:00', venue_id: venues.rows[1]?.id, instructor_id: instructors.rows[1]?.id },
      { activity_id: activities.rows[1]?.id, day: 'thursday', start: '16:00:00', end: '18:00:00', venue_id: venues.rows[1]?.id, instructor_id: instructors.rows[1]?.id },
      
      // Soccer - Mon/Wed
      { activity_id: activities.rows[2]?.id, day: 'monday', start: '16:00:00', end: '18:00:00', venue_id: venues.rows[2]?.id, instructor_id: instructors.rows[2]?.id },
      { activity_id: activities.rows[2]?.id, day: 'wednesday', start: '16:00:00', end: '18:00:00', venue_id: venues.rows[2]?.id, instructor_id: instructors.rows[2]?.id },
    ];

    for (const schedule of schedules) {
      if (schedule.activity_id && schedule.venue_id && schedule.instructor_id) {
        await query(`
          INSERT INTO activity_schedules 
          (activity_id, day_of_week, start_time, end_time, venue_id, instructor_id, effective_from, is_active)
          VALUES (?, ?, ?, ?, ?, ?, CURDATE(), TRUE)
          ON DUPLICATE KEY UPDATE start_time = VALUES(start_time)
        `, [schedule.activity_id, schedule.day, schedule.start, schedule.end, schedule.venue_id, schedule.instructor_id]);
      }
    }
    console.log('✅ Activity schedules seeded\n');

    // 5. Seed Skill Badges
    console.log('🏆 Seeding skill badges...');
    await query(`
      INSERT INTO skill_badges (name, description, category, requirements, icon_url, points) VALUES
      ('Rookie', 'Completed first 5 sessions', 'participation', 'Attend 5 sessions', '🌟', 10),
      ('Regular', 'Completed 15 sessions', 'participation', 'Attend 15 sessions', '⭐', 25),
      ('Champion', 'Completed 30 sessions', 'participation', 'Attend 30 sessions', '💫', 50),
      ('Team Player', 'Excellent teamwork', 'skill', 'Coach evaluation: Teamwork rating >= 4.5', '🤝', 20),
      ('Leader', 'Leadership demonstrated', 'skill', 'Coach evaluation: Leadership rating >= 4.5', '👑', 30),
      ('Perfect Attendance', 'No absences in term', 'achievement', 'Zero absences in term', '📅', 40)
      ON DUPLICATE KEY UPDATE name = VALUES(name)
    `);
    console.log('✅ Skill badges seeded\n');

    // 6. Seed User Roles (for testing RBAC)
    console.log('🔐 Seeding user roles...');
    await query(`
      INSERT INTO user_roles (user_id, role, granted_by) VALUES
      (1, 'admin', 1),
      (10, 'coach', 1),
      (11, 'coach', 1),
      (100, 'student', 1),
      (200, 'parent', 1)
      ON DUPLICATE KEY UPDATE role = VALUES(role)
    `);
    console.log('✅ User roles seeded\n');

    // 7. Update existing activities with enhanced fields
    console.log('📝 Updating activity metadata...');
    
    const activityUpdates = [
      { id: activities.rows[0]?.id, min_age: 12, max_age: 18, min_grade: 7, max_grade: 12, quota: 20, reg_start: '2026-06-01 00:00:00', reg_end: '2026-06-15 23:59:59' },
      { id: activities.rows[1]?.id, min_age: 13, max_age: 18, min_grade: 8, max_grade: 12, quota: 25, reg_start: '2026-06-01 00:00:00', reg_end: '2026-06-15 23:59:59' },
      { id: activities.rows[2]?.id, min_age: 12, max_age: 18, min_grade: 7, max_grade: 12, quota: 22, reg_start: '2026-06-01 00:00:00', reg_end: '2026-06-15 23:59:59' },
    ];

    for (const update of activityUpdates) {
      if (update.id) {
        await query(`
          UPDATE activities 
          SET min_age = ?, max_age = ?, min_grade = ?, max_grade = ?,
              quota = ?, registration_start = ?, registration_end = ?
          WHERE id = ?
        `, [update.min_age, update.max_age, update.min_grade, update.max_grade, 
            update.quota, update.reg_start, update.reg_end, update.id]);
      }
    }
    console.log('✅ Activities updated\n');

    // Summary
    console.log('='.repeat(50));
    console.log('✨ Seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log('   - 5 venues created');
    console.log('   - 5 instructors added');
    console.log('   - Activity schedules configured');
    console.log('   - 6 skill badges created');
    console.log('   - 5 user roles assigned');
    console.log('   - Activity metadata updated');
    console.log('='.repeat(50));

    console.log('\n💡 Next Steps:');
    console.log('   1. Test enhanced enrollment: POST /api/enhanced/enroll/register');
    console.log('   2. Try conflict detection with overlapping times');
    console.log('   3. Mark attendance: POST /api/enhanced/attendance/mark');
    console.log('   4. Create evaluations: POST /api/enhanced/evaluations');
    console.log('   5. Award badges: POST /api/enhanced/badges/award\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run seeding
seedData();
