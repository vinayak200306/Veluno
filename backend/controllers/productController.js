const Product = require('../models/Product');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = asyncHandler(async (req, res) => {
    const pageSize = 12;
    const page = Number(req.query.page) || 1;

    const keyword = req.query.keyword
        ? {
            $or: [
                { name: { $regex: req.query.keyword, $options: 'i' } },
                { description: { $regex: req.query.keyword, $options: 'i' } }
            ]
        }
        : {};

    const filters = { ...keyword, isActive: true };

    // Add category filter
    if (req.query.category) {
        filters.category = req.query.category;
    }

    // Add price range filter
    if (req.query.minPrice || req.query.maxPrice) {
        filters.price = {};
        if (req.query.minPrice) filters.price.$gte = Number(req.query.minPrice);
        if (req.query.maxPrice) filters.price.$lte = Number(req.query.maxPrice);
    }

    const count = await Product.countDocuments(filters);
    const products = await Product.find(filters)
        .populate('category', 'name slug')
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        products,
        page,
        pages: Math.ceil(count / pageSize),
        total: count
    });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate('category', 'name slug')
        .populate('reviews.user', 'name');

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    res.json({
        success: true,
        product
    });
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = asyncHandler(async (req, res) => {
    const product = await Product.create(req.body);

    res.status(201).json({
        success: true,
        product
    });
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    );

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    res.json({
        success: true,
        product
    });
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    await product.deleteOne();

    res.json({
        success: true,
        message: 'Product deleted successfully'
    });
});

// @desc    Create product review
// @route   POST /api/products/:id/reviews
// @access  Private
exports.createProductReview = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    // Check if user already reviewed
    const alreadyReviewed = product.reviews.find(
        (review) => review.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
        res.status(400);
        throw new Error('Product already reviewed');
    }

    const review = {
        name: req.user.name,
        rating: Number(rating),
        comment,
        user: req.user._id
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;

    await product.save();

    res.status(201).json({
        success: true,
        message: 'Review added'
    });
});
