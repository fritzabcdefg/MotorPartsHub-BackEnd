const db = require('../utils/db');
const { sendOrderReceiptEmail } = require('../utils/emailService');

// Flat shipping fee applied to every order (₱200)
const SHIPPING_FEE = 200;

exports.getAllOrders = (req, res) => {
  const sql = `
    SELECT 
      o.orderinfo_id, 
      o.status, 
      o.date_placed,
      o.shipping, 
      CONCAT(c.fname, ' ', c.lname) AS customer_name,
      IFNULL(SUM(ol.quantity * i.sell_price), 0) + IFNULL(o.shipping, 0) AS total
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

  const sqlCustomer = `SELECT CONCAT(fname, ' ', lname) AS customerName, addressline AS shippingAddress,
                              town, zipcode, phone
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
        customer: custResults[0] || { customerName: 'Unknown', shippingAddress: 'N/A', town: '', zipcode: '', phone: '' },
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
      IFNULL(SUM(ol.quantity * i.sell_price), 0) + IFNULL(o.shipping, 0) AS total
    FROM orderinfo o
    JOIN customers c ON o.customer_id = c.customer_id
    LEFT JOIN orderline ol ON ol.orderinfo_id = o.orderinfo_id
    LEFT JOIN items i ON i.id = ol.item_id
    WHERE c.user_id = ?
    GROUP BY o.orderinfo_id, o.status, o.date_placed, o.date_shipped, o.shipping
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

// ─────────────────────────────────────────
// CREATE ORDER — called from checkout.html
// ─────────────────────────────────────────
exports.createOrder = (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

  const { items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'No items in order.' });
  }

  // Step 1: Get customer_id + email + phone/zipcode from users + customers tables
  const getCustomerSql = `
    SELECT c.customer_id, u.email, c.fname, c.lname, c.addressline, c.town, c.zipcode, c.phone
    FROM customers c
    JOIN users u ON u.id = c.user_id
    WHERE c.user_id = ?
  `;

  db.query(getCustomerSql, [userId], (err, custResults) => {
    if (err) {
      console.error('DB Error fetching customer:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch customer details.' });
    }

    if (!custResults || custResults.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer profile not found. Please complete your profile.' });
    }

    const customer = custResults[0];
    const itemIds = items.map(item => item.item_id);

    // Step 2: Check stock levels for every item in the order before touching anything
    const stockCheckSql = `SELECT id, name, quantity, sell_price FROM items WHERE id IN (?)`;

    db.query(stockCheckSql, [itemIds], (err, stockResults) => {
      if (err) {
        console.error('DB Error checking stock:', err);
        return res.status(500).json({ success: false, message: 'Failed to verify item stock.' });
      }

      const stockById = {};
      stockResults.forEach(row => { stockById[row.id] = row; });

      // Validate requested quantity against available stock
      for (const item of items) {
        const dbItem = stockById[item.item_id];
        const requestedQty = parseInt(item.quantity || 1);

        if (!dbItem) {
          return res.status(400).json({ success: false, message: `Item #${item.item_id} no longer exists.` });
        }
        if (dbItem.quantity < requestedQty) {
          return res.status(400).json({
            success: false,
            message: `Not enough stock for "${dbItem.name}". Only ${dbItem.quantity} left.`
          });
        }
      }

      // Compute item total from live DB prices + flat shipping fee
      const itemsTotal = items.reduce((sum, item) => {
        const dbItem = stockById[item.item_id];
        const qty = parseInt(item.quantity || 1);
        return sum + (parseFloat(dbItem.sell_price) * qty);
      }, 0);
      const orderTotal = itemsTotal + SHIPPING_FEE;

      // Step 3: Insert into orderinfo (shipping stored as the numeric flat fee)
      const insertOrderSql = `
        INSERT INTO orderinfo (customer_id, status, date_placed, shipping)
        VALUES (?, 'Processing', NOW(), ?)
      `;

      db.query(insertOrderSql, [customer.customer_id, SHIPPING_FEE], (err, orderResult) => {
        if (err) {
          console.error('DB Error inserting order:', err);
          return res.status(500).json({ success: false, message: 'Failed to create order.' });
        }

        const newOrderId = orderResult.insertId;

        // Step 4: Insert each item into orderline
        const orderLineValues = items.map(item => [
          newOrderId,
          item.item_id,
          parseInt(item.quantity || 1)
        ]);

        const insertLinesSql = `INSERT INTO orderline (orderinfo_id, item_id, quantity) VALUES ?`;

        db.query(insertLinesSql, [orderLineValues], (err) => {
          if (err) {
            console.error('DB Error inserting order lines:', err);
            return res.status(500).json({ success: false, message: 'Failed to save order items.' });
          }

          // Step 5: Reduce inventory for each purchased item
          const decrementPromises = items.map(item => {
            const qty = parseInt(item.quantity || 1);
            return new Promise((resolve, reject) => {
              db.query(
                `UPDATE items SET quantity = quantity - ? WHERE id = ?`,
                [qty, item.item_id],
                (err) => (err ? reject(err) : resolve())
              );
            });
          });

          Promise.all(decrementPromises)
            .catch(decErr => console.error('Inventory deduction failed (order still placed):', decErr))
            .finally(async () => {
              // Step 6: Send receipt email (non-blocking — don't fail the order if email fails)
              try {
                await sendOrderReceiptEmail({
                  email:    customer.email,
                  fname:    customer.fname,
                  lname:    customer.lname,
                  phone:    customer.phone,
                  zipcode:  customer.zipcode,
                  items:    items.map(item => ({
                    ...item,
                    name:  stockById[item.item_id]?.name,
                    price: stockById[item.item_id]?.sell_price
                  })),
                  itemsTotal: itemsTotal,
                  shipping:   SHIPPING_FEE,
                  total:      orderTotal,
                  address:  `${customer.addressline}, ${customer.town} ${customer.zipcode || ''}`
                });
              } catch (emailErr) {
                console.error('Receipt email failed (order still placed):', emailErr);
              }

              // Step 7: Return success
              return res.json({
                success:  true,
                message:  'Order placed successfully!',
                orderId:  newOrderId,
                shipping: SHIPPING_FEE,
                itemsTotal: itemsTotal,
                total:    orderTotal
              });
            });
        });
      });
    });
  });
};