# Product Management API - Complete Documentation

## 🎯 Overview

Complete **admin-only product management API** for the Veluno clothing brand. All endpoints require admin authentication via JWT token.

---

## 🔐 Authentication

All requests must include the admin JWT token:

```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

## 📡 API Endpoints

### 1. Get All Products

**GET** `/api/admin/products`

Get paginated list of products with filtering and search.

**Query Parameters:**
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 20)
- `category` (string) - Filter by category
- `isActive` (boolean) - Filter by active status
- `isFeatured` (boolean) - Filter by featured status
- `stockStatus` (string) - 'outOfStock' or 'lowStock'
- `search` (string) - Search in name and description
- `minPrice` (number) - Minimum price filter
- `maxPrice` (number) - Maximum price filter

**Example Request:**
```bash
curl -X GET "http://localhost:5000/api/admin/products?page=1&limit=10&category=Men&isActive=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 45,
  "page": 1,
  "pages": 5,
  "products": [
    {
      "_id": "65c1234567890abcdef12345",
      "name": "Classic Cotton T-Shirt",
      "description": "Premium quality cotton t-shirt for everyday wear",
      "price": 29.99,
      "category": "Men",
      "sizes": ["S", "M", "L", "XL"],
      "stock": 150,
      "images": [
        "https://example.com/images/tshirt-1.jpg",
        "https://example.com/images/tshirt-2.jpg"
      ],
      "sku": "MEN-L5X2K1-A3B4",
      "brand": "Veluno",
      "colors": ["Black", "White", "Navy"],
      "isActive": true,
      "isFeatured": false,
      "discount": 0,
      "tags": ["casual", "cotton", "basic"],
      "finalPrice": 29.99,
      "stockStatus": "In Stock",
      "createdBy": {
        "_id": "65c1234567890abcdef12340",
        "name": "Admin User",
        "email": "admin@veluno.com"
      },
      "createdAt": "2026-02-02T06:00:00.000Z",
      "updatedAt": "2026-02-02T06:00:00.000Z"
    }
  ]
}
```

---

### 2. Get Single Product

**GET** `/api/admin/products/:id`

Get detailed information about a specific product.

**Example Request:**
```bash
curl -X GET "http://localhost:5000/api/admin/products/65c1234567890abcdef12345" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**
```json
{
  "success": true,
  "product": {
    "_id": "65c1234567890abcdef12345",
    "name": "Classic Cotton T-Shirt",
    "description": "Premium quality cotton t-shirt for everyday wear",
    "price": 29.99,
    "category": "Men",
    "sizes": ["S", "M", "L", "XL"],
    "stock": 150,
    "images": [
      "https://example.com/images/tshirt-1.jpg",
      "https://example.com/images/tshirt-2.jpg"
    ],
    "sku": "MEN-L5X2K1-A3B4",
    "brand": "Veluno",
    "colors": ["Black", "White", "Navy"],
    "isActive": true,
    "isFeatured": false,
    "discount": 0,
    "tags": ["casual", "cotton", "basic"],
    "finalPrice": 29.99,
    "stockStatus": "In Stock",
    "createdBy": {
      "_id": "65c1234567890abcdef12340",
      "name": "Admin User",
      "email": "admin@veluno.com"
    },
    "updatedBy": {
      "_id": "65c1234567890abcdef12340",
      "name": "Admin User",
      "email": "admin@veluno.com"
    },
    "createdAt": "2026-02-02T06:00:00.000Z",
    "updatedAt": "2026-02-02T06:00:00.000Z"
  }
}
```

---

### 3. Create Product

**POST** `/api/admin/products`

Create a new product.

**Required Fields:**
- `name` (string, max 200 chars)
- `description` (string, max 2000 chars)
- `price` (number, > 0)
- `category` (string, enum: Men, Women, Kids, Accessories, Footwear, Activewear)
- `sizes` (array of strings, enum: XS, S, M, L, XL, XXL, 2XL, 3XL)
- `stock` (number, >= 0, integer)
- `images` (array of strings, 1-10 URLs)

**Optional Fields:**
- `sku` (string, unique) - Auto-generated if not provided
- `brand` (string)
- `colors` (array of strings)
- `isActive` (boolean, default: true)
- `isFeatured` (boolean, default: false)
- `discount` (number, 0-100, default: 0)
- `tags` (array of strings)

**Example Request:**
```bash
curl -X POST "http://localhost:5000/api/admin/products" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Denim Jeans",
    "description": "High-quality denim jeans with perfect fit and comfort",
    "price": 79.99,
    "category": "Men",
    "sizes": ["30", "32", "34", "36"],
    "stock": 75,
    "images": [
      "https://example.com/images/jeans-1.jpg",
      "https://example.com/images/jeans-2.jpg",
      "https://example.com/images/jeans-3.jpg"
    ],
    "brand": "Veluno Premium",
    "colors": ["Blue", "Black"],
    "discount": 10,
    "tags": ["denim", "casual", "premium"]
  }'
```

**Example Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "product": {
    "_id": "65c1234567890abcdef12346",
    "name": "Premium Denim Jeans",
    "description": "High-quality denim jeans with perfect fit and comfort",
    "price": 79.99,
    "category": "Men",
    "sizes": ["30", "32", "34", "36"],
    "stock": 75,
    "images": [
      "https://example.com/images/jeans-1.jpg",
      "https://example.com/images/jeans-2.jpg",
      "https://example.com/images/jeans-3.jpg"
    ],
    "sku": "MEN-L5X2K2-B5C6",
    "brand": "Veluno Premium",
    "colors": ["Blue", "Black"],
    "isActive": true,
    "isFeatured": false,
    "discount": 10,
    "tags": ["denim", "casual", "premium"],
    "finalPrice": 71.99,
    "stockStatus": "In Stock",
    "createdBy": "65c1234567890abcdef12340",
    "updatedBy": "65c1234567890abcdef12340",
    "createdAt": "2026-02-02T07:00:00.000Z",
    "updatedAt": "2026-02-02T07:00:00.000Z"
  }
}
```

---

### 4. Update Product

**PUT** `/api/admin/products/:id`

Update an existing product. All fields are optional.

**Example Request:**
```bash
curl -X PUT "http://localhost:5000/api/admin/products/65c1234567890abcdef12346" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 69.99,
    "discount": 15,
    "stock": 100,
    "isFeatured": true
  }'
```

**Example Response:**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "product": {
    "_id": "65c1234567890abcdef12346",
    "name": "Premium Denim Jeans",
    "price": 69.99,
    "discount": 15,
    "stock": 100,
    "isFeatured": true,
    "finalPrice": 59.49,
    "updatedBy": {
      "_id": "65c1234567890abcdef12340",
      "name": "Admin User",
      "email": "admin@veluno.com"
    },
    "updatedAt": "2026-02-02T08:00:00.000Z"
  }
}
```

---

### 5. Delete Product

**DELETE** `/api/admin/products/:id`

Permanently delete a product.

**Example Request:**
```bash
curl -X DELETE "http://localhost:5000/api/admin/products/65c1234567890abcdef12346" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully",
  "deletedProduct": {
    "_id": "65c1234567890abcdef12346",
    "name": "Premium Denim Jeans",
    "sku": "MEN-L5X2K2-B5C6"
  }
}
```

---

### 6. Toggle Product Active Status

**PATCH** `/api/admin/products/:id/toggle-active`

Toggle product active/inactive status.

**Example Request:**
```bash
curl -X PATCH "http://localhost:5000/api/admin/products/65c1234567890abcdef12345/toggle-active" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**
```json
{
  "success": true,
  "message": "Product deactivated successfully",
  "product": {
    "_id": "65c1234567890abcdef12345",
    "name": "Classic Cotton T-Shirt",
    "isActive": false,
    "updatedAt": "2026-02-02T09:00:00.000Z"
  }
}
```

---

### 7. Toggle Product Featured Status

**PATCH** `/api/admin/products/:id/toggle-featured`

Toggle product featured status.

**Example Request:**
```bash
curl -X PATCH "http://localhost:5000/api/admin/products/65c1234567890abcdef12345/toggle-featured" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**
```json
{
  "success": true,
  "message": "Product marked as featured successfully",
  "product": {
    "_id": "65c1234567890abcdef12345",
    "name": "Classic Cotton T-Shirt",
    "isFeatured": true,
    "updatedAt": "2026-02-02T09:15:00.000Z"
  }
}
```

---

### 8. Update Product Stock

**PATCH** `/api/admin/products/:id/stock`

Update product stock quantity.

**Example Request:**
```bash
curl -X PATCH "http://localhost:5000/api/admin/products/65c1234567890abcdef12345/stock" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stock": 200
  }'
```

**Example Response:**
```json
{
  "success": true,
  "message": "Stock updated successfully",
  "product": {
    "_id": "65c1234567890abcdef12345",
    "name": "Classic Cotton T-Shirt",
    "stock": 200,
    "stockStatus": "In Stock",
    "updatedAt": "2026-02-02T09:30:00.000Z"
  }
}
```

---

### 9. Bulk Delete Products

**POST** `/api/admin/products/bulk-delete`

Delete multiple products at once.

**Example Request:**
```bash
curl -X POST "http://localhost:5000/api/admin/products/bulk-delete" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": [
      "65c1234567890abcdef12345",
      "65c1234567890abcdef12346",
      "65c1234567890abcdef12347"
    ]
  }'
```

**Example Response:**
```json
{
  "success": true,
  "message": "3 product(s) deleted successfully",
  "deletedCount": 3
}
```

---

### 10. Get Product Statistics

**GET** `/api/admin/products/stats`

Get comprehensive product statistics and analytics.

**Example Request:**
```bash
curl -X GET "http://localhost:5000/api/admin/products/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response:**
```json
{
  "success": true,
  "stats": {
    "totalProducts": 150,
    "activeProducts": 142,
    "featuredProducts": 12,
    "outOfStock": 8,
    "lowStock": 15,
    "categoryBreakdown": [
      { "_id": "Men", "count": 60 },
      { "_id": "Women", "count": 55 },
      { "_id": "Kids", "count": 20 },
      { "_id": "Accessories", "count": 15 }
    ],
    "averagePrice": 45.67,
    "totalInventoryValue": 125430.50
  }
}
```

---

## 📋 Product Schema

### Required Fields
| Field | Type | Validation |
|-------|------|------------|
| name | String | Required, max 200 chars |
| description | String | Required, max 2000 chars |
| price | Number | Required, > 0 |
| category | String | Required, enum values |
| sizes | Array | Required, min 1 item |
| stock | Number | Required, >= 0, integer |
| images | Array | Required, 1-10 URLs |

### Optional Fields
| Field | Type | Default | Validation |
|-------|------|---------|------------|
| sku | String | Auto-generated | Unique |
| brand | String | - | - |
| colors | Array | [] | - |
| isActive | Boolean | true | - |
| isFeatured | Boolean | false | - |
| discount | Number | 0 | 0-100 |
| tags | Array | [] | - |

### Auto-Generated Fields
- `createdBy` - Admin who created the product
- `updatedBy` - Admin who last updated the product
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

### Virtual Fields
- `finalPrice` - Price after discount
- `stockStatus` - "Out of Stock", "Low Stock", or "In Stock"

---

## ✅ Validation Rules

### Category Values
- Men
- Women
- Kids
- Accessories
- Footwear
- Activewear

### Size Values
- XS, S, M, L, XL, XXL, 2XL, 3XL

### Stock Status Logic
- **Out of Stock**: stock === 0
- **Low Stock**: 0 < stock < 10
- **In Stock**: stock >= 10

### SKU Format
Auto-generated: `CATEGORY-TIMESTAMP-RANDOM`
Example: `MEN-L5X2K1-A3B4`

---

## 🔍 Filtering Examples

### Filter by Category
```
GET /api/admin/products?category=Women
```

### Search Products
```
GET /api/admin/products?search=cotton shirt
```

### Filter by Price Range
```
GET /api/admin/products?minPrice=20&maxPrice=50
```

### Get Out of Stock Products
```
GET /api/admin/products?stockStatus=outOfStock
```

### Get Featured Products
```
GET /api/admin/products?isFeatured=true
```

### Combine Filters
```
GET /api/admin/products?category=Men&isActive=true&minPrice=30&page=2&limit=15
```

---

## ❌ Error Responses

### Validation Error
```json
{
  "success": false,
  "error": "Product validation failed: price: Price must be greater than 0",
  "timestamp": "2026-02-02T10:00:00.000Z"
}
```

### Product Not Found
```json
{
  "success": false,
  "error": "Product not found",
  "timestamp": "2026-02-02T10:00:00.000Z"
}
```

### Unauthorized
```json
{
  "success": false,
  "error": "Not authorized - no token provided",
  "timestamp": "2026-02-02T10:00:00.000Z"
}
```

---

## 🚀 Quick Start

1. **Login as Admin**
```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@veluno.com","password":"Admin@123456"}'
```

2. **Copy the token from response**

3. **Create a product**
```bash
curl -X POST http://localhost:5000/api/admin/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "description": "This is a test product",
    "price": 49.99,
    "category": "Men",
    "sizes": ["M", "L"],
    "stock": 50,
    "images": ["https://example.com/image.jpg"]
  }'
```

---

**Product Management API is ready to use!** 🎉
