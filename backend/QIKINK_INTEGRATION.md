# Qikink Integration Guide

## 🎯 Overview

Qikink is a print-on-demand platform. Since your products come from Qikink, you'll need to integrate their API for product sync and order fulfillment.

---

## 🔑 Qikink API Setup

### 1. Get API Credentials

1. Login to [Qikink Dashboard](https://qikink.com)
2. Go to **Settings** → **API Keys**
3. Generate API Key and Secret

### 2. Add to Backend Environment

Update `backend/.env`:
```bash
# Qikink API
QIKINK_API_KEY=your_qikink_api_key
QIKINK_API_SECRET=your_qikink_api_secret
QIKINK_API_URL=https://api.qikink.com/api/v2
```

---

## 📦 Qikink API Service

Create `backend/services/qikinkService.js`:

```javascript
const axios = require('axios');

const qikinkAPI = axios.create({
  baseURL: process.env.QIKINK_API_URL || 'https://api.qikink.com/api/v2',
  headers: {
    'Authorization': `Bearer ${process.env.QIKINK_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// ═══════════════════════════════════════════════════════════════════
// PRODUCT SYNC
// ═══════════════════════════════════════════════════════════════════

// Fetch products from Qikink
exports.fetchQikinkProducts = async () => {
  try {
    const response = await qikinkAPI.get('/products');
    return response.data;
  } catch (error) {
    console.error('Qikink API Error:', error.response?.data || error.message);
    throw error;
  }
};

// Sync Qikink products to your database
exports.syncProducts = async () => {
  try {
    const qikinkProducts = await this.fetchQikinkProducts();
    const Product = require('../models/Product');
    
    for (const qProduct of qikinkProducts.data) {
      // Transform Qikink product to your schema
      const productData = {
        name: qProduct.name,
        description: qProduct.description,
        price: qProduct.price,
        category: qProduct.category || 'T-Shirts',
        images: qProduct.images || [],
        sizes: qProduct.variants?.map(v => v.size) || ['S', 'M', 'L', 'XL'],
        colors: qProduct.variants?.map(v => v.color) || [],
        stock: qProduct.stock || 100,
        qikinkProductId: qProduct.id, // Store Qikink ID
        isActive: true
      };

      // Update or create product
      await Product.findOneAndUpdate(
        { qikinkProductId: qProduct.id },
        productData,
        { upsert: true, new: true }
      );
    }

    console.log(`Synced ${qikinkProducts.data.length} products from Qikink`);
    return { success: true, count: qikinkProducts.data.length };
  } catch (error) {
    console.error('Product sync failed:', error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════════
// ORDER FULFILLMENT
// ═══════════════════════════════════════════════════════════════════

// Create order on Qikink
exports.createQikinkOrder = async (orderData) => {
  try {
    const qikinkOrder = {
      order_id: orderData.orderNumber,
      customer: {
        name: orderData.customerName,
        email: orderData.email,
        phone: orderData.phone,
        address: {
          line1: orderData.address.street,
          city: orderData.address.city,
          state: orderData.address.state,
          pincode: orderData.address.postalCode,
          country: orderData.address.country || 'India'
        }
      },
      items: orderData.products.map(item => ({
        product_id: item.qikinkProductId,
        variant_id: item.qikinkVariantId,
        quantity: item.quantity,
        size: item.size,
        color: item.color
      }))
    };

    const response = await qikinkAPI.post('/orders', qikinkOrder);
    return response.data;
  } catch (error) {
    console.error('Qikink order creation failed:', error.response?.data || error.message);
    throw error;
  }
};

// Get order status from Qikink
exports.getQikinkOrderStatus = async (orderId) => {
  try {
    const response = await qikinkAPI.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch Qikink order status:', error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════════
// WEBHOOK HANDLER
// ═══════════════════════════════════════════════════════════════════

exports.handleQikinkWebhook = async (webhookData) => {
  try {
    const Order = require('../models/Order');
    
    switch (webhookData.event) {
      case 'order.shipped':
        await Order.findOneAndUpdate(
          { orderNumber: webhookData.order_id },
          {
            orderStatus: 'shipped',
            trackingNumber: webhookData.tracking_number,
            $push: {
              statusHistory: {
                status: 'shipped',
                timestamp: new Date()
              }
            }
          }
        );
        break;

      case 'order.delivered':
        await Order.findOneAndUpdate(
          { orderNumber: webhookData.order_id },
          {
            orderStatus: 'delivered',
            $push: {
              statusHistory: {
                status: 'delivered',
                timestamp: new Date()
              }
            }
          }
        );
        break;

      case 'order.cancelled':
        await Order.findOneAndUpdate(
          { orderNumber: webhookData.order_id },
          {
            orderStatus: 'cancelled',
            $push: {
              statusHistory: {
                status: 'cancelled',
                timestamp: new Date()
              }
            }
          }
        );
        break;
    }

    return { success: true };
  } catch (error) {
    console.error('Webhook handling failed:', error);
    throw error;
  }
};
```

---

## 🔄 Update Product Model

Add Qikink fields to `backend/models/Product.js`:

```javascript
const productSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // Qikink Integration
  qikinkProductId: {
    type: String,
    unique: true,
    sparse: true
  },
  qikinkVariantId: String,
  
  // ... rest of schema
});
```

---

## 🛣️ Create Qikink Routes

Create `backend/routes/qikinkRoutes.js`:

```javascript
const express = require('express');
const router = express.Router();
const qikinkService = require('../services/qikinkService');
const { protect, admin } = require('../middleware/authMiddleware');

// Sync products from Qikink (Admin only)
router.post('/sync-products', protect, admin, async (req, res) => {
  try {
    const result = await qikinkService.syncProducts();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Qikink webhook endpoint
router.post('/webhook', async (req, res) => {
  try {
    await qikinkService.handleQikinkWebhook(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

## 🔧 Update Order Controller

Modify `backend/controllers/orderController.js` to create Qikink order:

```javascript
const qikinkService = require('../services/qikinkService');

exports.createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ... existing order creation code ...

    // Create order on Qikink
    const qikinkOrder = await qikinkService.createQikinkOrder(order);
    
    // Update order with Qikink order ID
    order.qikinkOrderId = qikinkOrder.id;
    await order.save({ session });

    await session.commitTransaction();
    res.status(201).json({ success: true, order });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};
```

---

## 📡 Add Routes to Server

Update `backend/server.js`:

```javascript
// Qikink routes
app.use('/api/qikink', require('./routes/qikinkRoutes'));
```

---

## 🔄 Product Sync Workflow

### Manual Sync (Admin Dashboard)
```bash
POST /api/qikink/sync-products
Authorization: Bearer <admin_token>
```

### Automated Sync (Cron Job)

Install node-cron:
```bash
npm install node-cron
```

Add to `backend/server.js`:
```javascript
const cron = require('node-cron');
const qikinkService = require('./services/qikinkService');

// Sync products every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Running daily Qikink product sync...');
  try {
    await qikinkService.syncProducts();
    console.log('Product sync completed');
  } catch (error) {
    console.error('Product sync failed:', error);
  }
});
```

---

## 🪝 Qikink Webhook Setup

1. Go to Qikink Dashboard → **Webhooks**
2. Add webhook URL: `https://your-domain.com/api/qikink/webhook`
3. Select events:
   - Order Shipped
   - Order Delivered
   - Order Cancelled

---

## 📊 Order Flow with Qikink

```
1. Customer places order on your website
   ↓
2. Payment verified via Razorpay
   ↓
3. Order created in your database
   ↓
4. Order sent to Qikink for fulfillment
   ↓
5. Qikink processes and ships order
   ↓
6. Webhook updates order status in your database
   ↓
7. Customer receives tracking updates
```

---

## 🧪 Testing

### Test Product Sync
```bash
curl -X POST http://localhost:5000/api/qikink/sync-products \
  -H "Authorization: Bearer <admin_token>"
```

### Test Webhook
```bash
curl -X POST http://localhost:5000/api/qikink/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "order.shipped",
    "order_id": "ORD-20260202-A3B4C5",
    "tracking_number": "TRK123456789"
  }'
```

---

## 📦 Dependencies

Add to `backend/package.json`:
```bash
npm install axios node-cron
```

---

## ✅ Qikink Integration Checklist

- [ ] Get Qikink API credentials
- [ ] Add credentials to `.env`
- [ ] Create `qikinkService.js`
- [ ] Update Product model with Qikink fields
- [ ] Create Qikink routes
- [ ] Update order controller
- [ ] Add routes to server
- [ ] Set up webhook in Qikink dashboard
- [ ] Test product sync
- [ ] Test order creation
- [ ] Set up automated sync (optional)

---

**Your Qikink integration is ready!** 🎉
