const express = require('express');
const { register, login, updateProfile } = require('../controllers/authController');
const { upload } = require('../utils/upload');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/update-profile', upload.single('avatar'), updateProfile);

module.exports = router;
