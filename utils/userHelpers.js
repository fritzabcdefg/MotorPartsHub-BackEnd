const { User } = require('../models');

async function findUserByEmail(email, includeInactive = false) {
  const whereClause = { email };
  if (!includeInactive) whereClause.active = true;
  return User.findOne({ where: whereClause });
}

async function findUserById(id, includeInactive = false) {
  const user = await User.findByPk(id);
  if (!user) return null;
  if (!includeInactive && !user.active) return null;
  return user;
}

async function findUserByToken(token, includeInactive = false) {
  const whereClause = { token };
  if (!includeInactive) whereClause.active = true;
  return User.findOne({ where: whereClause });
}

async function getAllUsers() {
  return User.findAll();
}

async function createUser({ name, email, password, role = 'user' }) {
  return User.create({ name, email, password, role });
}

module.exports = {
  findUserByEmail,
  findUserById,
  findUserByToken,
  getAllUsers,
  createUser
};
