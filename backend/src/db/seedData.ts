import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gaming_tournament_db',
    multipleStatements: true
  });

  try {
    console.log('Seeding sample data for Gaming Tournament Management System...');
    const seedPath = path.resolve(__dirname, '../../../database/03_seed.sql');
    const content = fs.readFileSync(seedPath, 'utf-8');

    const statements = content
      .split(/;\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const stmt of statements) {
      if (stmt.length > 0) {
        await connection.query(stmt);
      }
    }

    console.log('Sample data seeded successfully!');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
