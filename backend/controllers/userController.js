const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { generateToken } = require('../utils/tokenUtils');

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
exports.registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        name,
        email,
        password
    });

    if (user) {
        res.status(201).json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token: generateToken(user._id)
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
exports.loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
        user.lastLogin = Date.now();
        await user.save();

        res.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token: generateToken(user._id)
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate('wishlist');

    if (user) {
        res.json({
            success: true,
            user
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.phone = req.body.phone || user.phone;

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            success: true,
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role
            },
            token: generateToken(updatedUser._id)
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Add address
// @route   POST /api/users/addresses
// @access  Private
exports.addAddress = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        // If this is the first address or marked as default, set it as default
        if (user.addresses.length === 0 || req.body.isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }

        user.addresses.push(req.body);
        await user.save();

        res.status(201).json({
            success: true,
            addresses: user.addresses
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Toggle wishlist item
// @route   POST /api/users/wishlist/:productId
// @access  Private
exports.toggleWishlist = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        const productId = req.params.productId;
        const index = user.wishlist.indexOf(productId);

        if (index > -1) {
            user.wishlist.splice(index, 1);
        } else {
            user.wishlist.push(productId);
        }

        await user.save();

        res.json({
            success: true,
            wishlist: user.wishlist
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});
