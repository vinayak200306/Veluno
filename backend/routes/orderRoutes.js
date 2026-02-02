const express = require('express');
const router = express.Router();
const {
    createOrder,
    getOrderById,
    getOrderByNumber
} = require('../controllers/orderController');

// Public routes
router.post('/', createOrder);                          // Create order
router.get('/:id', getOrderById);                       // Get order by ID
router.get('/track/:orderNumber', getOrderByNumber);    // Track order by number

module.exports = router;
