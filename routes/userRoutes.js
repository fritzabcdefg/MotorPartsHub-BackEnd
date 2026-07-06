const express = require('express');
const multer = require('multer'); // Ensure multer is required
const { 
  getUsers, 
  updateUserRole, 
  deactivateUser, 
  updateProfile, // Add this
  getProfile     // Add this
} = require('../controllers/userController');
const { verifyAdmin } = require('../middlewares/auth');

const router = express.Router();

// --- ADD THESE TWO LINES ---
router.get('/profile', getProfile); 
router.put('/profile', multer({ dest: 'public/img/avatars/' }).single('avatar'), updateProfile);
// ---------------------------

router.get('/', verifyAdmin, getUsers);
router.put('/:id/role', verifyAdmin, updateUserRole);
router.delete('/deactivate', verifyAdmin, deactivateUser);

module.exports = router;