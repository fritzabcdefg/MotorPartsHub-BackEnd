const express = require('express');
const {
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  restoreItem,
  deletePhoto
} = require('../controllers/itemController');
const { verifyAdmin } = require('../middlewares/auth');
const { itemUpload } = require('../utils/itemUpload');

const router = express.Router();

const itemUploadFields = itemUpload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'photos', maxCount: 10 }
]);

router.get('/', listItems);
router.get('/:id', getItem);
router.post('/', verifyAdmin, itemUploadFields, createItem);
router.put('/:id', verifyAdmin, itemUploadFields, updateItem);
router.delete('/:id', verifyAdmin, deleteItem);
router.put('/:id/restore', verifyAdmin, restoreItem);
router.delete('/:id/photos/:photoId', verifyAdmin, deletePhoto);

module.exports = router;