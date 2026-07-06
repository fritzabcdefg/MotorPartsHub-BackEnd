const db = require('../utils/db');
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

async function updateProfile(req, res) {
  const { userId, title, fname, lname, phone, addressline, town, zipcode } = req.body;
  
  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required.' });
  }

  // Check if a new file was uploaded via multer
  let imagePath = null;
  if (req.file) {
    // Save the relative path so the frontend can read it directly
    imagePath = `/img/avatars/${req.file.filename}`;
  }

  try {
    // 1. Update the Customer details
    let sql = `UPDATE customers SET title=?, fname=?, lname=?, phone=?, addressline=?, town=?, zipcode=?`;
    let params = [title, fname, lname, phone, addressline, town, zipcode];

    // If an image was uploaded, append it to the SQL query
    if (imagePath) {
      sql += `, image=?`;
      params.push(imagePath);
    }
    
    sql += ` WHERE user_id=?`;
    params.push(userId);

    db.query(sql, params, (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error updating profile.' });
      
      res.json({ 
        success: true, 
        message: 'Profile updated successfully!', 
        newImage: imagePath 
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.', error: error.message });
  }
}

// Add these exports at the bottom
module.exports = {
  getUsers,
  updateUserRole,
  deactivateUser,
  getProfile,    // Must include
  updateProfile  // Must include
};

// Ensure these functions exist in the file:
async function getProfile(req, res) {

  const userId = 1; // Change this to your test user ID
  const sql = `SELECT * FROM customers WHERE user_id = ?`;
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: 'DB Error' });
    res.json({ customerDetails: results[0] || {} });
  });
}

async function updateProfile(req, res) {
  // Your update logic...
  res.json({ success: true });
}