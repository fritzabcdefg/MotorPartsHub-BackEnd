const sequelize = require('./models/database');
require('./models');
const app = require('./app');

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log(`Sequelize connected: dialect=${sequelize.getDialect()} host=${sequelize.options.host}:${sequelize.options.port} db=${sequelize.config.database}`);
    app.listen(PORT, () => {
      console.log(`Server started at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize database connection:', error.message);
    process.exit(1);
  }
})();

module.exports = app;
