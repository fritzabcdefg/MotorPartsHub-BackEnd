const db = require('../utils/db');

exports.getDashboardStats = (req, res) => {
  // Query 1: Total Orders
  // Query 2: Total Revenue (summing orderlines * item sell_price)
  const sql = `
    SELECT 
      (SELECT COUNT(*) FROM orderinfo) AS totalOrders,
      (SELECT SUM(ol.quantity * i.sell_price) 
       FROM orderline ol 
       JOIN items i ON ol.item_id = i.id) AS totalRevenue
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    // Returns { totalOrders: 10, totalRevenue: 5000.00 }
    res.json(results[0]);
  });
};