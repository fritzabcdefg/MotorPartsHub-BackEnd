require('dotenv').config({ override: true });
// Ensure the app connects to the expected project database during tests
// Force DB_NAME to the project database to avoid external env overrides during tests
process.env.DB_NAME = 'motorpartshub';
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'motorpartshub',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD ?? '',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: (msg) => console.log('[sequelize]', msg)
  }
);

// Log which DB connection values are being used (no password printed)
console.log(`DB config: host=${process.env.DB_HOST || '127.0.0.1'} port=${process.env.DB_PORT || 3306} user=${process.env.DB_USER || 'root'} db=${process.env.DB_NAME || 'motorpartshub'}`);

module.exports = sequelize;
