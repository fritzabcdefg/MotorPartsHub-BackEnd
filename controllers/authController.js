const { User, sequelize } = require('../models');
const { findUserById } = require('../utils/userHelpers');
const { sendActivationEmail } = require('../utils/emailService');
const { frontendOrigins } = require('../utils/config');
const jwt = require('jsonwebtoken');                                    
const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_secret_key'; 

// ==========================================
// 1. REGISTER (Handles Active & Inactive Accounts)
// ==========================================
async function register(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    // FIX: Look up the email directly via Sequelize to find BOTH active and inactive records
    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    
    if (existingUser) {
      if (existingUser.active) {
        return res.status(400).json({ message: 'Email is already registered and active.' });
      } else {
        // Smart Recovery: If account is inactive, generate a fresh token and resend the email
        const newActivationToken = `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        await existingUser.update({ 
          token: newActivationToken,
          password: password // Updates password in case they changed it on retry
        });

        await sendActivationEmail(existingUser.email, newActivationToken);

        return res.status(200).json({
          success: true,
          message: 'This account is unverified. A new activation link has been sent to your Mailtrap sandbox!'
        });
      }
    }

    // Process fresh registration if email is totally unique
    const activationToken = `act-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const placeholderName = normalizedEmail.split('@')[0];

    await User.create({
      name: placeholderName,
      email: normalizedEmail,
      password: password, 
      active: 0,
      role: 'user',
      token: activationToken
    });

    await sendActivationEmail(normalizedEmail, activationToken);

    return res.status(201).json({
      success: true,
      message: 'Registration successful! Check your Mailtrap sandbox for the activation link.'
    });
  } catch (err) {
    console.error("❌ REGISTER ERROR:", err);

    if (err.errors && Array.isArray(err.errors)) {
      const detailedErrors = err.errors.map(e => `${e.path}: ${e.message}`).join(', ');
      return res.status(500).json({ message: `Database Validation Error -> ${detailedErrors}` });
    }

    return res.status(500).json({ message: err.message || 'Internal Server Error' });
  }
}

// ==========================================
// 2. LOGIN
// ==========================================
async function login(req, res) {
  const email = String(req.body?.email || '').trim();
  const password = String(req.body?.password || '');
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ where: { email: normalizedEmail } });
  
  // Enforce checking that they are verified before letting them log in
  if (!user || !user.active) {
    return res.status(401).json({ message: 'Invalid email/password, or your account is unactivated.' });
  }

  const passwordOk = await user.comparePassword(password);
  if (!passwordOk) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  await user.update({ token });

  return res.json({
    success: true,
    message: 'Login successful',
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
}

// ==========================================
// 3. VERIFY EMAIL
// ==========================================
async function verifyEmail(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).send('Verification token missing.');

  try {
    const user = await User.findOne({ where: { token } });
    if (!user) return res.status(400).send('Invalid or expired activation token.');

    const sessionToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    await user.update({
      active: 1,
      token: sessionToken 
    });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4000';
    return res.redirect(`${baseUrl}/setup-profile.html?token=${sessionToken}&userId=${user.id}&email=${user.email}`);  } catch (err) {
    return res.status(500).send('Error during verification processing.');
  }
}

// ==========================================
// 4. SETUP CUSTOMER PROFILE (Detailed Validation)
// ==========================================
async function setupProfile(req, res) {
  const { userId, title, fname, lname, addressline, town, zipcode, phone } = req.body;

  if (!userId) return res.status(400).json({ message: 'Profile Setup Error: Missing userId parameter from activation link.' });
  if (!fname || !fname.trim()) return res.status(400).json({ message: 'Profile Setup Error: First Name field is required.' });
  if (!lname || !lname.trim()) return res.status(400).json({ message: 'Profile Setup Error: Last Name field is required.' });
  if (!addressline || !addressline.trim()) return res.status(400).json({ message: 'Profile Setup Error: Address Line field is required.' });
  if (!town || !town.trim()) return res.status(400).json({ message: 'Profile Setup Error: Town/City field is required.' });

  // ADDED: read the uploaded avatar path, matching the /uploads static route
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Profile Setup Error: Active User account not found in database.' });

    await user.update({ name: `${fname.trim()} ${lname.trim()}` });

    // CHANGED: added image column
    await sequelize.query(
      `INSERT INTO customers (title, fname, lname, addressline, town, zipcode, phone, image, user_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      { 
        replacements: [
          title || 'Mr.', 
          fname.trim(), 
          lname.trim(), 
          addressline.trim(), 
          town.trim(), 
          zipcode?.trim() || null, 
          phone?.trim() || null, 
          imagePath,
          userId
        ] 
      }
    );

    return res.json({ success: true, message: 'Customer record and setup complete!' });
  } catch (err) {
    console.error("❌ SETUP PROFILE DATABASE ERROR:", err);
    return res.status(500).json({ message: `Database Write Error: ${err.message}` });
  }
}

// ==========================================
// 5. UPDATE PROFILE
// ==========================================
async function updateProfile(req, res) {
  const userId = Number(req.body.userId);
  if (!userId) return res.status(400).json({ message: 'userId is required.' });

  const user = await User.findByPk(userId);
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
  verifyEmail,
  setupProfile,
  updateProfile
};