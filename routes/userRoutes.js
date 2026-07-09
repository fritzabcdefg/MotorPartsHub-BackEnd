const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getUsers, updateUserRole, deactivateUser } = require('../controllers/userController');
const { verifyToken, verifyAdmin } = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const { uploadDir } = require('../utils/config'); 

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const userId = req.body.userId || 'unknown';
    cb(null, `avatar-${userId}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

router.get('/', verifyAdmin, getUsers);
router.put('/:id/role', verifyAdmin, updateUserRole);

router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, upload.single('avatar'), updateProfile);

module.exports = router;