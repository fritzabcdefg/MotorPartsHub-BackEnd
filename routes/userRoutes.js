const express = require('express');
const { getUsers, updateUserRole, deactivateUser } = require('../controllers/userController');
const { verifyAdmin } = require('../middlewares/auth');

const router = express.Router();

router.get('/', verifyAdmin, getUsers);
router.put('/:id/role', verifyAdmin, updateUserRole);
router.delete('/deactivate', verifyAdmin, deactivateUser);

module.exports = router;
