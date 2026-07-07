require('dotenv').config();
const mysql = require('mysql2/promise');

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'motorpartshub';

async function main() {
  try {
    console.log(`Connecting to ${DB_HOST}:${DB_PORT} as ${DB_USER}...`);
    const conn = await mysql.createConnection({ host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD });
    console.log('Connected. Ensuring database exists...');

    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    console.log(`Database ensured: ${DB_NAME}`);

    // Optional: ensure the current user has privileges on the DB
    try {
      await conn.query(`GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO ?@?`, [DB_USER, DB_HOST]);
      await conn.query('FLUSH PRIVILEGES;');
      console.log(`Granted privileges on ${DB_NAME} to ${DB_USER}@${DB_HOST}`);
    } catch (e) {
      console.log('Warning: could not grant privileges (you may not have permission). Continue if DB already usable.');
    }

    await conn.end();
    console.log('Done. You can now run `npm start` to let Sequelize create tables.');
  } catch (err) {
    console.error('Setup failed:', err.message || err);
    process.exitCode = 1;
  }
}

if (require.main === module) main();
