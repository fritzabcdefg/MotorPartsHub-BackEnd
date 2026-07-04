const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Customer = sequelize.define('Customer', {
  customer_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  title: { type: DataTypes.STRING(45), allowNull: false },
  lname: { type: DataTypes.STRING(45), allowNull: false },
  fname: { type: DataTypes.STRING(32), allowNull: false },
  addressline: { type: DataTypes.STRING(45), allowNull: false },
  town: { type: DataTypes.STRING(45), allowNull: false },
  zipcode: { type: DataTypes.STRING(15), allowNull: true },
  phone: { type: DataTypes.STRING(45), allowNull: true },
  user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  image: { type: DataTypes.STRING(255), allowNull: true }
}, {
  tableName: 'customers',
  timestamps: false,
  freezeTableName: true
});

module.exports = Customer;
