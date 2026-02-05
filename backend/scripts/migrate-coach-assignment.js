/**
 * Migration Script: Add coach_id field to activities table
 * 
 * This script:
 * 1. Adds coach_id column to activities table
 * 2. Migrates existing coach_name data to coach_id by matching names
 * 3. Keeps coach_name as a computed field via JOIN
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'erp_extracurricular',
  multipleStatements: true
};

async function migrateCoachAssignment() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to database\n');

    // Step 1: Check if coach_id column already exists
    console.log('🔍 Checking if coach_id column exists...');
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM activities LIKE 'coach_id'
    `);

    if (columns.length > 0) {
      console.log('ℹ️  coach_id column already exists. Checking if migration is needed...\n');
    } else {
      // Step 2: Add coach_id column
      console.log('➕ Adding coach_id column to activities table...');
      await connection.query(`
        ALTER TABLE activities 
        ADD COLUMN coach_id INT NULL AFTER category,
        ADD INDEX idx_coach_id (coach_id),
        ADD FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('✅ coach_id column added successfully\n');
    }

    // Step 3: Migrate existing coach_name data to coach_id
    console.log('🔄 Migrating coach names to coach IDs...');
    
    // Get all activities with coach_name
    const [activities] = await connection.query(`
      SELECT id, coach_name FROM activities WHERE coach_name IS NOT NULL AND coach_name != ''
    `);

    console.log(`📋 Found ${activities.length} activities with coach names to migrate\n`);

    let migratedCount = 0;
    let notFoundCount = 0;
    const notFoundCoaches = new Set();

    for (const activity of activities) {
      const coachName = activity.coach_name.trim();
      
      // Try to find matching user by parsing the name
      // Common formats: "Coach John Smith", "John Smith", "Mr. John Smith"
      const nameParts = coachName
        .replace(/^(Coach|Mr\.|Ms\.|Mrs\.|Dr\.)\s+/i, '') // Remove prefixes
        .split(' ');
      
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || firstName;

      // Try to find the user
      const [users] = await connection.query(`
        SELECT id, first_name, last_name 
        FROM users 
        WHERE role = 'teacher' 
        AND (
          CONCAT(first_name, ' ', last_name) LIKE ? 
          OR first_name LIKE ?
          OR last_name LIKE ?
        )
        LIMIT 1
      `, [`%${firstName}%${lastName}%`, `%${firstName}%`, `%${lastName}%`]);

      if (users.length > 0) {
        // Update activity with coach_id
        await connection.query(`
          UPDATE activities SET coach_id = ? WHERE id = ?
        `, [users[0].id, activity.id]);
        
        migratedCount++;
        console.log(`✓ Migrated: "${coachName}" → ${users[0].first_name} ${users[0].last_name} (ID: ${users[0].id})`);
      } else {
        notFoundCount++;
        notFoundCoaches.add(coachName);
        console.log(`⚠️  No match found for: "${coachName}" - Activity ID: ${activity.id}`);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successfully migrated: ${migratedCount}`);
    console.log(`   ⚠️  No match found: ${notFoundCount}`);
    
    if (notFoundCoaches.size > 0) {
      console.log('\n⚠️  Coaches not found in users table:');
      notFoundCoaches.forEach(name => console.log(`   - ${name}`));
      console.log('\n💡 Tip: You may need to:');
      console.log('   1. Create user accounts for these coaches in the users table');
      console.log('   2. Manually assign coach_id for affected activities');
    }

    // Step 4: Show statistics
    const [stats] = await connection.query(`
      SELECT 
        COUNT(*) as total_activities,
        SUM(CASE WHEN coach_id IS NOT NULL THEN 1 ELSE 0 END) as with_coach_id,
        SUM(CASE WHEN coach_id IS NULL THEN 1 ELSE 0 END) as without_coach_id
      FROM activities
    `);

    console.log('\n📈 Final Statistics:');
    console.log(`   Total activities: ${stats[0].total_activities}`);
    console.log(`   With coach assigned: ${stats[0].with_coach_id}`);
    console.log(`   Without coach assigned: ${stats[0].without_coach_id}`);

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Note: The coach_name field can now be removed from the schema');
    console.log('   as it will be computed via JOIN with users table.');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run migration
migrateCoachAssignment();
