const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Item = sequelize.define('Item', {
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  sell_price: { type: DataTypes.FLOAT, allowNull: false },
  quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  img_path: { type: DataTypes.STRING, allowNull: true }
});

module.exports = Item;
