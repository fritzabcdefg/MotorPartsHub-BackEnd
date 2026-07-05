const db = require('../utils/db');
exports.getAllReviews = (req, res) => {
    const sql = 'SELECT * FROM reviews';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch reviews' });
        res.json(results);
    });
};