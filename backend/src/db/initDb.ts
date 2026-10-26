import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function runSqlFile(connection: mysql.Connection, filePath: string) {
  console.log(`Executing SQL script: ${path.basename(filePath)}...`);
  const content = fs.readFileSync(filePath, 'utf-8');

  // Split on DELIMITER $$ for trigger scripts or standard ; for DDL
  if (content.includes('DELIMITER $$')) {
    // Custom trigger file handling
    const triggerBlocks = content
      .split('DELIMITER $$')[1]
      .split('DELIMITER ;')[0]
      .split('$$')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const block of triggerBlocks) {
      if (block.length > 0) {
        await connection.query(block);
      }
    }
  } else {
    // Normal statement-by-statement execution
    const statements = content
      .split(/;\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    for (const stmt of statements) {
      if (stmt.length > 0) {
        await connection.query(stmt);
      }
    }
  }
}

async function init() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    console.log('Connected to MySQL. Setting up database...');
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'gaming_tournament_db'}\`;`);
    await connection.query(`USE \`${process.env.DB_NAME || 'gaming_tournament_db'}\`;`);

    const schemaPath = path.resolve(__dirname, '../../../database/01_schema.sql');
    const triggersPath = path.resolve(__dirname, '../../../database/02_triggers.sql');

    await runSqlFile(connection, schemaPath);
    await runSqlFile(connection, triggersPath);

    console.log('Database schema and triggers initialized successfully!');
  } catch (err) {
    console.error('Database initialization failed:', err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

init();
