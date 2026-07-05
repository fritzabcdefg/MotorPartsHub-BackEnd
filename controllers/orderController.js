const db = require('../utils/db'); 

// 1. Fetch all unified order summaries matching your explicit item schema layout
exports.getAllOrders = async (req, res) => {
  const sqlQuery = `
    SELECT 
      oi.orderinfo_id AS id,
      oi.customer_id AS customerName,
      oi.date_placed AS createdAt,
      oi.status AS status,
      oi.shipping AS shipping,
      COALESCE(SUM(ol.quantity * i.sell_price), 0) + oi.shipping AS totalPrice
    FROM orderinfo oi
    LEFT JOIN orderline ol ON oi.orderinfo_id = ol.orderinfo_id
    LEFT JOIN items i ON ol.item_id = i.id
    GROUP BY oi.orderinfo_id
    ORDER BY oi.date_placed DESC
  `;

  db.query(sqlQuery, (err, results) => {
    if (err) {
      console.error('XAMPP Database Query Error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to extract database logs.', 
        error: err.message 
      });
    }
    return res.status(200).json({ success: true, orders: results });
  });
};

// 2. Fetch detailed structural item list and customer profile metrics
exports.getOrderDetails = async (req, res) => {
  const orderId = req.params.id;

  // Query A: Extract customer profile and delivery address metrics
  // Adjust 'u.name' and 'u.address' if your user columns use names like 'u.fullname'
  const customerQuery = `
    SELECT 
      oi.orderinfo_id AS orderId,
      oi.date_placed AS datePlaced,
      oi.status AS status,
      u.name AS customerName,
      u.address AS shippingAddress
    FROM orderinfo oi
    INNER JOIN users u ON oi.customer_id = u.id
    WHERE oi.orderinfo_id = ?
  `;

  // Query B: Extract item ledger listings
  const itemsQuery = `
    SELECT 
      ol.item_id AS itemId,
      i.name AS itemName,
      i.sell_price AS itemPrice,
      ol.quantity AS qty,
      (ol.quantity * i.sell_price) AS subTotal
    FROM orderline ol
    INNER JOIN items i ON ol.item_id = i.id
    WHERE ol.orderinfo_id = ?
  `;

  db.query(customerQuery, [orderId], (err, customerResults) => {
    if (err) {
      console.error('XAMPP Customer Details Join Error:', err);
      return res.status(500).json({ success: false, message: 'Failed to extract customer data records.', error: err.message });
    }

    db.query(itemsQuery, [orderId], (itemsErr, itemsResults) => {
      if (itemsErr) {
        console.error('XAMPP Items Details Fetch Error:', itemsErr);
        return res.status(500).json({ success: false, message: 'Failed to extract items matrix data lines.', error: itemsErr.message });
      }

      // Return both metadata blocks back to your frontend template layout
      return res.status(200).json({
        success: true,
        customer: customerResults[0] || { customerName: `ID #${orderId}`, shippingAddress: "Not specified" },
        items: itemsResults
      });
    });
  });
};

// 3. Update status lifecycle tracks inside orderinfo
exports.updateOrderStatus = async (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  if (!['Processing', 'Shipped', 'Delivered', 'Cancelled'].includes(status)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid status structural state selection.' 
    });
  }

  const sqlUpdate = 'UPDATE orderinfo SET status = ? WHERE orderinfo_id = ?';

  db.query(sqlUpdate, [status, orderId], (err, result) => {
    if (err) {
      console.error('XAMPP Database Update Error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to execute status update change.', 
        error: err.message 
      });
    }
    return res.status(200).json({ 
      success: true, 
      message: 'Status successfully synchronized in XAMPP master table.' 
    });
  });
};
exports.getDashboardStats = (req, res) => {
  const summarySql = `
    SELECT
      (SELECT COUNT(*) FROM orderinfo) AS totalOrders,
      (SELECT COALESCE(SUM(ol.quantity * i.sell_price), 0)
       FROM orderline ol
       JOIN items i ON ol.item_id = i.id) AS totalRevenue
  `;

  const trendSql = `
    SELECT DATE(oi.date_placed) AS label,
           COALESCE(SUM(ol.quantity * i.sell_price), 0) AS totalSales
    FROM orderinfo oi
    LEFT JOIN orderline ol ON oi.orderinfo_id = ol.orderinfo_id
    LEFT JOIN items i ON ol.item_id = i.id
    WHERE oi.date_placed >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
    GROUP BY DATE(oi.date_placed)
    ORDER BY DATE(oi.date_placed)
  `;

  const statusSql = `
    SELECT status AS label, COUNT(*) AS total
    FROM orderinfo
    GROUP BY status
    ORDER BY total DESC
  `;

  const topItemsSql = `
    SELECT i.name AS label, SUM(ol.quantity) AS total
    FROM orderline ol
    JOIN items i ON ol.item_id = i.id
    GROUP BY i.id, i.name
    ORDER BY total DESC
    LIMIT 5
  `;

  db.query(summarySql, (summaryErr, summaryResults) => {
    if (summaryErr) {
      console.error('Dashboard summary query failed:', summaryErr);
      return res.status(500).json({ error: 'Database query failed' });
    }

    db.query(trendSql, (trendErr, trendResults) => {
      if (trendErr) {
        console.error('Dashboard trend query failed:', trendErr);
        return res.status(500).json({ error: 'Database query failed' });
      }

      db.query(statusSql, (statusErr, statusResults) => {
        if (statusErr) {
          console.error('Dashboard status query failed:', statusErr);
          return res.status(500).json({ error: 'Database query failed' });
        }

        db.query(topItemsSql, (itemsErr, itemResults) => {
          if (itemsErr) {
            console.error('Dashboard item query failed:', itemsErr);
            return res.status(500).json({ error: 'Database query failed' });
          }

          const summary = summaryResults[0] || {};
          res.json({
            totalOrders: Number(summary.totalOrders || 0),
            totalRevenue: Number(summary.totalRevenue || 0),
            salesTrend: (trendResults || []).map((row) => ({
              label: row.label,
              totalSales: Number(row.totalSales || 0)
            })),
            orderStatus: (statusResults || []).map((row) => ({
              label: row.label,
              total: Number(row.total || 0)
            })),
            topItems: (itemResults || []).map((row) => ({
              label: row.label,
              total: Number(row.total || 0)
            }))
          });
        });
      });
    });
  });
};