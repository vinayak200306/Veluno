# Razorpay Payment Integration - Complete Guide

## 🎯 Overview

Complete **Razorpay payment gateway integration** for the Veluno e-commerce platform with secure payment processing, signature verification, and webhook handling.

---

## 🔐 Security Features

✅ **No Card Details Stored** - Never store CVV, card numbers, or sensitive data  
✅ **Signature Verification** - Cryptographic verification of all payments  
✅ **Webhook Security** - Verified webhook signatures  
✅ **Environment Variables** - Secure credential management  
✅ **HTTPS Required** - Production must use HTTPS  

---

## 📦 Installation

### 1. Install Razorpay SDK

```bash
npm install razorpay
```

### 2. Configure Environment Variables

Add to `.env` file:

```bash
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

**Get Credentials:**
1. Sign up at [https://razorpay.com](https://razorpay.com)
2. Go to Dashboard → Settings → API Keys
3. Generate Test/Live keys
4. For webhooks: Settings → Webhooks → Create webhook

---

## 📡 API Endpoints

### 1. Create Razorpay Order

**POST** `/api/payment/create-order`

Create a Razorpay order before initiating payment.

**Request Body:**
```json
{
  "amount": 299.99,
  "currency": "INR",
  "receipt": "order_rcptid_11",
  "notes": {
    "orderId": "65c1234567890abcdef12350"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Razorpay order created successfully",
  "order": {
    "id": "order_MNxyz123456789",
    "amount": 299.99,
    "currency": "INR",
    "receipt": "order_rcptid_11",
    "status": "created"
  },
  "key_id": "rzp_test_your_key_id"
}
```

---

### 2. Verify Payment

**POST** `/api/payment/verify`

Verify payment signature after successful payment.

**Request Body:**
```json
{
  "razorpay_order_id": "order_MNxyz123456789",
  "razorpay_payment_id": "pay_ABCxyz987654321",
  "razorpay_signature": "generated_signature_hash",
  "orderData": {
    "customerName": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "address": {...},
    "products": [...]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "verified": true,
  "paymentId": "pay_ABCxyz987654321",
  "order": {
    "_id": "65c1234567890abcdef12350",
    "orderNumber": "ORD-20260202-A3B4C5",
    "paymentStatus": "paid",
    "paymentId": "pay_ABCxyz987654321"
  }
}
```

---

### 3. Get Payment Details (Admin)

**GET** `/api/payment/:paymentId`

**Headers:**
```
Authorization: Bearer ADMIN_TOKEN
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "pay_ABCxyz987654321",
    "amount": 299.99,
    "currency": "INR",
    "status": "captured",
    "method": "card",
    "email": "john@example.com",
    "contact": "9876543210",
    "createdAt": "2026-02-02T07:00:00.000Z"
  }
}
```

---

### 4. Refund Payment (Admin)

**POST** `/api/payment/refund`

**Headers:**
```
Authorization: Bearer ADMIN_TOKEN
```

**Request Body:**
```json
{
  "paymentId": "pay_ABCxyz987654321",
  "amount": 299.99,
  "notes": {
    "reason": "Customer requested refund"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Refund processed successfully",
  "refund": {
    "id": "rfnd_XYZabc123456789",
    "amount": 299.99,
    "status": "processed",
    "paymentId": "pay_ABCxyz987654321"
  }
}
```

---

### 5. Webhook Handler

**POST** `/api/payment/webhook`

Razorpay will send webhooks to this endpoint for payment events.

**Webhook Events Handled:**
- `payment.authorized` - Payment authorized
- `payment.captured` - Payment captured
- `payment.failed` - Payment failed

**Configure in Razorpay Dashboard:**
```
Webhook URL: https://yourdomain.com/api/payment/webhook
Events: payment.authorized, payment.captured, payment.failed
```

---

## 🔄 Complete Payment Flow

### Backend Flow

```
1. Customer initiates checkout
   ↓
2. Backend: Create Razorpay order
   POST /api/payment/create-order
   ↓
3. Backend returns: order_id, key_id
   ↓
4. Frontend: Open Razorpay checkout
   ↓
5. Customer completes payment
   ↓
6. Razorpay returns: payment_id, signature
   ↓
7. Frontend: Send to backend for verification
   POST /api/payment/verify
   ↓
8. Backend: Verify signature
   ↓
9. Backend: Create order in database
   ↓
10. Return success to frontend
```

---

## 💻 Frontend Integration Example

### Step 1: Create Order

```javascript
// Frontend: Create Razorpay order
const createOrder = async (amount) => {
  const response = await fetch('http://localhost:5000/api/payment/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: amount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    })
  });
  
  const data = await response.json();
  return data;
};
```

---

### Step 2: Open Razorpay Checkout

```javascript
// Frontend: Initialize Razorpay checkout
const initiatePayment = async (orderData) => {
  // Create Razorpay order
  const { order, key_id } = await createOrder(orderData.totalAmount);
  
  // Razorpay checkout options
  const options = {
    key: key_id,
    amount: order.amount * 100, // Amount in paise
    currency: order.currency,
    name: 'Veluno',
    description: 'Order Payment',
    order_id: order.id,
    handler: async function (response) {
      // Payment successful - Verify on backend
      await verifyPayment(response, orderData);
    },
    prefill: {
      name: orderData.customerName,
      email: orderData.email,
      contact: orderData.phone
    },
    theme: {
      color: '#3399cc'
    }
  };
  
  // Open Razorpay checkout
  const razorpay = new window.Razorpay(options);
  razorpay.open();
};
```

---

### Step 3: Verify Payment

```javascript
// Frontend: Verify payment on backend
const verifyPayment = async (razorpayResponse, orderData) => {
  const response = await fetch('http://localhost:5000/api/payment/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      razorpay_order_id: razorpayResponse.razorpay_order_id,
      razorpay_payment_id: razorpayResponse.razorpay_payment_id,
      razorpay_signature: razorpayResponse.razorpay_signature,
      orderData: orderData
    })
  });
  
  const data = await response.json();
  
  if (data.success && data.verified) {
    // Payment verified - Show success message
    console.log('Payment successful!', data.order);
    // Redirect to order confirmation page
    window.location.href = `/order-success/${data.order.orderNumber}`;
  } else {
    // Payment verification failed
    console.error('Payment verification failed');
    alert('Payment verification failed. Please contact support.');
  }
};
```

---

### Step 4: Add Razorpay Script

```html
<!-- Add Razorpay checkout script to your HTML -->
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

---

## 🔐 Security Implementation

### Signature Verification

**Backend verifies payment signature:**

```javascript
const crypto = require('crypto');

const generatedSignature = crypto
  .createHmac('sha256', RAZORPAY_KEY_SECRET)
  .update(`${razorpay_order_id}|${razorpay_payment_id}`)
  .digest('hex');

if (generatedSignature === razorpay_signature) {
  // Payment verified
} else {
  // Invalid signature
}
```

**Why this is secure:**
- ✅ Uses HMAC-SHA256 cryptographic hash
- ✅ Secret key never exposed to frontend
- ✅ Prevents payment tampering
- ✅ Ensures payment authenticity

---

### What We Store

**✅ Safe to Store:**
- Payment ID (razorpay_payment_id)
- Order ID (razorpay_order_id)
- Payment status (paid, failed, refunded)
- Payment method (card, upi, netbanking)
- Amount
- Customer email and phone

**❌ Never Store:**
- Card number
- CVV
- Card expiry date
- OTP
- Any sensitive card details

**Razorpay handles all sensitive data securely!**

---

## 🧪 Testing

### Test Mode

Use test credentials from Razorpay dashboard:
```
Key ID: rzp_test_xxxxx
Key Secret: xxxxx
```

### Test Cards

**Successful Payment:**
```
Card: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date
```

**Failed Payment:**
```
Card: 4000 0000 0000 0002
```

**More test cards:** [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)

---

## 📊 Payment Status Flow

```
created → authorized → captured (successful)
created → failed (payment failed)
captured → refunded (refund processed)
```

**Order Status Mapping:**
- `created` → Order: pending, Payment: pending
- `authorized` → Order: pending, Payment: pending
- `captured` → Order: confirmed, Payment: paid
- `failed` → Order: cancelled, Payment: failed
- `refunded` → Order: cancelled, Payment: refunded
```

---

## ⚠️ Important Notes

### Production Checklist

- [ ] Use live API keys (not test keys)
- [ ] Enable HTTPS on your domain
- [ ] Configure webhook URL in Razorpay dashboard
- [ ] Set up webhook secret
- [ ] Test all payment scenarios
- [ ] Implement error handling
- [ ] Add payment retry logic
- [ ] Set up monitoring and alerts

### Webhook Configuration

1. Go to Razorpay Dashboard → Webhooks
2. Create new webhook
3. URL: `https://yourdomain.com/api/payment/webhook`
4. Events: Select payment events
5. Copy webhook secret to `.env`

---

## 🚀 Quick Start

### 1. Install Package

```bash
npm install razorpay
```

### 2. Set Environment Variables

```bash
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### 3. Test Payment Flow

```bash
# Start server
npm run dev

# Test create order
curl -X POST http://localhost:5000/api/payment/create-order \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "INR"}'

# Use returned order_id in frontend Razorpay checkout
```

---

## 📚 Resources

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Checkout](https://razorpay.com/docs/payments/payment-gateway/web-integration/)
- [Webhook Documentation](https://razorpay.com/docs/webhooks/)
- [Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)

---

**Razorpay integration is ready to use!** 🎉
