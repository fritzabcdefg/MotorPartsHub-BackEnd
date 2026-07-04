require('dotenv').config({ override: true });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'motorpartshub',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD ?? '',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false
  }
);

// Log which DB connection values are being used (no password printed)
console.log(`DB config: host=${process.env.DB_HOST || '127.0.0.1'} port=${process.env.DB_PORT || 3306} user=${process.env.DB_USER || 'root'} db=${process.env.DB_NAME || 'motorpartshub'}`);

module.exports = sequelize;
