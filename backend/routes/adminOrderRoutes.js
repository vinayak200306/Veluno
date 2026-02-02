const express = require('express');
const router = express.Router();
const {
    getAllOrders,
    updateOrderStatus,
    updatePaymentStatus,
    cancelOrder,
    getOrderStats
} = require('../controllers/orderController');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');

// All routes require admin authentication
router.use(protectAdmin);

// Statistics route (must be before /:id routes)
router.get('/stats', getOrderStats);

// Order management routes
router.get('/', getAllOrders);                          // Get all orders
router.patch('/:id/status', updateOrderStatus);         // Update order status
router.patch('/:id/payment', updatePaymentStatus);      // Update payment status
router.patch('/:id/cancel', cancelOrder);               // Cancel order

module.exports = router;
