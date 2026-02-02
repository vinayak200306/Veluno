const razorpay = require('../config/razorpay');
const crypto = require('crypto');
const asyncHandler = require('../middleware/asyncHandler');
const Order = require('../models/Order');

// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
// @access  Public
exports.createRazorpayOrder = asyncHandler(async (req, res) => {
    const { amount, currency, receipt, notes } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
        res.status(400);
        throw new Error('Please provide a valid amount');
    }

    // Create Razorpay order options
    const options = {
        amount: amount * 100, // Razorpay expects amount in paise (smallest currency unit)
        currency: currency || 'INR',
        receipt: receipt || `receipt_${Date.now()}`,
        notes: notes || {}
    };

    try {
        // Create order on Razorpay
        const razorpayOrder = await razorpay.orders.create(options);

        res.status(201).json({
            success: true,
            message: 'Razorpay order created successfully',
            order: {
                id: razorpayOrder.id,
                amount: razorpayOrder.amount / 100, // Convert back to rupees
                currency: razorpayOrder.currency,
                receipt: razorpayOrder.receipt,
                status: razorpayOrder.status
            },
            // Send key_id to frontend for Razorpay checkout
            key_id: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Razorpay order creation error:', error);
        res.status(500);
        throw new Error('Failed to create Razorpay order');
    }
});

// @desc    Verify Razorpay payment signature
// @route   POST /api/payment/verify
// @access  Public
exports.verifyRazorpayPayment = asyncHandler(async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        orderData
    } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        res.status(400);
        throw new Error('Missing payment verification parameters');
    }

    try {
        // Generate signature for verification
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        // Verify signature
        if (generatedSignature === razorpay_signature) {
            // Payment is verified - Create order in database
            if (orderData) {
                const order = await Order.create({
                    ...orderData,
                    paymentStatus: 'paid',
                    paymentMethod: 'card',
                    paymentId: razorpay_payment_id
                });

                res.json({
                    success: true,
                    message: 'Payment verified successfully',
                    verified: true,
                    paymentId: razorpay_payment_id,
                    order: order
                });
            } else {
                res.json({
                    success: true,
                    message: 'Payment verified successfully',
                    verified: true,
                    paymentId: razorpay_payment_id
                });
            }
        } else {
            // Signature mismatch - Payment verification failed
            res.status(400);
            throw new Error('Payment verification failed - Invalid signature');
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(400);
        throw new Error(error.message || 'Payment verification failed');
    }
});

// @desc    Get payment details
// @route   GET /api/payment/:paymentId
// @access  Private/Admin
exports.getPaymentDetails = asyncHandler(async (req, res) => {
    const { paymentId } = req.params;

    try {
        // Fetch payment details from Razorpay
        const payment = await razorpay.payments.fetch(paymentId);

        // Return only safe, non-sensitive information
        res.json({
            success: true,
            payment: {
                id: payment.id,
                amount: payment.amount / 100,
                currency: payment.currency,
                status: payment.status,
                method: payment.method,
                email: payment.email,
                contact: payment.contact,
                createdAt: new Date(payment.created_at * 1000),
                // DO NOT send card details, CVV, or any sensitive info
            }
        });
    } catch (error) {
        console.error('Error fetching payment details:', error);
        res.status(500);
        throw new Error('Failed to fetch payment details');
    }
});

// @desc    Refund payment
// @route   POST /api/payment/refund
// @access  Private/Admin
exports.refundPayment = asyncHandler(async (req, res) => {
    const { paymentId, amount, notes } = req.body;

    if (!paymentId) {
        res.status(400);
        throw new Error('Payment ID is required');
    }

    try {
        const refundOptions = {
            amount: amount ? amount * 100 : undefined, // Partial or full refund
            notes: notes || {}
        };

        const refund = await razorpay.payments.refund(paymentId, refundOptions);

        // Update order payment status in database
        const order = await Order.findOne({ paymentId });
        if (order) {
            order.paymentStatus = 'refunded';
            await order.save();
        }

        res.json({
            success: true,
            message: 'Refund processed successfully',
            refund: {
                id: refund.id,
                amount: refund.amount / 100,
                status: refund.status,
                paymentId: refund.payment_id
            }
        });
    } catch (error) {
        console.error('Refund error:', error);
        res.status(500);
        throw new Error('Failed to process refund');
    }
});

// @desc    Webhook handler for Razorpay events
// @route   POST /api/payment/webhook
// @access  Public (but verified)
exports.razorpayWebhook = asyncHandler(async (req, res) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    try {
        // Verify webhook signature
        const generatedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (generatedSignature === signature) {
            const event = req.body.event;
            const payload = req.body.payload.payment.entity;

            // Handle different webhook events
            switch (event) {
                case 'payment.authorized':
                    console.log('Payment authorized:', payload.id);
                    break;

                case 'payment.captured':
                    console.log('Payment captured:', payload.id);
                    // Update order status in database
                    await Order.findOneAndUpdate(
                        { paymentId: payload.id },
                        { paymentStatus: 'paid' }
                    );
                    break;

                case 'payment.failed':
                    console.log('Payment failed:', payload.id);
                    // Update order status
                    await Order.findOneAndUpdate(
                        { paymentId: payload.id },
                        { paymentStatus: 'failed' }
                    );
                    break;

                default:
                    console.log('Unhandled webhook event:', event);
            }

            res.json({ success: true, message: 'Webhook processed' });
        } else {
            res.status(400);
            throw new Error('Invalid webhook signature');
        }
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400);
        throw new Error('Webhook processing failed');
    }
});
