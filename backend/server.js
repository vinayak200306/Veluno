const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const compression = require('compression');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { helmetConfig, mongoSanitizeConfig, hppConfig } = require('./config/security');
const { apiLimiter, authLimiter, paymentLimiter, orderLimiter } = require('./middleware/security');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Trust proxy (required for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security Middleware
app.use(helmetConfig); // Set security headers
app.use(mongoSanitizeConfig); // Prevent NoSQL injection
app.use(hppConfig); // Prevent HTTP Parameter Pollution

// CORS Configuration
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general rate limiting to all routes
app.use('/api/', apiLimiter);

// Health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API Routes
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/users', authLimiter, require('./routes/userRoutes')); // Auth rate limiting
app.use('/api/orders', orderLimiter, require('./routes/orderRoutes')); // Order rate limiting
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/payment', paymentLimiter, require('./routes/paymentRoutes')); // Payment rate limiting
app.use('/api/qikink', require('./routes/qikinkRoutes')); // Qikink Integration
app.use('/api/upload', require('./routes/uploadRoutes'));

// Qikink Automated Sync (Daily at 2:00 AM)
const cron = require('node-cron');
const qikinkService = require('./services/qikinkService');
cron.schedule('0 2 * * *', async () => {
    console.log('Running daily Qikink product sync...');
    try {
        await qikinkService.syncProducts();
        console.log('Product sync completed');
    } catch (error) {
        console.error('Product sync failed:', error);
    }
});

// Admin Routes
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/admin/products', require('./routes/adminProductRoutes'));
app.use('/api/admin/orders', require('./routes/adminOrderRoutes'));

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Veluno E-commerce API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            products: '/api/products',
            users: '/api/users',
            orders: '/api/orders',
            categories: '/api/categories'
        }
    });
});

// 404 handler
app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
