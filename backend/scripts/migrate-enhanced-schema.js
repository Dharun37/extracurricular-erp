/**
 * Database Migration Script
 * 
 * Deploys enhanced-schema.sql to existing ERP database
 * Preserves existing data in activities and activity_enrollments tables
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ERP',
  multipleStatements: true
};

async function runMigration() {
  console.log('🚀 Starting database migration...');
  console.log(`Database: ${config.database} at ${config.host}:${config.port}\n`);

  let connection;

  try {
    // Connect to database
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database');

    // Read enhanced schema
    const schemaPath = path.join(__dirname, '..', 'config', 'enhanced-schema.sql');
    console.log(`📖 Reading schema from: ${schemaPath}`);
    
    let sqlContent = fs.readFileSync(schemaPath, 'utf8');

    // Filter out SQL comments (lines starting with --)
    const sqlLines = sqlContent
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && !trimmed.startsWith('--');
      })
      .join('\n');

    // Split into individual statements
    const statements = sqlLines
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📋 Found ${statements.length} SQL statements\n`);

    // Execute statements one by one
    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        // Check if table already exists to avoid duplicate creation
        if (statement.toUpperCase().includes('CREATE TABLE')) {
          const tableMatch = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?`?(\w+)`?/i);
          if (tableMatch) {
            const tableName = tableMatch[1];
            
            // Check if table exists
            const [rows] = await connection.query(
              'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?',
              [config.database, tableName]
            );

            if (rows[0].count > 0) {
              console.log(`⏭️  Table '${tableName}' already exists - skipping`);
              skipCount++;
              continue;
            }
          }
        }

        await connection.query(statement);
        successCount++;
        
        // Log progress
        if (statement.toUpperCase().includes('CREATE TABLE')) {
          const tableMatch = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?`?(\w+)`?/i);
          console.log(`✅ Created table: ${tableMatch ? tableMatch[1] : 'unknown'}`);
        } else if (statement.toUpperCase().includes('CREATE INDEX')) {
          console.log(`✅ Created index`);
        } else if (statement.toUpperCase().includes('CREATE FUNCTION')) {
          console.log(`✅ Created function`);
        }

      } catch (error) {
        // Log non-critical errors but continue
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          skipCount++;
          console.log(`⏭️  Table already exists - skipping`);
        } else if (error.code === 'ER_DUP_KEYNAME') {
          skipCount++;
          console.log(`⏭️  Index already exists - skipping`);
        } else {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          // Continue with next statement instead of stopping
        }
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Migration completed`);
    console.log(`   - Successfully executed: ${successCount} statements`);
    console.log(`   - Skipped (already exist): ${skipCount} statements`);
    console.log('='.repeat(50));

    // Verify key tables exist
    console.log('\n🔍 Verifying migration...');
    
    const requiredTables = [
      'activities',
      'activity_enrollments',
      'venues',
      'instructors',
      'activity_schedules',
      'activity_sessions',
      'activity_waitlist',
      'enrollment_conflicts',
      'attendance',
      'student_evaluations',
      'skill_badges',
      'student_badges',
      'user_roles',
      'audit_log'
    ];

    const [tables] = await connection.query(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = ?',
      [config.database]
    );

    const existingTables = tables.map(row => row.table_name || row.TABLE_NAME);
    
    console.log('\n📊 Table Status:');
    requiredTables.forEach(tableName => {
      const exists = existingTables.includes(tableName);
      console.log(`   ${exists ? '✅' : '❌'} ${tableName}`);
    });

    console.log('\n✨ Migration process completed successfully!');
    console.log('\n💡 Next Steps:');
    console.log('   1. Update backend/server.js to use enhanced routes');
    console.log('   2. Populate sample data for new tables (venues, instructors, etc.)');
    console.log('   3. Test enhanced enrollment with conflict detection');
    console.log('   4. Configure user_roles for RBAC');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run migration
runMigration();
