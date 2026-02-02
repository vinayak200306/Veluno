# Veluno E-commerce Backend

Production-ready Node.js + Express backend for a clothing e-commerce platform replacing Shopify.

## 🚀 Features

- **RESTful API** with Express.js
- **MongoDB** database with Mongoose ODM
- **Authentication** with JWT tokens
- **Role-based access control** (Customer/Admin)
- **Modular architecture** for scalability
- **Centralized error handling**
- **CORS enabled** for cross-origin requests
- **Environment variables** support
- **Health check endpoint**

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js                 # MongoDB connection
├── controllers/
│   ├── productController.js  # Product business logic
│   ├── userController.js     # User & auth logic
│   ├── orderController.js    # Order management
│   └── categoryController.js # Category management
├── models/
│   ├── Product.js           # Product schema
│   ├── User.js              # User schema
│   ├── Order.js             # Order schema
│   └── Category.js          # Category schema
├── routes/
│   ├── productRoutes.js     # Product endpoints
│   ├── userRoutes.js        # User endpoints
│   ├── orderRoutes.js       # Order endpoints
│   └── categoryRoutes.js    # Category endpoints
├── middleware/
│   ├── errorHandler.js      # Error handling
│   ├── asyncHandler.js      # Async wrapper
│   └── authMiddleware.js    # JWT authentication
├── utils/
│   └── tokenUtils.js        # JWT utilities
├── .env.example             # Environment variables template
├── .gitignore
├── package.json
└── server.js                # Application entry point
```

## 🛠️ Installation

1. **Clone the repository**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and configure your settings:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Server port (default: 5000)

4. **Start MongoDB**
Make sure MongoDB is running on your system.

5. **Run the server**
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## 📡 API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Products
- `GET /api/products` - Get all products (with pagination & filters)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)
- `POST /api/products/:id/reviews` - Add product review (Auth required)

### Users
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile (Auth required)
- `PUT /api/users/profile` - Update profile (Auth required)
- `POST /api/users/addresses` - Add address (Auth required)
- `POST /api/users/wishlist/:productId` - Toggle wishlist (Auth required)

### Orders
- `POST /api/orders` - Create order (Auth required)
- `GET /api/orders` - Get all orders (Admin only)
- `GET /api/orders/myorders` - Get user's orders (Auth required)
- `GET /api/orders/:id` - Get order by ID (Auth required)
- `PUT /api/orders/:id/pay` - Update order to paid (Auth required)
- `PUT /api/orders/:id/deliver` - Mark as delivered (Admin only)
- `PUT /api/orders/:id/status` - Update order status (Admin only)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:identifier` - Get category by ID or slug
- `POST /api/categories` - Create category (Admin only)
- `PUT /api/categories/:id` - Update category (Admin only)
- `DELETE /api/categories/:id` - Delete category (Admin only)

## 🔐 Authentication

Protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## 🧪 Testing the API

You can test the API using:
- **Postman** or **Insomnia**
- **cURL** commands
- **Thunder Client** (VS Code extension)

Example request:
```bash
curl http://localhost:5000/api/health
```

## 📦 Models

### Product
- Name, description, price, images
- Sizes, colors, stock management
- Reviews and ratings
- Category association
- Featured/active status

### User
- Authentication (email/password)
- Profile management
- Multiple addresses
- Wishlist
- Role-based access (customer/admin)

### Order
- Order items with product details
- Shipping address
- Payment information
- Order status tracking
- Delivery management

### Category
- Hierarchical categories
- Auto-generated slugs
- Active/inactive status

## 🔧 Environment Variables

See `.env.example` for all available configuration options.

## 🚀 Deployment

For production deployment:
1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure MongoDB Atlas or your production database
4. Set up proper CORS origins
5. Enable HTTPS
6. Consider using PM2 for process management

## 📝 License

ISC

## 👨‍💻 Author

Veluno Development Team
