const db = require('../utils/db');
const { User } = require('../models');
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
async function updateProfile(req, res) {
  try {
    const { userId, title, fname, lname, phone, addressline, town, zipcode } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }

    // ADDED: handle password change through Sequelize so bcrypt hook fires
    const newPassword = req.body.password ? req.body.password.trim() : null;
    if (newPassword) {
      const user = await User.findByPk(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
      // Assigning triggers user.changed('password') = true, so beforeUpdate hook hashes it
      user.password = newPassword;
      await user.save();
    }

    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    let sql;
    let queryParams;

    if (imagePath) {
      sql = `
        UPDATE customers 
        SET title = ?, fname = ?, lname = ?, phone = ?, addressline = ?, town = ?, zipcode = ?, image = ? 
        WHERE user_id = ?
      `;
      queryParams = [title, fname, lname, phone, addressline, town, zipcode, imagePath, userId];
    } else {
      sql = `
        UPDATE customers 
        SET title = ?, fname = ?, lname = ?, phone = ?, addressline = ?, town = ?, zipcode = ? 
        WHERE user_id = ?
      `;
      queryParams = [title, fname, lname, phone, addressline, town, zipcode, userId];
    }

    db.query(sql, queryParams, (err, result) => {
      if (err) {
        console.error("MySQL Update Error:", err);
        return res.status(500).json({ success: false, message: 'Database failed to save profile.' });
      }

      return res.json({
        success: true,
        message: 'Profile updated successfully!',
        savedImagePath: imagePath
      });
    });

  } catch (error) {
    console.error("Controller Error:", error);
    res.status(500).json({ success: false, message: 'Internal server saving error.' });
  }
}

const getProfile = (req, res) => {

  const userId = req.user.id;

  const userQuery = 'SELECT id, email, role FROM users WHERE id = ?';

  db.query(userQuery, [userId], (userErr, userResults) => {
    if (userErr) {
      console.error("❌ Database error pulling from 'users' table:", userErr);
      return res.status(500).json({ success: false, message: "Database server failure." });
    }

    if (userResults.length === 0) {
      return res.status(404).json({ success: false, message: "Target account identity record not found." });
    }

    const userData = userResults[0];

    // 3. Fetch Shipping, Avatar, and Profile Schema Data
    const customerQuery = 'SELECT * FROM customers WHERE user_id = ?';

    db.query(customerQuery, [userId], (custErr, custResults) => {
      if (custErr) {
        console.error("❌ Database error pulling from 'customers' table:", custErr);
        return res.status(500).json({ success: false, message: "Profile database server failure." });
      }

      // 4. Default Schema Fallback Guard
      // If the row doesn't exist yet, pass a clean object configuration back
      const customerData = custResults[0] || {
        title: 'Mr.',
        fname: '',
        lname: '',
        phone: '',
        addressline: '',
        town: '',
        zipcode: '',
        image: '/img/avatars/default.png' // Default placeholder asset location
      };

      return res.status(200).json({
        user: userData,
        customerDetails: customerData
      });
    });
  });
};
  module.exports = {
  getUsers,
  updateUserRole,
  deactivateUser,
  getProfile,     
  updateProfile   
};
