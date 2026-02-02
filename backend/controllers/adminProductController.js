const Product = require('../models/Product');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all products (Admin)
// @route   GET /api/admin/products
// @access  Private/Admin
exports.getAllProducts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    // Filter by category
    if (req.query.category) {
        filter.category = req.query.category;
    }

    // Filter by active status
    if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
    }

    // Filter by featured
    if (req.query.isFeatured !== undefined) {
        filter.isFeatured = req.query.isFeatured === 'true';
    }

    // Filter by stock status
    if (req.query.stockStatus === 'outOfStock') {
        filter.stock = 0;
    } else if (req.query.stockStatus === 'lowStock') {
        filter.stock = { $gt: 0, $lt: 10 };
    }

    // Search by name or description
    if (req.query.search) {
        filter.$text = { $search: req.query.search };
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
        filter.price = {};
        if (req.query.minPrice) filter.price.$gte = parseFloat(req.query.minPrice);
        if (req.query.maxPrice) filter.price.$lte = parseFloat(req.query.maxPrice);
    }

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    // Get products
    const products = await Product.find(filter)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    res.json({
        success: true,
        count: products.length,
        total,
        page,
        pages: Math.ceil(total / limit),
        products
    });
});

// @desc    Get single product by ID (Admin)
// @route   GET /api/admin/products/:id
// @access  Private/Admin
exports.getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    res.json({
        success: true,
        product
    });
});

// @desc    Create new product (Admin)
// @route   POST /api/admin/products
// @access  Private/Admin
exports.createProduct = asyncHandler(async (req, res) => {
    const {
        name,
        description,
        price,
        category,
        sizes,
        stock,
        images,
        sku,
        brand,
        colors,
        isActive,
        isFeatured,
        discount,
        tags
    } = req.body;

    // Create product with admin reference
    const product = await Product.create({
        name,
        description,
        price,
        category,
        sizes,
        stock,
        images,
        sku,
        brand,
        colors,
        isActive,
        isFeatured,
        discount,
        tags,
        createdBy: req.admin._id,
        updatedBy: req.admin._id
    });

    res.status(201).json({
        success: true,
        message: 'Product created successfully',
        product
    });
});

// @desc    Update product (Admin)
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
exports.updateProduct = asyncHandler(async (req, res) => {
    let product = await Product.findById(req.params.id);

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    // Update product and track who updated it
    const updateData = {
        ...req.body,
        updatedBy: req.admin._id
    };

    product = await Product.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
            new: true,
            runValidators: true
        }
    ).populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');

    res.json({
        success: true,
        message: 'Product updated successfully',
        product
    });
});

// @desc    Delete product (Admin)
// @route   DELETE /api/admin/products/:id
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
        message: 'Product deleted successfully',
        deletedProduct: {
            _id: product._id,
            name: product.name,
            sku: product.sku
        }
    });
});

// @desc    Toggle product active status (Admin)
// @route   PATCH /api/admin/products/:id/toggle-active
// @access  Private/Admin
exports.toggleProductActive = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    product.isActive = !product.isActive;
    product.updatedBy = req.admin._id;
    await product.save();

    res.json({
        success: true,
        message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
        product
    });
});

// @desc    Toggle product featured status (Admin)
// @route   PATCH /api/admin/products/:id/toggle-featured
// @access  Private/Admin
exports.toggleProductFeatured = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    product.isFeatured = !product.isFeatured;
    product.updatedBy = req.admin._id;
    await product.save();

    res.json({
        success: true,
        message: `Product ${product.isFeatured ? 'marked as featured' : 'removed from featured'} successfully`,
        product
    });
});

// @desc    Update product stock (Admin)
// @route   PATCH /api/admin/products/:id/stock
// @access  Private/Admin
exports.updateProductStock = asyncHandler(async (req, res) => {
    const { stock } = req.body;

    if (stock === undefined || stock < 0) {
        res.status(400);
        throw new Error('Please provide a valid stock quantity');
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    product.stock = stock;
    product.updatedBy = req.admin._id;
    await product.save();

    res.json({
        success: true,
        message: 'Stock updated successfully',
        product
    });
});

// @desc    Bulk delete products (Admin)
// @route   POST /api/admin/products/bulk-delete
// @access  Private/Admin
exports.bulkDeleteProducts = asyncHandler(async (req, res) => {
    const { productIds } = req.body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        res.status(400);
        throw new Error('Please provide an array of product IDs');
    }

    const result = await Product.deleteMany({
        _id: { $in: productIds }
    });

    res.json({
        success: true,
        message: `${result.deletedCount} product(s) deleted successfully`,
        deletedCount: result.deletedCount
    });
});

// @desc    Get product statistics (Admin)
// @route   GET /api/admin/products/stats
// @access  Private/Admin
exports.getProductStats = asyncHandler(async (req, res) => {
    const stats = await Product.aggregate([
        {
            $facet: {
                totalProducts: [{ $count: 'count' }],
                activeProducts: [
                    { $match: { isActive: true } },
                    { $count: 'count' }
                ],
                featuredProducts: [
                    { $match: { isFeatured: true } },
                    { $count: 'count' }
                ],
                outOfStock: [
                    { $match: { stock: 0 } },
                    { $count: 'count' }
                ],
                lowStock: [
                    { $match: { stock: { $gt: 0, $lt: 10 } } },
                    { $count: 'count' }
                ],
                categoryBreakdown: [
                    { $group: { _id: '$category', count: { $sum: 1 } } }
                ],
                averagePrice: [
                    { $group: { _id: null, avgPrice: { $avg: '$price' } } }
                ],
                totalInventoryValue: [
                    {
                        $group: {
                            _id: null,
                            totalValue: { $sum: { $multiply: ['$price', '$stock'] } }
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
            totalProducts: result.totalProducts[0]?.count || 0,
            activeProducts: result.activeProducts[0]?.count || 0,
            featuredProducts: result.featuredProducts[0]?.count || 0,
            outOfStock: result.outOfStock[0]?.count || 0,
            lowStock: result.lowStock[0]?.count || 0,
            categoryBreakdown: result.categoryBreakdown,
            averagePrice: result.averagePrice[0]?.avgPrice || 0,
            totalInventoryValue: result.totalInventoryValue[0]?.totalValue || 0
        }
    });
});
