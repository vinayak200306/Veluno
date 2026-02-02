const express = require('express');
const router = express.Router();
const qikinkService = require('../services/qikinkService');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');

// Sync products from Qikink (Admin only)
router.post('/sync-products', protectAdmin, async (req, res) => {
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
