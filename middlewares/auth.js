const { findUserByToken } = require('../utils/userHelpers');

async function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  if (!token) {
    return res.status(401).json({ message: 'No token provided.' });
  }

  const user = await findUserByToken(token);
  if (!user) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
  if (user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin role required.' });
  }

  req.user = user;
  next();
}

module.exports = {
  verifyAdmin
};
