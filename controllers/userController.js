const { getAllUsers, findUserByEmail, findUserById } = require('../utils/userHelpers');

async function getUsers(req, res) {
  try {
    const allUsers = await getAllUsers();
    const userList = allUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role || 'user',
      active: u.active
    }));
    res.json({ success: true, users: userList });
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch users.', error: error.message });
  }
}

async function updateUserRole(req, res) {
  const userId = Number(req.params.id);
  const { role } = req.body;
  if (!role || !['user', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Valid role is required (user or admin).' });
  }

  const user = await findUserById(userId, true);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  await user.update({ role });

  return res.json({ success: true, message: 'User role updated.', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}

async function deactivateUser(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  const user = await findUserByEmail(email, true);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  await user.update({ active: false });

  return res.json({ success: true, message: 'User account deactivated.' });
}

module.exports = {
  getUsers,
  updateUserRole,
  deactivateUser
};
