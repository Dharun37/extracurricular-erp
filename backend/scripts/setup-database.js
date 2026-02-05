/**
 * Database Setup Script
 * 
 * This script creates the database tables and inserts sample data
 * Run this after configuring your .env file
 * 
 * Usage: node scripts/setup-database.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🔌 Connecting to MySQL...');
    
    // Connect to MySQL database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'erp_extracurricular',
      multipleStatements: true
    });

    console.log('✅ Connected successfully\n');

    // Read SQL file
    const schemaPath = path.join(__dirname, '..', 'config', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('📝 Running database schema...');
    
    // Ensure we're using the correct database
    await connection.query(`USE \`${process.env.DB_NAME || 'erp_extracurricular'}\``);
    console.log(`✓ Selected database: ${process.env.DB_NAME || 'erp_extracurricular'}`);
    
    // Remove comments and split by semicolon
    const cleanedSql = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))  // Remove comment lines
      .join('\n');
    
    const statements = cleanedSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📝 Executing ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await connection.query(statement);
        console.log(`   ✓ Statement ${i + 1}/${statements.length} executed`);
      } catch (err) {
        console.error(`   ✗ Error in statement ${i + 1}:`, err.message);
        throw err;
      }
    }
    
    console.log('✅ Database schema created successfully\n');

    // Verify tables
    const dbName = process.env.DB_NAME || 'erp_extracurricular';
    const [tables] = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ?
      ORDER BY table_name
    `, [dbName]);

    console.log('📊 Tables created:');
    if (tables.length > 0) {
      tables.forEach(row => {
        console.log(`   - ${row.table_name || row.TABLE_NAME}`);
      });
    } else {
      console.log('   No tables found. Schema may not have executed properly.');
    }

    // Count sample data
    const [activityCount] = await connection.query('SELECT COUNT(*) as count FROM `activities`');
    const [enrollmentCount] = await connection.query('SELECT COUNT(*) as count FROM `activity_enrollments`');

    console.log('\n📈 Sample data inserted:');
    console.log(`   - ${activityCount[0].count} activities`);
    console.log(`   - ${enrollmentCount[0].count} enrollments`);

    console.log('\n🎉 Database setup completed successfully!');
    console.log('You can now start the server with: npm run dev\n');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('\n💡 Database does not exist. Please create it first:');
      console.error('   Run: npm run db:create\n');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Authentication failed. Please check:');
      console.error('   - DB_USER and DB_PASSWORD in .env file');
      console.error('   - MySQL user credentials\n');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Cannot connect to MySQL. Please check:');
      console.error('   - MySQL is running');
      console.error('   - DB_HOST and DB_PORT in .env file\n');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run setup
setupDatabase();
