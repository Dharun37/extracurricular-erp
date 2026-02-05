/**
 * Remove Duplicate Records Script
 * 
 * Checks for and removes duplicate activities in the database
 */

import { query } from '../config/database.js';

async function removeDuplicates() {
  console.log('🔍 Checking for duplicate records...\n');

  try {
    // 1. Check for duplicate activities (same name, coach, schedule)
    console.log('📋 Checking for duplicate activities...');
    const duplicateActivities = await query(`
      SELECT name, coach_name, schedule, COUNT(*) as count, GROUP_CONCAT(id) as ids
      FROM activities
      GROUP BY name, coach_name, schedule
      HAVING COUNT(*) > 1
    `);

    if (duplicateActivities.rows && duplicateActivities.rows.length > 0) {
      console.log(`⚠️  Found ${duplicateActivities.rows.length} duplicate activity groups:\n`);
      
      for (const dup of duplicateActivities.rows) {
        const ids = dup.ids.split(',');
        console.log(`   Activity: "${dup.name}" by ${dup.coach_name}`);
        console.log(`   - Count: ${dup.count}`);
        console.log(`   - IDs: ${dup.ids}`);
        
        // Keep the first ID, delete the rest
        const keepId = ids[0];
        const deleteIds = ids.slice(1);
        
        console.log(`   - Keeping ID: ${keepId}`);
        console.log(`   - Deleting IDs: ${deleteIds.join(', ')}`);
        
        // Delete duplicate activities
        await query(`DELETE FROM activities WHERE id IN (${deleteIds.join(',')})`);
        console.log(`   ✅ Deleted ${deleteIds.length} duplicate(s)\n`);
      }
    } else {
      console.log('✅ No duplicate activities found\n');
    }

    // 2. Check for duplicate enrollments (same student_id, activity_id)
    console.log('📋 Checking for duplicate enrollments...');
    const duplicateEnrollments = await query(`
      SELECT student_id, activity_id, COUNT(*) as count, GROUP_CONCAT(id) as ids
      FROM activity_enrollments
      GROUP BY student_id, activity_id
      HAVING COUNT(*) > 1
    `);

    if (duplicateEnrollments.rows && duplicateEnrollments.rows.length > 0) {
      console.log(`⚠️  Found ${duplicateEnrollments.rows.length} duplicate enrollment groups:\n`);
      
      for (const dup of duplicateEnrollments.rows) {
        const ids = dup.ids.split(',');
        console.log(`   Student ${dup.student_id} in Activity ${dup.activity_id}`);
        console.log(`   - Count: ${dup.count}`);
        console.log(`   - IDs: ${dup.ids}`);
        
        // Keep the first ID, delete the rest
        const keepId = ids[0];
        const deleteIds = ids.slice(1);
        
        console.log(`   - Keeping ID: ${keepId}`);
        console.log(`   - Deleting IDs: ${deleteIds.join(', ')}`);
        
        // Delete duplicate enrollments
        await query(`DELETE FROM activity_enrollments WHERE id IN (${deleteIds.join(',')})`);
        console.log(`   ✅ Deleted ${deleteIds.length} duplicate(s)\n`);
      }
    } else {
      console.log('✅ No duplicate enrollments found\n');
    }

    // 3. Show final counts
    const activityCount = await query('SELECT COUNT(*) as count FROM activities');
    const enrollmentCount = await query('SELECT COUNT(*) as count FROM activity_enrollments');

    console.log('='.repeat(50));
    console.log('✨ Duplicate cleanup completed!\n');
    console.log('📊 Current database state:');
    console.log(`   - Activities: ${activityCount.rows[0].count}`);
    console.log(`   - Enrollments: ${enrollmentCount.rows[0].count}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error removing duplicates:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the cleanup
removeDuplicates();
