require('dotenv').config();
const { sequelize } = require('../models');

async function resetDatabase() {
  try {
    console.log('Connecting to the database...');
    await sequelize.authenticate();
    console.log('Connected. Dropping existing tables and recreating them...');

    await sequelize.sync({ force: true });

    console.log('Database reset complete. All tables were dropped and recreated.');
  } catch (error) {
    console.error('Database reset failed:', error.message || error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  resetDatabase();
}
