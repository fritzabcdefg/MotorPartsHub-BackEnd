const sequelize = require('./database');
const Item = require('./Item');
const Category = require('./Category');
const Customer = require('./Customer');
const OrderInfo = require('./OrderInfo');
const OrderLine = require('./OrderLine');
const ProductImage = require('./ProductImage');
const Review = require('./Review');

Item.hasMany(ProductImage, { foreignKey: 'item_id', as: 'images' });
ProductImage.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });

Customer.hasMany(OrderInfo, { foreignKey: 'customer_id', as: 'orders' });
OrderInfo.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

OrderInfo.belongsToMany(Item, { through: OrderLine, foreignKey: 'orderinfo_id', otherKey: 'item_id', as: 'items' });
Item.belongsToMany(OrderInfo, { through: OrderLine, foreignKey: 'item_id', otherKey: 'orderinfo_id', as: 'orders' });

Item.hasMany(Review, { foreignKey: 'item_id', as: 'reviews' });
Review.belongsTo(Item, { foreignKey: 'item_id', as: 'item' });

module.exports = {
  sequelize,
  Item,
  Category,
  Customer,
  OrderInfo,
  OrderLine,
  ProductImage,
  Review
};
