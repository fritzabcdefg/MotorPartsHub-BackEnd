// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { getAllOrders, updateOrderStatus, getOrderDetails } = require('../controllers/orderController');
const { verifyAdmin } = require('../middlewares/auth');

console.log('getAllOrders type:', typeof getAllOrders);
console.log('updateOrderStatus type:', typeof updateOrderStatus);
console.log('getOrderDetails type:', typeof getOrderDetails);
console.log('verifyAdmin type:', typeof verifyAdmin);

router.get('/', verifyAdmin, getAllOrders);
router.get('/:id', verifyAdmin, getOrderDetails);
router.put('/:id/status', verifyAdmin, updateOrderStatus);

module.exports = router;
