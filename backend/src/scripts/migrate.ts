import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface Migration {
  name: string;
  filename: string;
}

const migrations: Migration[] = [
  { name: '001_create_users', filename: '001_create_users.sql' },
  { name: '002_setup_charities', filename: '002_setup_charities.sql' },
  { name: '003_setup_scores', filename: '003_setup_scores.sql' },
  { name: '004_setup_subscriptions', filename: '004_setup_subscriptions.sql' },
  { name: '005_setup_draw_engine', filename: '005_setup_draw_engine.sql' },
  { name: '006_setup_winner_lifecycle', filename: '006_setup_winner_lifecycle.sql' },
  { name: '007_setup_donations', filename: '007_setup_donations.sql' },
  { name: '008_setup_admin_policies', filename: '008_setup_admin_policies.sql' },
];

async function runMigrations() {
  const client = await pool.connect();

  try {
    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Get already executed migrations
    const { rows: executedMigrations } = await client.query(
      'SELECT name FROM migrations ORDER BY id'
    );
    const executedNames = new Set(executedMigrations.map((m: { name: string }) => m.name));

    // Run pending migrations
    for (const migration of migrations) {
      if (executedNames.has(migration.name)) {
        console.log(`✓ Migration ${migration.name} already executed`);
        continue;
      }

      console.log(`→ Running migration: ${migration.name}`);

      const migrationPath = path.join(__dirname, '../../migrations', migration.filename);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

      await client.query('BEGIN');

      try {
        await client.query(migrationSQL);
        await client.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [migration.name]
        );
        await client.query('COMMIT');
        console.log(`✓ Migration ${migration.name} completed`);
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`✗ Migration ${migration.name} failed:`, error);
        throw error;
      }
    }

    console.log('\n✓ All migrations completed successfully');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
