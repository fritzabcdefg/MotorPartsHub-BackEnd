const db = require('../utils/db');

exports.getAllCategories = (req, res) => {
    const sql = 'SELECT * FROM categories';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch categories' });
        res.json(results);
    });
};