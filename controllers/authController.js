const { User } = require('../models');
const {
  findUserByEmail,
  findUserById,
  createUser
} = require('../utils/userHelpers');

async function register(req, res) {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({ message: 'Email is already registered.' });
  }

  const newUser = await createUser({ name, email, password });

  return res.status(201).json({
    success: true,
    message: 'Register success',
    user: { id: newUser.id, name: newUser.name, email: newUser.email }
  });
}

async function login(req, res) {
  const email = String(req.body?.email || '').trim();
  const password = String(req.body?.password || '');
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user || !user.active) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const passwordOk = await user.comparePassword(password);
  if (!passwordOk) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const token = `token-${user.id}-${Date.now()}`;
  await user.update({ token });

  return res.json({
    success: true,
    message: 'Login successful',
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
}

async function updateProfile(req, res) {
  const userId = Number(req.body.userId);
  if (!userId) return res.status(400).json({ message: 'userId is required.' });

  const user = await findUserById(userId);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  const updates = {};
  if (req.body.name) updates.name = req.body.name;
  if (req.body.email) updates.email = req.body.email;
  if (req.body.password) updates.password = req.body.password;

  await user.update(updates);

  return res.json({
    success: true,
    message: 'Profile updated successfully.',
    user: { id: user.id, name: user.name, email: user.email }
  });
}

module.exports = {
  register,
  login,
  updateProfile
};
