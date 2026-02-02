const express = require('express');
const router = express.Router();
const qikinkService = require('../services/qikinkService');
const { protect, admin } = require('../middleware/authMiddleware');

// Sync products from Qikink (Admin only)
router.post('/sync-products', protect, admin, async (req, res) => {
    try {
        const result = await qikinkService.syncProducts();
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message || 'Sync failed' });
    }
});

// Qikink webhook endpoint
router.post('/webhook', async (req, res) => {
    try {
        await qikinkService.handleQikinkWebhook(req.body);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
