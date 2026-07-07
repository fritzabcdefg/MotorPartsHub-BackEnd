// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { getAllOrders, updateOrderStatus, getOrderDetails, createOrder, getUserSpecificOrders, downloadReceiptPdf } = require('../controllers/orderController');
const { verifyAdmin, verifyToken } = require('../middlewares/auth');

// Admin routing rules
router.get('/', verifyAdmin, getAllOrders);
router.get('/:id', verifyAdmin, getOrderDetails);
router.put('/:id/status', verifyAdmin, updateOrderStatus);
router.get('/:id/receipt', verifyAdmin, downloadReceiptPdf); // Main secure admin panel download channel

// Email-friendly route: Allows users to download receipts via direct email link interaction
router.get('/:id/receipt/download', downloadReceiptPdf); 

// Customer specific actions routing paths
router.post('/place', verifyToken, createOrder);                         
router.get('/my-orders', verifyToken, getUserSpecificOrders);            

module.exports = router;