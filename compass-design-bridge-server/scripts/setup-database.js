const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  });

  try {
    const dbName = process.env.DB_NAME || 'compass_db';
    await pool.query(`CREATE DATABASE ${dbName}`);
    console.log(`Database ${dbName} created successfully`);
  } catch (error) {
    if (error.code === '42P04') {
      console.log('Database already exists');
    } else {
      console.error('Error creating database:', error);
    }
  }

  await pool.end();

  const appPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'compass_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  });

  try {
    const migrationPath = path.join(__dirname, '../src/database/migrations/001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await appPool.query(migrationSQL);
    console.log('Database schema created successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
  }

  await appPool.end();
}

setupDatabase().catch(console.error);
