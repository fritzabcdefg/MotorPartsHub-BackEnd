// middlewares/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret_key';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'Admin');
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    next();
  });
};

module.exports = {
  verifyToken,
  verifyAdmin
};
