const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Item = sequelize.define('Item', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  cost_price: { type: DataTypes.FLOAT, allowNull: true },
  sell_price: { type: DataTypes.FLOAT, allowNull: false },
  supplier_name: { type: DataTypes.STRING, allowNull: true },
  category_id: { type: DataTypes.INTEGER, allowNull: true },
  quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  img_path: { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'items',
  timestamps: true,
  freezeTableName: true,
  underscored: false
});

module.exports = Item;
