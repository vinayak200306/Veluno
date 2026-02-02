const Category = require('../models/Category');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find({ isActive: true })
        .populate('parent', 'name slug')
        .sort({ sortOrder: 1, name: 1 });

    res.json({
        success: true,
        categories
    });
});

// @desc    Get category by ID or slug
// @route   GET /api/categories/:identifier
// @access  Public
exports.getCategoryByIdentifier = asyncHandler(async (req, res) => {
    const { identifier } = req.params;

    // Try to find by ID first, then by slug
    let category = await Category.findById(identifier).populate('parent', 'name slug');

    if (!category) {
        category = await Category.findOne({ slug: identifier }).populate('parent', 'name slug');
    }

    if (!category) {
        res.status(404);
        throw new Error('Category not found');
    }

    res.json({
        success: true,
        category
    });
});

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = asyncHandler(async (req, res) => {
    const category = await Category.create(req.body);

    res.status(201).json({
        success: true,
        category
    });
});

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = asyncHandler(async (req, res) => {
    const category = await Category.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    );

    if (!category) {
        res.status(404);
        throw new Error('Category not found');
    }

    res.json({
        success: true,
        category
    });
});

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);

    if (!category) {
        res.status(404);
        throw new Error('Category not found');
    }

    await category.deleteOne();

    res.json({
        success: true,
        message: 'Category deleted successfully'
    });
});
