const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'compass_design',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function initializeDatabase() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    // Read and execute the Figma database initialization script
    const sqlScript = fs.readFileSync(path.join(__dirname, 'scripts/init-figma-db.sql'), 'utf8');
    
    console.log('Executing database initialization script...');
    await client.query(sqlScript);
    
    console.log('Database initialized successfully!');
    
    client.release();
    await pool.end();
  } catch (error) {
    console.error('Error initializing database:', error);
    if (error.code === 'ECONNREFUSED') {
      console.log('PostgreSQL database is not running. Please start PostgreSQL and try again.');
    }
    process.exit(1);
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };