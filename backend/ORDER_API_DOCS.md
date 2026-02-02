# Order Management API - Complete Documentation

## 🎯 Overview

Complete **order management system** for the Veluno e-commerce platform with automatic inventory management, payment tracking, and order status updates.

---

## 🔐 Authentication

**Public Routes:** Order creation and tracking  
**Admin Routes:** Order management (requires admin JWT token)

```
Authorization: Bearer YOUR_ADMIN_TOKEN
```

---

## 📡 API Endpoints

### Public Endpoints

#### 1. Create Order

**POST** `/api/orders`

Create a new order and automatically reduce product stock.

**Request Body:**
```json
{
  "customerName": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "address": {
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001",
    "country": "India"
  },
  "products": [
    {
      "productId": "65c1234567890abcdef12345",
      "size": "M",
      "color": "Black",
      "quantity": 2
    },
    {
      "productId": "65c1234567890abcdef12346",
      "size": "L",
      "color": "Blue",
      "quantity": 1
    }
  ],
  "paymentMethod": "cod",
  "paymentId": "",
  "shippingCost": 50,
  "discount": 100,
  "notes": "Please deliver before 5 PM"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "order": {
    "_id": "65c1234567890abcdef12350",
    "orderNumber": "ORD-20260202-A3B4C5",
    "customerName": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "address": {
      "street": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postalCode": "400001",
      "country": "India"
    },
    "products": [
      {
        "product": "65c1234567890abcdef12345",
        "productName": "Classic Cotton T-Shirt",
        "productImage": "https://example.com/tshirt.jpg",
        "size": "M",
        "color": "Black",
        "quantity": 2,
        "price": 29.99,
        "subtotal": 59.98
      },
      {
        "product": "65c1234567890abcdef12346",
        "productName": "Premium Denim Jeans",
        "productImage": "https://example.com/jeans.jpg",
        "size": "L",
        "color": "Blue",
        "quantity": 1,
        "price": 79.99,
        "subtotal": 79.99
      }
    ],
    "totalAmount": 89.97,
    "paymentStatus": "pending",
    "paymentMethod": "cod",
    "orderStatus": "pending",
    "shippingCost": 50,
    "discount": 100,
    "notes": "Please deliver before 5 PM",
    "fullAddress": "123 Main Street, Mumbai, Maharashtra 400001, India",
    "totalItems": 3,
    "createdAt": "2026-02-02T07:00:00.000Z",
    "updatedAt": "2026-02-02T07:00:00.000Z"
  }
}
```

**Features:**
- ✅ Validates product availability
- ✅ Checks stock before order creation
- ✅ Validates product sizes
- ✅ Automatically reduces product stock
- ✅ Uses MongoDB transactions (rollback on error)
- ✅ Auto-generates order number
- ✅ Calculates total amount
- ✅ Supports multiple payment methods

---

#### 2. Get Order by ID

**GET** `/api/orders/:id`

Get order details by order ID.

**Example Request:**
```bash
curl -X GET "http://localhost:5000/api/orders/65c1234567890abcdef12350"
```

**Response:**
```json
{
  "success": true,
  "order": {
    "_id": "65c1234567890abcdef12350",
    "orderNumber": "ORD-20260202-A3B4C5",
    "customerName": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "address": {...},
    "products": [...],
    "totalAmount": 89.97,
    "orderStatus": "pending",
    "paymentStatus": "pending",
    "statusHistory": [
      {
        "status": "pending",
        "timestamp": "2026-02-02T07:00:00.000Z"
      }
    ],
    "createdAt": "2026-02-02T07:00:00.000Z"
  }
}
```

---

#### 3. Track Order by Order Number

**GET** `/api/orders/track/:orderNumber`

Track order using order number (for customer tracking).

**Example Request:**
```bash
curl -X GET "http://localhost:5000/api/orders/track/ORD-20260202-A3B4C5"
```

**Response:**
```json
{
  "success": true,
  "order": {
    "orderNumber": "ORD-20260202-A3B4C5",
    "orderStatus": "shipped",
    "trackingNumber": "TRK123456789",
    "statusHistory": [
      {
        "status": "pending",
        "timestamp": "2026-02-02T07:00:00.000Z"
      },
      {
        "status": "confirmed",
        "timestamp": "2026-02-02T08:00:00.000Z"
      },
      {
        "status": "shipped",
        "timestamp": "2026-02-02T10:00:00.000Z",
        "note": "Out for delivery"
      }
    ],
    "products": [...]
  }
}
```

---

### Admin Endpoints

#### 4. Get All Orders (Admin)

**GET** `/api/admin/orders`

Get paginated list of all orders with filtering.

**Query Parameters:**
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 20)
- `orderStatus` (string) - Filter by order status
- `paymentStatus` (string) - Filter by payment status
- `search` (string) - Search by order number, name, email, phone
- `startDate` (date) - Filter orders from date
- `endDate` (date) - Filter orders until date

**Example Request:**
```bash
curl -X GET "http://localhost:5000/api/admin/orders?page=1&limit=10&orderStatus=pending" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "total": 45,
  "page": 1,
  "pages": 5,
  "orders": [
    {
      "_id": "65c1234567890abcdef12350",
      "orderNumber": "ORD-20260202-A3B4C5",
      "customerName": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "totalAmount": 89.97,
      "orderStatus": "pending",
      "paymentStatus": "pending",
      "createdAt": "2026-02-02T07:00:00.000Z"
    }
  ]
}
```

---

#### 5. Update Order Status (Admin)

**PATCH** `/api/admin/orders/:id/status`

Update order status and add tracking information.

**Request Body:**
```json
{
  "orderStatus": "shipped",
  "trackingNumber": "TRK123456789",
  "note": "Package dispatched from warehouse"
}
```

**Example Request:**
```bash
curl -X PATCH "http://localhost:5000/api/admin/orders/65c1234567890abcdef12350/status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderStatus": "shipped",
    "trackingNumber": "TRK123456789",
    "note": "Package dispatched"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "order": {
    "_id": "65c1234567890abcdef12350",
    "orderNumber": "ORD-20260202-A3B4C5",
    "orderStatus": "shipped",
    "trackingNumber": "TRK123456789",
    "statusHistory": [
      {
        "status": "pending",
        "timestamp": "2026-02-02T07:00:00.000Z"
      },
      {
        "status": "shipped",
        "timestamp": "2026-02-02T10:00:00.000Z",
        "updatedBy": "65c1234567890abcdef12340",
        "note": "Package dispatched"
      }
    ]
  }
}
```

**Order Status Values:**
- `pending` - Order placed, awaiting confirmation
- `confirmed` - Order confirmed
- `processing` - Order being prepared
- `shipped` - Order shipped
- `delivered` - Order delivered
- `cancelled` - Order cancelled

---

#### 6. Update Payment Status (Admin)

**PATCH** `/api/admin/orders/:id/payment`

Update payment status and payment ID.

**Request Body:**
```json
{
  "paymentStatus": "paid",
  "paymentId": "PAY123456789"
}
```

**Example Request:**
```bash
curl -X PATCH "http://localhost:5000/api/admin/orders/65c1234567890abcdef12350/payment" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentStatus": "paid",
    "paymentId": "PAY123456789"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Payment status updated successfully",
  "order": {
    "_id": "65c1234567890abcdef12350",
    "paymentStatus": "paid",
    "paymentId": "PAY123456789"
  }
}
```

**Payment Status Values:**
- `pending` - Payment not received
- `paid` - Payment successful
- `failed` - Payment failed
- `refunded` - Payment refunded

---

#### 7. Cancel Order (Admin)

**PATCH** `/api/admin/orders/:id/cancel`

Cancel order and restore product stock.

**Request Body:**
```json
{
  "cancelReason": "Customer requested cancellation"
}
```

**Example Request:**
```bash
curl -X PATCH "http://localhost:5000/api/admin/orders/65c1234567890abcdef12350/cancel" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cancelReason": "Customer requested cancellation"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Order cancelled successfully and stock restored",
  "order": {
    "_id": "65c1234567890abcdef12350",
    "orderStatus": "cancelled",
    "cancelReason": "Customer requested cancellation",
    "cancelledAt": "2026-02-02T11:00:00.000Z"
  }
}
```

**Features:**
- ✅ Automatically restores product stock
- ✅ Uses MongoDB transactions
- ✅ Cannot cancel delivered orders
- ✅ Tracks cancellation reason
- ✅ Updates status history

---

#### 8. Get Order Statistics (Admin)

**GET** `/api/admin/orders/stats`

Get comprehensive order statistics and analytics.

**Example Request:**
```bash
curl -X GET "http://localhost:5000/api/admin/orders/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalOrders": 150,
    "totalRevenue": 125430.50,
    "ordersByStatus": [
      { "_id": "pending", "count": 25 },
      { "_id": "confirmed", "count": 15 },
      { "_id": "processing", "count": 20 },
      { "_id": "shipped", "count": 30 },
      { "_id": "delivered", "count": 55 },
      { "_id": "cancelled", "count": 5 }
    ],
    "ordersByPaymentStatus": [
      { "_id": "pending", "count": 30 },
      { "_id": "paid", "count": 115 },
      { "_id": "failed", "count": 3 },
      { "_id": "refunded", "count": 2 }
    ],
    "recentOrders": [
      {
        "orderNumber": "ORD-20260202-A3B4C5",
        "customerName": "John Doe",
        "totalAmount": 89.97,
        "orderStatus": "pending",
        "createdAt": "2026-02-02T07:00:00.000Z"
      }
    ],
    "averageOrderValue": 836.20
  }
}
```

---

## 📋 Order Schema

### Required Fields

| Field | Type | Validation |
|-------|------|------------|
| customerName | String | Required, max 100 chars |
| email | String | Required, valid email |
| phone | String | Required, 10-15 digits |
| address | Object | Required (street, city, state, postalCode, country) |
| products | Array | Required, min 1 item |
| totalAmount | Number | Required, >= 0 |
| paymentStatus | String | Required, enum |
| orderStatus | String | Required, enum |

### Auto-Generated Fields

- `orderNumber` - Format: ORD-YYYYMMDD-RANDOM
- `statusHistory` - Array of status changes
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

### Virtual Fields

- `fullAddress` - Complete formatted address
- `totalItems` - Total quantity of all products

---

## 🔄 Inventory Management

### Automatic Stock Reduction

When an order is created:
1. ✅ Validates product availability
2. ✅ Checks if stock >= requested quantity
3. ✅ Reduces product stock by ordered quantity
4. ✅ Uses MongoDB transactions (atomic operation)
5. ✅ Rolls back if any error occurs

### Stock Restoration on Cancellation

When an order is cancelled:
1. ✅ Restores product stock for all items
2. ✅ Uses MongoDB transactions
3. ✅ Updates order status to cancelled
4. ✅ Records cancellation reason

**Example:**
```
Product Stock Before Order: 100
Order Quantity: 5
Product Stock After Order: 95

If Order Cancelled:
Product Stock After Cancellation: 100 (restored)
```

---

## 📊 Order Flow

```
1. Customer places order → Stock reduced automatically
2. Admin confirms order → Status: confirmed
3. Admin processes order → Status: processing
4. Admin ships order → Status: shipped (tracking number added)
5. Order delivered → Status: delivered
```

**Alternative Flow:**
```
Order placed → Admin cancels → Stock restored → Status: cancelled
```

---

## ❌ Error Responses

### Insufficient Stock
```json
{
  "success": false,
  "error": "Insufficient stock for Classic Cotton T-Shirt. Available: 2, Requested: 5",
  "timestamp": "2026-02-02T10:00:00.000Z"
}
```

### Product Not Found
```json
{
  "success": false,
  "error": "Product not found: 65c1234567890abcdef12345",
  "timestamp": "2026-02-02T10:00:00.000Z"
}
```

### Invalid Size
```json
{
  "success": false,
  "error": "Invalid size XL for product Classic T-Shirt",
  "timestamp": "2026-02-02T10:00:00.000Z"
}
```

### Cannot Cancel Delivered Order
```json
{
  "success": false,
  "error": "Cannot cancel a delivered order",
  "timestamp": "2026-02-02T10:00:00.000Z"
}
```

---

## 🚀 Quick Start

### 1. Create an Order

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "address": {
      "street": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postalCode": "400001",
      "country": "India"
    },
    "products": [
      {
        "productId": "PRODUCT_ID_HERE",
        "size": "M",
        "quantity": 2
      }
    ],
    "paymentMethod": "cod"
  }'
```

### 2. Track Order

```bash
curl -X GET "http://localhost:5000/api/orders/track/ORD-20260202-A3B4C5"
```

### 3. Admin: View All Orders

```bash
curl -X GET "http://localhost:5000/api/admin/orders" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 4. Admin: Update Order Status

```bash
curl -X PATCH "http://localhost:5000/api/admin/orders/ORDER_ID/status" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderStatus": "shipped", "trackingNumber": "TRK123"}'
```

---

**Order Management API is ready to use!** 🎉
