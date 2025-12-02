/**
 * Migration Runner
 * ================
 * Executes SQL migrations against the database.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'artisan_apparel',
  user: process.env.DB_USER || 'artisan_user',
  password: process.env.DB_PASSWORD,
});

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database migrations...\n');
    
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    
    // Get list of migration files
    const migrationsDir = path.join(__dirname);
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    // Get already executed migrations
    const executed = await client.query('SELECT filename FROM migrations');
    const executedFiles = new Set(executed.rows.map(r => r.filename));
    
    // Run pending migrations
    let migrationsRun = 0;
    
    for (const file of files) {
      if (executedFiles.has(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }
      
      console.log(`▶️  Running ${file}...`);
      
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      await client.query('BEGIN');
      
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        
        console.log(`✅ ${file} executed successfully\n`);
        migrationsRun++;
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`❌ ${file} failed: ${error.message}\n`);
        throw error;
      }
    }
    
    if (migrationsRun === 0) {
      console.log('\n✨ No new migrations to run. Database is up to date.\n');
    } else {
      console.log(`\n✨ Successfully ran ${migrationsRun} migration(s).\n`);
    }
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations
runMigrations();
