const Admin = require('../models/Admin');
const asyncHandler = require('../middleware/asyncHandler');
const { generateToken } = require('../utils/tokenUtils');

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
exports.loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
        res.status(400);
        throw new Error('Please provide email and password');
    }

    // Find admin by email and include password field
    const admin = await Admin.findOne({ email }).select('+password');

    // Check if admin exists and password matches
    if (!admin) {
        res.status(401);
        throw new Error('Invalid credentials');
    }

    // Check if admin account is active
    if (!admin.isActive) {
        res.status(403);
        throw new Error('Admin account is deactivated');
    }

    // Verify password
    const isPasswordMatch = await admin.matchPassword(password);

    if (!isPasswordMatch) {
        res.status(401);
        throw new Error('Invalid credentials');
    }

    // Update last login
    admin.lastLogin = Date.now();
    await admin.save();

    // Generate JWT token
    const token = generateToken(admin._id);

    res.json({
        success: true,
        message: 'Login successful',
        admin: {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role
        },
        token
    });
});

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private (Admin only)
exports.getAdminProfile = asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.admin._id);

    if (!admin) {
        res.status(404);
        throw new Error('Admin not found');
    }

    res.json({
        success: true,
        admin: {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            lastLogin: admin.lastLogin,
            createdAt: admin.createdAt
        }
    });
});

// @desc    Create new admin (superadmin only)
// @route   POST /api/admin/create
// @access  Private (Superadmin only)
exports.createAdmin = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    // Check if admin already exists
    const adminExists = await Admin.findOne({ email });

    if (adminExists) {
        res.status(400);
        throw new Error('Admin with this email already exists');
    }

    // Create admin
    const admin = await Admin.create({
        name,
        email,
        password,
        role: role || 'admin',
        createdBy: req.admin._id
    });

    res.status(201).json({
        success: true,
        message: 'Admin created successfully',
        admin: {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role
        }
    });
});

// @desc    Update admin password
// @route   PUT /api/admin/password
// @access  Private (Admin only)
exports.updatePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        res.status(400);
        throw new Error('Please provide current and new password');
    }

    // Get admin with password
    const admin = await Admin.findById(req.admin._id).select('+password');

    if (!admin) {
        res.status(404);
        throw new Error('Admin not found');
    }

    // Verify current password
    const isMatch = await admin.matchPassword(currentPassword);

    if (!isMatch) {
        res.status(401);
        throw new Error('Current password is incorrect');
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.json({
        success: true,
        message: 'Password updated successfully'
    });
});

// @desc    Get all admins (superadmin only)
// @route   GET /api/admin/list
// @access  Private (Superadmin only)
exports.getAllAdmins = asyncHandler(async (req, res) => {
    const admins = await Admin.find({})
        .select('-password')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        count: admins.length,
        admins
    });
});

// @desc    Deactivate admin (superadmin only)
// @route   PUT /api/admin/:id/deactivate
// @access  Private (Superadmin only)
exports.deactivateAdmin = asyncHandler(async (req, res) => {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
        res.status(404);
        throw new Error('Admin not found');
    }

    // Prevent deactivating self
    if (admin._id.toString() === req.admin._id.toString()) {
        res.status(400);
        throw new Error('Cannot deactivate your own account');
    }

    admin.isActive = false;
    await admin.save();

    res.json({
        success: true,
        message: 'Admin deactivated successfully'
    });
});
