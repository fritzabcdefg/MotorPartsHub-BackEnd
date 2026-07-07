const db = require('../utils/db');
const { Review } = require('../models');

exports.getAllReviews = (req, res) => {
    const sql = 'SELECT * FROM reviews';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch reviews' });
        res.json(results);
    });
};

// ─────────────────────────────────────────────────────────
// CREATE REVIEW — one review row per item in the given order
// ─────────────────────────────────────────────────────────
exports.createReview = async (req, res) => {
  const userId = req.user && req.user.id;
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

  const { orderId, rating, comment } = req.body;
  if (!orderId) return res.status(400).json({ success: false, message: 'orderId is required.' });
  if (!comment || !comment.trim()) return res.status(400).json({ success: false, message: 'Comment is required.' });

  // FIXED: pull display name from customers.fname/lname, not users.name (which doesn't exist)
  const sqlVerify = `
    SELECT ol.item_id, CONCAT(c.fname, ' ', c.lname) AS user_name
    FROM orderinfo o
    JOIN customers c ON o.customer_id = c.customer_id
    JOIN orderline ol ON ol.orderinfo_id = o.orderinfo_id
    WHERE o.orderinfo_id = ? AND c.user_id = ?
  `;

  db.query(sqlVerify, [orderId, userId], async (err, rows) => {
    if (err) {
      console.error('DB Error verifying order ownership:', err);
      return res.status(500).json({ success: false, message: 'Database error.' });
    }

    if (!rows || rows.length === 0) {
      return res.status(403).json({ success: false, message: 'This order does not belong to you, or was not found.' });
    }

    const userName = rows[0].user_name;

    try {
      const reviewRows = await Promise.all(
        rows.map(row =>
          Review.create({
            item_id:      row.item_id,
            orderinfo_id: orderId,
            user_id:      userId,
            user_name:    userName,
            rating:       parseInt(rating) || null,
            comment:      comment.trim()
          })
        )
      );

      return res.json({ success: true, message: 'Review submitted successfully!', count: reviewRows.length });
    } catch (createErr) {
      console.error('Error creating review:', createErr);
      return res.status(500).json({ success: false, message: 'Failed to save review.' });
    }
  });
};