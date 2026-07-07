// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getAllOrders, 
  updateOrderStatus, 
  getOrderDetails, 
  createOrder, 
  getUserSpecificOrders, 
  downloadReceiptPdf 
} = require('../controllers/orderController');
const { verifyAdmin, verifyToken } = require('../middlewares/auth');
// ─────────────────────────────────────────────────────────
// 1. SPECIFIC / STATIC CUSTOMER ROUTES (MUST GO FIRST)
// ─────────────────────────────────────────────────────────
router.post('/place', verifyToken, createOrder);                         
router.get('/my-orders', verifyToken, getUserSpecificOrders);            
router.get('/:id/receipt/download', downloadReceiptPdf); // Public email link download

// ─────────────────────────────────────────────────────────
// 2. WILDCARD & ADMIN CONTROL ROUTES (MUST GO LAST)
// ─────────────────────────────────────────────────────────
router.get('/', verifyAdmin, getAllOrders);
router.get('/:id', verifyToken, getOrderDetails); // Allowed for logged-in users to view their summary
router.put('/:id/status', verifyAdmin, updateOrderStatus);
router.get('/:id/receipt', verifyAdmin, downloadReceiptPdf); 

module.exports = router;