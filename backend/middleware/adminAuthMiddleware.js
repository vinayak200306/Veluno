const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const asyncHandler = require('./asyncHandler');

// Protect admin routes - verify JWT token
exports.protectAdmin = asyncHandler(async (req, res, next) => {
    let token;

    // Check for token in Authorization header
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Extract token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get admin from token (exclude password)
            req.admin = await Admin.findById(decoded.id).select('-password');

            if (!req.admin) {
                res.status(401);
                throw new Error('Admin not found - authorization denied');
            }

            // Check if admin account is active
            if (!req.admin.isActive) {
                res.status(403);
                throw new Error('Admin account is deactivated');
            }

            next();
        } catch (error) {
            console.error('Admin auth error:', error.message);
            res.status(401);
            throw new Error('Not authorized - invalid token');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized - no token provided');
    }
});

// Superadmin middleware - restrict to superadmin role only
exports.superadminOnly = (req, res, next) => {
    if (req.admin && req.admin.role === 'superadmin') {
        next();
    } else {
        res.status(403);
        throw new Error('Access denied - superadmin privileges required');
    }
};

// Admin role check middleware - allows both admin and superadmin
exports.adminOnly = (req, res, next) => {
    if (req.admin && (req.admin.role === 'admin' || req.admin.role === 'superadmin')) {
        next();
    } else {
        res.status(403);
        throw new Error('Access denied - admin privileges required');
    }
};
