// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { getAllOrders, updateOrderStatus, getOrderDetails, createOrder, getUserSpecificOrders } = require('../controllers/orderController');
const { verifyAdmin, verifyToken } = require('../middlewares/auth');

console.log('getAllOrders type:', typeof getAllOrders);
console.log('updateOrderStatus type:', typeof updateOrderStatus);
console.log('getOrderDetails type:', typeof getOrderDetails);
console.log('verifyAdmin type:', typeof verifyAdmin);

// Admin routes
router.get('/', verifyAdmin, getAllOrders);
router.get('/:id', verifyAdmin, getOrderDetails);
router.put('/:id/status', verifyAdmin, updateOrderStatus);

// User routes
router.post('/place', verifyToken, createOrder);                         
router.get('/my-orders', verifyToken, getUserSpecificOrders);            

module.exports = router;