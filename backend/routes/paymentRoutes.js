const express = require('express');
const router = express.Router();
const {
    createRazorpayOrder,
    verifyRazorpayPayment,
    getPaymentDetails,
    refundPayment,
    razorpayWebhook
} = require('../controllers/paymentController');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');

// Public routes
router.post('/create-order', createRazorpayOrder);
router.post('/verify', verifyRazorpayPayment);
router.post('/webhook', razorpayWebhook);

// Admin routes
router.get('/:paymentId', protectAdmin, getPaymentDetails);
router.post('/refund', protectAdmin, refundPayment);

module.exports = router;
