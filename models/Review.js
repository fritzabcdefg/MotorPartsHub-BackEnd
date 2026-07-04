const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  item_id: { type: DataTypes.INTEGER, allowNull: false },
  orderinfo_id: { type: DataTypes.INTEGER, allowNull: true },
  user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  user_name: { type: DataTypes.STRING(100), allowNull: true },
  rating: { type: DataTypes.TINYINT, allowNull: true },
  comment: { type: DataTypes.TEXT, allowNull: false },
  is_visible: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'reviews',
  timestamps: false,
  freezeTableName: true
});

module.exports = Review;
