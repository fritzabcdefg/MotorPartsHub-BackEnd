const db = require('../utils/db');

exports.getAllOrders = (req, res) => {
  const sql = `
    SELECT 
      o.orderinfo_id, 
      o.status, 
      o.date_placed,
      o.shipping, 
      CONCAT(c.fname, ' ', c.lname) AS customer_name,
      IFNULL(SUM(ol.quantity * i.sell_price), 0) AS total
    FROM orderinfo o
    JOIN customers c ON o.customer_id = c.customer_id
    LEFT JOIN orderline ol ON ol.orderinfo_id = o.orderinfo_id
    LEFT JOIN items i ON i.id = ol.item_id
    GROUP BY o.orderinfo_id, o.status, o.date_placed, o.shipping, c.fname, c.lname
    ORDER BY o.date_placed DESC`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Database Error:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
};

exports.getOrderDetails = (req, res) => {
  const orderId = req.params.id;

  const sqlCustomer = `SELECT CONCAT(fname, ' ', lname) AS customerName, addressline AS shippingAddress 
                       FROM customers WHERE customer_id = (SELECT customer_id FROM orderinfo WHERE orderinfo_id = ?)`;

  const sqlItems = `SELECT i.id AS itemId, i.name AS itemName, i.sell_price AS itemPrice, 
                           ol.quantity AS qty, (ol.quantity * i.sell_price) AS subTotal
                    FROM orderline ol
                    JOIN items i ON ol.item_id = i.id
                    WHERE ol.orderinfo_id = ?`;

  db.query(sqlCustomer, [orderId], (err, custResults) => {
    if (err) return res.status(500).json({ error: 'DB Error' });

    db.query(sqlItems, [orderId], (err, itemResults) => {
      if (err) return res.status(500).json({ error: 'DB Error' });

      res.json({
        customer: custResults[0] || { customerName: 'Unknown', shippingAddress: 'N/A' },
        items: itemResults
      });
    });
  });
};

exports.updateOrderStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Missing status in request body' });

  const sql = `UPDATE orderinfo SET status = ? WHERE orderinfo_id = ?`;
  db.query(sql, [status, id], (err, result) => {
    if (err) return res.status(500).json({ error: 'DB Error', details: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Order not found' });
    res.json({ ok: true, id, status });
  });
};

// Dashboard APIs (kept from your original file)
exports.getDashboardStats = (req, res) => {
  const sql = `SELECT 
      (SELECT COUNT(*) FROM orderinfo) AS totalOrders,
      (SELECT IFNULL(SUM(ol.quantity * i.sell_price),0) FROM orderline ol JOIN items i ON ol.item_id = i.id) AS totalRevenue`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'DB Error', details: err.message });
    res.json(results[0] || {});
  });
};

exports.getChartData = (req, res) => {
  const sql = "SELECT status, COUNT(*) as count FROM orderinfo GROUP BY status";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'DB Error', details: err.message });
    res.json(results);
  });
};

exports.getUserSpecificOrders = (req, res) => {
  const userId = req.params.userId || req.query.userId;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required to fetch orders.' });
  }

  const sql = `
    SELECT 
      o.orderinfo_id, 
      o.status, 
      o.date_placed,
      o.date_shipped,
      IFNULL(SUM(ol.quantity * i.sell_price), 0) AS total
    FROM orderinfo o
    JOIN customers c ON o.customer_id = c.customer_id
    LEFT JOIN orderline ol ON ol.orderinfo_id = o.orderinfo_id
    LEFT JOIN items i ON i.id = ol.item_id
    WHERE c.user_id = ?
    GROUP BY o.orderinfo_id, o.status, o.date_placed, o.date_shipped
    ORDER BY o.date_placed DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Database Error fetching user orders:", err);
      return res.status(500).json({ error: 'Failed to retrieve orders.' });
    }
    res.json({ success: true, orders: results });
  });
};