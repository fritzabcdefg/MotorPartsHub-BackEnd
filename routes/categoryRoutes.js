const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory
} = require('../controllers/categoryController');
const { verifyAdmin } = require('../middlewares/auth');

router.get('/', verifyAdmin, getAllCategories);
router.get('/:id', verifyAdmin, getCategory);
router.post('/', verifyAdmin, createCategory);
router.put('/:id', verifyAdmin, updateCategory);
router.delete('/:id', verifyAdmin, deleteCategory);
router.put('/:id/restore', verifyAdmin, restoreCategory);

module.exports = router;