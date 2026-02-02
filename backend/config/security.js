const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

// Helmet configuration for security headers
const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "checkout.razorpay.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "api.razorpay.com"],
            frameSrc: ["'self'", "api.razorpay.com"],
        },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding for payment gateways
    crossOriginResourcePolicy: { policy: "cross-origin" },
});

// MongoDB sanitization to prevent NoSQL injection
const mongoSanitizeConfig = mongoSanitize({
    replaceWith: '_', // Replace prohibited characters with underscore
    onSanitize: ({ req, key }) => {
        console.warn(`Sanitized request: ${key} in ${req.path}`);
    },
});

// HPP (HTTP Parameter Pollution) protection
const hppConfig = hpp({
    whitelist: [
        'price',
        'category',
        'size',
        'color',
        'page',
        'limit',
        'sort',
        'orderStatus',
        'paymentStatus'
    ]
});

module.exports = {
    helmetConfig,
    mongoSanitizeConfig,
    hppConfig
};
