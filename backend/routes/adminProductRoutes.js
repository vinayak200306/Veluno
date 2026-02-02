const express = require('express');
const router = express.Router();
const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductActive,
    toggleProductFeatured,
    updateProductStock,
    bulkDeleteProducts,
    getProductStats
} = require('../controllers/adminProductController');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');

// All routes require admin authentication
router.use(protectAdmin);

// Statistics route (must be before /:id routes)
router.get('/stats', getProductStats);

// Bulk operations
router.post('/bulk-delete', bulkDeleteProducts);

// Main CRUD routes
router.route('/')
    .get(getAllProducts)      // GET /api/admin/products
    .post(createProduct);     // POST /api/admin/products

router.route('/:id')
    .get(getProductById)      // GET /api/admin/products/:id
    .put(updateProduct)       // PUT /api/admin/products/:id
    .delete(deleteProduct);   // DELETE /api/admin/products/:id

// Toggle routes
router.patch('/:id/toggle-active', toggleProductActive);
router.patch('/:id/toggle-featured', toggleProductFeatured);

// Stock management
router.patch('/:id/stock', updateProductStock);

module.exports = router;
