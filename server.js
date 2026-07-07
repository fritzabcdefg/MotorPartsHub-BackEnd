
const sequelize = require('./models/database');
require('./models');
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    if (sequelize && typeof sequelize.authenticate === 'function') {
      await sequelize.authenticate();
      await sequelize.sync();
      console.log(`Sequelize connected: dialect=${sequelize.getDialect()} host=${sequelize.options.host}:${sequelize.options.port} db=${sequelize.config.database}`);
    }
  } catch (error) {
    console.warn('Database not ready, continuing without initial sync:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
  });
})();

module.exports = app;
