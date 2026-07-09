const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const OrderLine = sequelize.define('OrderLine', {
  orderinfo_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  },
  item_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  },
  quantity: { type: DataTypes.SMALLINT, allowNull: true },
  is_deleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
}, {
  tableName: 'orderline',
  timestamps: false,
  freezeTableName: true
});

module.exports = OrderLine;
