const express = require('express');
const router = express.Router();
const { getAllOrders, updateOrderStatus, getOrderDetails } = require('../controllers/orderController');
const { verifyAdmin } = require('../middlewares/auth');

router.get('/', verifyAdmin, getAllOrders);
router.get('/:id', verifyAdmin, getOrderDetails); // New details lookup endpoint
router.put('/:id/status', verifyAdmin, updateOrderStatus);

module.exports = router;