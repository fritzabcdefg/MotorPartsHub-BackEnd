const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const OrderInfo = sequelize.define('OrderInfo', {
  orderinfo_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  customer_id: { type: DataTypes.INTEGER, allowNull: false },
  date_placed: { type: DataTypes.DATEONLY, allowNull: false },
  date_shipped: { type: DataTypes.DATEONLY, allowNull: true },
  shipping: { type: DataTypes.DECIMAL(7, 2), allowNull: true },
  status: {
    type: DataTypes.ENUM('Processing', 'Shipped', 'Delivered', 'Cancelled'),
    allowNull: false,
    defaultValue: 'Processing'
  }
}, {
  tableName: 'orderinfo',
  timestamps: false,
  freezeTableName: true
});

module.exports = OrderInfo;
