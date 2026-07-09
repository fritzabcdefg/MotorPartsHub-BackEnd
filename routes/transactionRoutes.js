const express = require('express');
const router = express.Router();
const {
  listTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction
} = require('../controllers/transactionController');
const { verifyAdmin, verifyToken } = require('../middlewares/auth');

router.get('/', verifyAdmin, listTransactions);
router.get('/:id', verifyAdmin, getTransactionById);
router.post('/', verifyToken, createTransaction);
router.put('/:id', verifyToken, updateTransaction);
router.delete('/:id', verifyAdmin, deleteTransaction);

module.exports = router;
