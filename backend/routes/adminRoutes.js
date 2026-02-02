const express = require('express');
const router = express.Router();
const {
    loginAdmin,
    getAdminProfile,
    createAdmin,
    updatePassword,
    getAllAdmins,
    deactivateAdmin
} = require('../controllers/adminAuthController');
const { protectAdmin, superadminOnly } = require('../middleware/adminAuthMiddleware');

// Public routes
router.post('/login', loginAdmin);

// Protected admin routes
router.get('/profile', protectAdmin, getAdminProfile);
router.put('/password', protectAdmin, updatePassword);

// Superadmin only routes
router.post('/create', protectAdmin, superadminOnly, createAdmin);
router.get('/list', protectAdmin, superadminOnly, getAllAdmins);
router.put('/:id/deactivate', protectAdmin, superadminOnly, deactivateAdmin);

module.exports = router;
