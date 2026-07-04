const express = require('express');
const { listItems, getItem, createItem, updateItem, deleteItem } = require('../controllers/itemController');
const { verifyAdmin } = require('../middlewares/auth');
const { upload } = require('../utils/upload');

const router = express.Router();

router.get('/', listItems);
router.get('/:id', getItem);
router.post('/', verifyAdmin, upload.single('image'), createItem);
router.put('/:id', verifyAdmin, upload.single('image'), updateItem);
router.delete('/:id', verifyAdmin, deleteItem);

module.exports = router;
