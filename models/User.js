const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('./database');

async function hashPasswordIfNeeded(user) {
  if (!user.password) return;
  if (typeof user.password !== 'string') return;
  if (/^\$2[aby]\$\d{2}\$/.test(user.password)) return;
  user.password = await bcrypt.hash(user.password, 10);
}

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
  role: { type: DataTypes.STRING, defaultValue: 'user' },
  token: { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'users',
  timestamps: false,
  freezeTableName: true,
  hooks: {
    beforeCreate: hashPasswordIfNeeded,
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        await hashPasswordIfNeeded(user);
      }
    }
  }
});

User.prototype.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  if (/^\$2[aby]\$\d{2}\$/.test(this.password)) {
    return bcrypt.compare(candidatePassword, this.password);
  }
  return this.password === candidatePassword;
};

module.exports = User;
