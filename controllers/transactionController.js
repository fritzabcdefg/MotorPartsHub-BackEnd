const db = require('../utils/db');

const serializeTransaction = (row) => {
  const amount = Number(row.amount || 0);
  const shipping = Number(row.shipping || 0);

  return {
    id: row.orderinfo_id,
    customer_id: row.customer_id,
    customer_name: row.customer_name || null,
    status: row.status || 'Processing',
    shipping,
    date_placed: row.date_placed,
    amount,
    total: amount + shipping,
    is_deleted: Boolean(row.is_deleted)
  };
};

exports.listTransactions = (req, res) => {
  const sql = `
    SELECT o.orderinfo_id, o.customer_id, o.status, o.shipping, o.date_placed, o.is_deleted,
           CONCAT(c.fname, ' ', c.lname) AS customer_name,
           IFNULL(SUM(ol.quantity * i.sell_price), 0) AS amount
    FROM orderinfo o
    LEFT JOIN customers c ON c.customer_id = o.customer_id
    LEFT JOIN orderline ol ON ol.orderinfo_id = o.orderinfo_id
    LEFT JOIN items i ON i.id = ol.item_id
    WHERE o.is_deleted = 0
    GROUP BY o.orderinfo_id, o.customer_id, o.status, o.shipping, o.date_placed, o.is_deleted, c.fname, c.lname
    ORDER BY o.date_placed DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, transactions: results.map(serializeTransaction) });
  });
};

exports.getTransactionById = (req, res) => {
  const id = req.params.id;
  const sql = `
    SELECT o.orderinfo_id, o.customer_id, o.status, o.shipping, o.date_placed, o.is_deleted,
           CONCAT(c.fname, ' ', c.lname) AS customer_name,
           IFNULL(SUM(ol.quantity * i.sell_price), 0) AS amount
    FROM orderinfo o
    LEFT JOIN customers c ON c.customer_id = o.customer_id
    LEFT JOIN orderline ol ON ol.orderinfo_id = o.orderinfo_id
    LEFT JOIN items i ON i.id = ol.item_id
    WHERE o.orderinfo_id = ? AND o.is_deleted = 0
    GROUP BY o.orderinfo_id, o.customer_id, o.status, o.shipping, o.date_placed, o.is_deleted, c.fname, c.lname
  `;

  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (!results.length) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, transaction: serializeTransaction(results[0]) });
  });
};

exports.createTransaction = (req, res) => {
  const { customer_id, customerId, status, shipping, items } = req.body;
  const resolvedCustomerId = customer_id || customerId;
  const resolvedStatus = status || 'Processing';
  const resolvedShipping = shipping !== undefined ? Number(shipping) : 200;
  const itemList = Array.isArray(items) ? items : [];

  const getCustomerSql = 'SELECT customer_id FROM customers LIMIT 1';

  db.query(getCustomerSql, (err, customerResults) => {
    if (err) return res.status(500).json({ success: false, message: err.message });

    const fallbackCustomerId = resolvedCustomerId || (customerResults[0] && customerResults[0].customer_id);
    if (!fallbackCustomerId) {
      return res.status(400).json({ success: false, message: 'customer_id is required or no customer record exists' });
    }

    const insertSql = 'INSERT INTO orderinfo (customer_id, status, date_placed, shipping, is_deleted) VALUES (?, ?, NOW(), ?, 0)';
    db.query(insertSql, [fallbackCustomerId, resolvedStatus, resolvedShipping], (err, insertResult) => {
      if (err) return res.status(500).json({ success: false, message: err.message });

      const transactionId = insertResult.insertId;
      if (!itemList.length) {
        return res.status(201).json({ success: true, transaction: { id: transactionId, customer_id: fallbackCustomerId, status: resolvedStatus, shipping: resolvedShipping, date_placed: new Date().toISOString().slice(0, 10), amount: 0, total: resolvedShipping } });
      }

      const orderLineValues = itemList.map((item) => [transactionId, item.item_id || item.id, Number(item.quantity || 1)]);
      db.query('INSERT INTO orderline (orderinfo_id, item_id, quantity) VALUES ?', [orderLineValues], (err) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        const totalAmount = itemList.reduce((sum, item) => sum + (Number(item.amount || 0) * Number(item.quantity || 1)), 0);
        const createdTransaction = {
          id: transactionId,
          customer_id: fallbackCustomerId,
          status: resolvedStatus,
          shipping: resolvedShipping,
          date_placed: new Date().toISOString().slice(0, 10),
          amount: totalAmount,
          total: totalAmount + resolvedShipping
        };
        res.status(201).json({ success: true, transaction: createdTransaction });
      });
    });
  });
};

exports.updateTransaction = (req, res) => {
  const id = req.params.id;
  const { customer_id, customerId, status, shipping } = req.body;
  const resolvedCustomerId = customer_id || customerId;
  const resolvedStatus = status;
  const resolvedShipping = shipping !== undefined ? Number(shipping) : undefined;

  const fields = [];
  const values = [];

  if (resolvedCustomerId) {
    fields.push('customer_id = ?');
    values.push(resolvedCustomerId);
  }
  if (resolvedStatus) {
    fields.push('status = ?');
    values.push(resolvedStatus);
  }
  if (resolvedShipping !== undefined) {
    fields.push('shipping = ?');
    values.push(resolvedShipping);
  }

  if (!fields.length) {
    return res.status(400).json({ success: false, message: 'Nothing to update' });
  }

  values.push(id);
  const sql = `UPDATE orderinfo SET ${fields.join(', ')} WHERE orderinfo_id = ? AND is_deleted = 0`;

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, message: 'Transaction updated' });
  });
};

exports.deleteTransaction = (req, res) => {
  const id = req.params.id;
  const sql = 'UPDATE orderinfo SET is_deleted = 1 WHERE orderinfo_id = ? AND is_deleted = 0';

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, message: 'Transaction deleted' });
  });
};
