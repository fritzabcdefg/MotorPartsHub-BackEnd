require('dotenv').config();
const sequelize = require('../models/database');
// Part model not used in this project scope anymore
const User = require('../models/User');

async function seed() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('DB connected — seeding data...');

    // Seed users (idempotent with findOrCreate)
    const users = [
      { name: 'Fritzie', email: 'Fritzie@gmail.com', password: 'AdminPassword', role: 'admin' },
      { name: 'Lorraine', email: 'Lorraine@gmail.com', password: 'AdminPassword', role: 'admin' },
      { name: 'User Test', email: 'UserTest@gmail.com', password: 'CustomerPassword', role: 'user' }
    ];

    for (const u of users) {
      const [user, created] = await User.findOrCreate({ where: { email: u.email }, defaults: u });
      if (!created) {
        await user.update({ name: u.name, password: u.password, role: u.role, active: true });
      }
      console.log(`${created ? 'Created' : 'Updated'} user: ${user.email} (${user.role})`);
    }

    // Parts seeding removed; project uses `items` table instead.

    console.log('Seeding complete.');
    await sequelize.close();
  } catch (e) {
    console.error('Seeding failed:', e.message);
    process.exitCode = 1;
  }
}

if (require.main === module) seed();
