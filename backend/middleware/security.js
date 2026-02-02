const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for authentication routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    message: {
        success: false,
        error: 'Too many login attempts, please try again after 15 minutes.'
    },
    skipSuccessfulRequests: true, // Don't count successful requests
});

// Payment route limiter
const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 payment attempts per hour
    message: {
        success: false,
        error: 'Too many payment attempts, please try again later.'
    },
});

// Order creation limiter
const orderLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // Limit each IP to 20 orders per hour
    message: {
        success: false,
        error: 'Too many orders created, please try again later.'
    },
});

module.exports = {
    apiLimiter,
    authLimiter,
    paymentLimiter,
    orderLimiter
};
