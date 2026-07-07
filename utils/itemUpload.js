const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Dedicated upload folder just for item photos (main image + product_images),
// separate from the avatars upload folder used elsewhere in the app.
const itemUploadDir = path.join(__dirname, '..', 'uploads', 'items');

if (!fs.existsSync(itemUploadDir)) {
  fs.mkdirSync(itemUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, itemUploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_.]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const itemUpload = multer({ storage });

module.exports = {
  itemUploadDir,
  itemUpload
};