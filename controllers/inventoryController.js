const db = require('../utils/db');
exports.getAllInventory = (req, res) => {
    const sql = 'SELECT * FROM items';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch inventory' });
        res.json(results);
    });
};