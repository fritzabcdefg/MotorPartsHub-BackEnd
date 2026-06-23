const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Part = sequelize.define('Part', {
  name: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.FLOAT, allowNull: false }
});

module.exports = Part;
