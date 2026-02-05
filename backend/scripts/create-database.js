/**
 * Create Database Script
 * 
 * This script creates the MySQL database if it doesn't exist
 * Run this before setup-database.js
 * 
 * Usage: node scripts/create-database.js
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function createDatabase() {
  const dbName = process.env.DB_NAME || 'erp_extracurricular';
  let connection;
  
  try {
    console.log('🔌 Connecting to MySQL...');
    
    // Connect to MySQL without specifying a database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('✅ Connected successfully\n');

    // Create database if it doesn't exist
    console.log(`📝 Creating database '${dbName}'...`);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` 
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`✅ Database '${dbName}' created successfully (or already exists)`);

    console.log('\n🎯 Next step:');
    console.log('   Run: npm run db:setup\n');

  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
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

// Run
createDatabase();
