const express = require('express');
const router = express.Router();
const { parser } = require('../config/cloudinary');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, admin, parser.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    res.json({
        success: true,
        imageUrl: req.file.path, // Cloudinary returns the URL in 'path'
        message: 'Image uploaded successfully'
    });
});

module.exports = router;
