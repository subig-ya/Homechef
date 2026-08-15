const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Where uploaded images live. Created automatically on first boot.
const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

// Store each upload with a unique, safe filename (timestamp + sanitized ext).
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

// Images only, and reject anything larger than 5 MB. Both the file extension
// AND the declared MIME type must be an allowed image type.
const ALLOWED_IMAGE_EXT = /\.(jpg|jpeg|png|webp|gif)$/i;
const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const fileFilter = (req, file, cb) => {
  const extOk = ALLOWED_IMAGE_EXT.test(file.originalname || '');
  const mimeOk = ALLOWED_IMAGE_MIME.has(file.mimetype || '');

  if (extOk && mimeOk) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, jpeg, png, webp, gif) are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// POST /api/upload — logged-in users can upload a food/photo image.
// Returns an absolute URL the client stores on the menu item.
router.post('/', protect, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No image file was uploaded.' });
  }

  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

  res.status(201).json({
    success: true,
    message: 'Image uploaded successfully',
    data: { url, filename: req.file.filename }
  });
});

module.exports = router;
