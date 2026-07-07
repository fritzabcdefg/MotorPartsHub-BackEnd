const express = require('express');
const { register, login, updateProfile } = require('../controllers/authController');
const { upload } = require('../utils/upload');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify-email', authController.verifyEmail);
router.post('/setup-profile', upload.single('avatar'), authController.setupProfile); 
router.post('/update-profile', upload.single('avatar'), updateProfile);

module.exports = router;