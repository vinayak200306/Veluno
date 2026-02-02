const Order = require('../models/Order');
const Product = require('../models/Product');
const asyncHandler = require('../middleware/asyncHandler');
const mongoose = require('mongoose');

// @desc    Create new order
// @route   POST /api/orders
// @access  Public
exports.createOrder = asyncHandler(async (req, res) => {
    const {
        customerName,
        email,
        phone,
        address,
        products,
        paymentMethod,
        paymentId,
        shippingCost,
        discount,
        notes
    } = req.body;

    // Validate products array
    if (!products || products.length === 0) {
        res.status(400);
        throw new Error('Order must contain at least one product');
    }

    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Prepare order items and validate stock
        const orderItems = [];
        let totalAmount = 0;

        for (const item of products) {
            // Find product
            const product = await Product.findById(item.productId).session(session);

            if (!product) {
                throw new Error(`Product not found: ${item.productId}`);
            }

            if (!product.isActive) {
                throw new Error(`Product is not available: ${product.name}`);
            }

            // Check stock availability
            if (product.stock < item.quantity) {
                throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`);
            }

            // Validate size
            if (!product.sizes.includes(item.size)) {
                throw new Error(`Invalid size ${item.size} for product ${product.name}`);
            }

            // Calculate price (use product's current price)
            const itemPrice = product.finalPrice || product.price;
            const subtotal = itemPrice * item.quantity;

            orderItems.push({
                product: product._id,
                productName: product.name,
                productImage: product.images[0],
                size: item.size,
                color: item.color || '',
                quantity: item.quantity,
                price: itemPrice,
                subtotal: subtotal
            });

            totalAmount += subtotal;

            // Reduce product stock
            product.stock -= item.quantity;
            await product.save({ session });
        }

        // Add shipping cost and subtract discount
        totalAmount += (shippingCost || 0) - (discount || 0);

        // Create order
        const order = await Order.create([{
            customerName,
            email,
            phone,
            address,
            products: orderItems,
            totalAmount,
            paymentMethod: paymentMethod || 'cod',
            paymentId,
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
            orderStatus: 'pending',
            shippingCost: shippingCost || 0,
            discount: discount || 0,
            notes
        }], { session });

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order: order[0]
        });

    } catch (error) {
        // Rollback transaction on error
        await session.abortTransaction();
        session.endSession();

        res.status(400);
        throw new Error(error.message);
    }
});

// @desc    Get all orders (Admin)
// @route   GET /api/admin/orders
// @access  Private/Admin
exports.getAllOrders = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};

    if (req.query.orderStatus) {
        filter.orderStatus = req.query.orderStatus;
    }

    if (req.query.paymentStatus) {
        filter.paymentStatus = req.query.paymentStatus;
    }

    if (req.query.search) {
        filter.$or = [
            { orderNumber: { $regex: req.query.search, $options: 'i' } },
            { customerName: { $regex: req.query.search, $options: 'i' } },
            { email: { $regex: req.query.search, $options: 'i' } },
            { phone: { $regex: req.query.search, $options: 'i' } }
        ];
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
        filter.createdAt = {};
        if (req.query.startDate) {
            filter.createdAt.$gte = new Date(req.query.startDate);
        }
        if (req.query.endDate) {
            filter.createdAt.$lte = new Date(req.query.endDate);
        }
    }

    const total = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
        .populate('products.product', 'name sku')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    res.json({
        success: true,
        count: orders.length,
        total,
        page,
        pages: Math.ceil(total / limit),
        orders
    });
});

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Public (with order number verification)
exports.getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('products.product', 'name sku images')
        .populate('statusHistory.updatedBy', 'name email');

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    res.json({
        success: true,
        order
    });
});

// @desc    Get order by order number
// @route   GET /api/orders/track/:orderNumber
// @access  Public
exports.getOrderByNumber = asyncHandler(async (req, res) => {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber })
        .populate('products.product', 'name sku images');

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    res.json({
        success: true,
        order
    });
});

// @desc    Update order status (Admin)
// @route   PATCH /api/admin/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderStatus, trackingNumber, note } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Update status
    if (orderStatus) {
        order.orderStatus = orderStatus;

        // Update delivered/cancelled timestamps
        if (orderStatus === 'delivered' && !order.deliveredAt) {
            order.deliveredAt = new Date();
        }
        if (orderStatus === 'cancelled' && !order.cancelledAt) {
            order.cancelledAt = new Date();
        }

        // Add to status history
        order.statusHistory.push({
            status: orderStatus,
            timestamp: new Date(),
            updatedBy: req.admin._id,
            note: note || ''
        });
    }

    // Update tracking number
    if (trackingNumber) {
        order.trackingNumber = trackingNumber;
    }

    await order.save();

    res.json({
        success: true,
        message: 'Order status updated successfully',
        order
    });
});

// @desc    Update payment status (Admin)
// @route   PATCH /api/admin/orders/:id/payment
// @access  Private/Admin
exports.updatePaymentStatus = asyncHandler(async (req, res) => {
    const { paymentStatus, paymentId } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (paymentStatus) {
        order.paymentStatus = paymentStatus;
    }

    if (paymentId) {
        order.paymentId = paymentId;
    }

    await order.save();

    res.json({
        success: true,
        message: 'Payment status updated successfully',
        order
    });
});

// @desc    Cancel order (Admin)
// @route   PATCH /api/admin/orders/:id/cancel
// @access  Private/Admin
exports.cancelOrder = asyncHandler(async (req, res) => {
    const { cancelReason } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (order.orderStatus === 'delivered') {
        res.status(400);
        throw new Error('Cannot cancel a delivered order');
    }

    if (order.orderStatus === 'cancelled') {
        res.status(400);
        throw new Error('Order is already cancelled');
    }

    // Start transaction to restore stock
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Restore product stock
        for (const item of order.products) {
            const product = await Product.findById(item.product).session(session);
            if (product) {
                product.stock += item.quantity;
                await product.save({ session });
            }
        }

        // Update order
        order.orderStatus = 'cancelled';
        order.cancelledAt = new Date();
        order.cancelReason = cancelReason || 'Cancelled by admin';

        order.statusHistory.push({
            status: 'cancelled',
            timestamp: new Date(),
            updatedBy: req.admin._id,
            note: cancelReason || 'Cancelled by admin'
        });

        await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.json({
            success: true,
            message: 'Order cancelled successfully and stock restored',
            order
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();

        res.status(400);
        throw new Error(error.message);
    }
});

// @desc    Get order statistics (Admin)
// @route   GET /api/admin/orders/stats
// @access  Private/Admin
exports.getOrderStats = asyncHandler(async (req, res) => {
    const stats = await Order.aggregate([
        {
            $facet: {
                totalOrders: [{ $count: 'count' }],
                totalRevenue: [
                    {
                        $match: { paymentStatus: 'paid' }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: '$totalAmount' }
                        }
                    }
                ],
                ordersByStatus: [
                    {
                        $group: {
                            _id: '$orderStatus',
                            count: { $sum: 1 }
                        }
                    }
                ],
                ordersByPaymentStatus: [
                    {
                        $group: {
                            _id: '$paymentStatus',
                            count: { $sum: 1 }
                        }
                    }
                ],
                recentOrders: [
                    { $sort: { createdAt: -1 } },
                    { $limit: 10 },
                    {
                        $project: {
                            orderNumber: 1,
                            customerName: 1,
                            totalAmount: 1,
                            orderStatus: 1,
                            createdAt: 1
                        }
                    }
                ],
                averageOrderValue: [
                    {
                        $group: {
                            _id: null,
                            avgValue: { $avg: '$totalAmount' }
                        }
                    }
                ]
            }
        }
    ]);

    const result = stats[0];

    res.json({
        success: true,
        stats: {
            totalOrders: result.totalOrders[0]?.count || 0,
            totalRevenue: result.totalRevenue[0]?.total || 0,
            ordersByStatus: result.ordersByStatus,
            ordersByPaymentStatus: result.ordersByPaymentStatus,
            recentOrders: result.recentOrders,
            averageOrderValue: result.averageOrderValue[0]?.avgValue || 0
        }
    });
});
