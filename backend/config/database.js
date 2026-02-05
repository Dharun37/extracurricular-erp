/**
 * MySQL Database Configuration
 * 
 * This file sets up the MySQL connection pool
 * Integration note: When merging with main ERP, update connection settings
 * to use the main ERP's database configuration
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// MySQL connection pool configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'erp_extracurricular',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('✓ MySQL Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('✗ MySQL connection error:', err.message);
    console.error('Make sure MySQL is running and credentials are correct');
  });

/**
 * Execute a database query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
export const query = async (sql, params = []) => {
  try {
    const [rows, fields] = await pool.execute(sql, params);
    // For INSERT queries, rows will be a ResultSetHeader with insertId
    // For SELECT queries, rows will be an array of results
    return { rows };
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

/**
 * Get a connection from the pool for transactions
 * @returns {Promise} Database connection
 */
export const getClient = async () => {
  const connection = await pool.getConnection();
  
  // Wrap connection to match pg interface
  return {
    query: async (sql, params = []) => {
      const [rows] = await connection.execute(sql, params);
      return { rows };
    },
    release: () => connection.release(),
    beginTransaction: () => connection.beginTransaction(),
    commit: () => connection.commit(),
    rollback: () => connection.rollback()
  };
};

export default pool;
