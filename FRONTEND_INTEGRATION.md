# Veluno Frontend - API Integration Guide

## 🎯 Overview

Complete guide for connecting the Veluno React frontend to the Node.js backend.

---

## 📁 Project Structure

```
Veluno website/
├── backend/                 # Node.js + Express backend
│   ├── server.js
│   ├── controllers/
│   ├── models/
│   └── routes/
├── src/                     # React frontend
│   ├── services/
│   │   └── api.js          # API service layer (NEW)
│   ├── veluno (1).jsx      # Main component
│   └── main.jsx
├── .env                     # Environment variables
└── package.json
```

---

## 🔧 Setup Instructions

### 1. Create Environment File

Create `.env` in the root of your frontend project:

```bash
VITE_API_URL=http://localhost:5000/api
```

**For production:**
```bash
VITE_API_URL=https://your-backend-domain.com/api
```

---

### 2. Add Razorpay Script

Add to your `index.html` (in the `<head>` section):

```html
<!-- Razorpay Checkout -->
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

---

### 3. Update Main Component

In `veluno (1).jsx`, add these imports at the top:

```javascript
import { useState, useEffect, useRef, useCallback } from "react";
import { productAPI, orderAPI, initiateRazorpayPayment, transformProduct } from './services/api';
```

---

## 🔄 API Integration Examples

### 1. Fetch Products from Backend

Replace the hardcoded `PRODUCTS` array with API calls:

```javascript
export default function VelunoStore() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productAPI.getAll({ limit: 20 });
        
        // Transform backend products to frontend format
        const transformedProducts = response.products.map(transformProduct);
        setProducts(transformedProducts);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // ... rest of component
}
```

---

### 2. Search Products

Update the `SearchOverlay` component:

```javascript
function SearchOverlay({ onClose, onViewProduct }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Debounced search
  useEffect(() => {
    if (q.length < 2) {
      setResults([]);
      return;
    }

    const searchProducts = async () => {
      try {
        setSearching(true);
        const response = await productAPI.search(q);
        const transformedResults = response.products.map(transformProduct);
        setResults(transformedResults);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setSearching(false);
      }
    };

    const timer = setTimeout(searchProducts, 300);
    return () => clearTimeout(timer);
  }, [q]);

  // ... rest of component
}
```

---

### 3. Track Order

Update the `OrderTracker` component:

```javascript
function OrderTracker({ onClose }) {
  const [input, setInput] = useState("");
  const [order, setOrder] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const lookup = async () => {
    try {
      setLoading(true);
      setNotFound(false);
      
      const response = await orderAPI.track(input.trim().toUpperCase());
      
      if (response.success) {
        setOrder(response.order);
      }
    } catch (error) {
      console.error('Order lookup failed:', error);
      setOrder(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
}
```

---

### 4. Checkout with Razorpay

Update the `CartDrawer` checkout button:

```javascript
function CartDrawer({ cart, onClose, onRemove, onUpdateQty }) {
  const total = cart.reduce((s,i) => s + effectivePrice(i)*i.qty, 0);
  const [processing, setProcessing] = useState(false);

  const handleCheckout = async () => {
    setProcessing(true);

    // Collect customer information (you'll need a form for this)
    const customerInfo = {
      name: "John Doe",              // Get from form
      email: "john@example.com",     // Get from form
      phone: "9876543210",           // Get from form
      address: {
        street: "123 Main St",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        country: "India"
      },
      paymentMethod: "card",
      shippingCost: total >= 999 ? 0 : 50,
      discount: 0,
      totalAmount: total + (total >= 999 ? 0 : 50)
    };

    // Transform cart to order format
    const orderData = {
      ...customerInfo,
      products: cart.map(item => ({
        productId: item.id,
        size: item.size,
        color: item.color || '',
        quantity: item.qty
      }))
    };

    // Initiate Razorpay payment
    await initiateRazorpayPayment(
      orderData,
      (order) => {
        // Success callback
        console.log('Payment successful!', order);
        alert(`Order placed successfully! Order Number: ${order.orderNumber}`);
        setCart([]); // Clear cart
        onClose();
        // Redirect to order confirmation page
      },
      (error) => {
        // Failure callback
        console.error('Payment failed:', error);
        alert('Payment failed. Please try again.');
        setProcessing(false);
      }
    );
  };

  return (
    <div>
      {/* ... cart items ... */}
      
      <button 
        onClick={handleCheckout}
        disabled={processing || cart.length === 0}
        style={{ 
          width:"100%", 
          background: processing ? "#888" : T.gold, 
          // ... other styles
        }}
      >
        {processing ? 'Processing...' : 'Proceed to Checkout'}
      </button>
    </div>
  );
}
```

---

### 5. Filter Products by Category

```javascript
const filteredProducts = filter === "All" 
  ? products 
  : products.filter(p => p.category === filter);
```

---

## 📊 API Response Formats

### Products Response
```json
{
  "success": true,
  "count": 10,
  "products": [
    {
      "_id": "65c1234567890abcdef12345",
      "name": "Bad Decision",
      "category": "T-Shirts",
      "price": 699,
      "discount": 0,
      "sizes": ["S", "M", "L", "XL"],
      "images": ["https://..."],
      "isFeatured": true,
      "stock": 50
    }
  ]
}
```

### Order Tracking Response
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
        "status": "shipped",
        "timestamp": "2026-02-02T10:00:00.000Z"
      }
    ],
    "products": [...],
    "totalAmount": 699
  }
}
```

---

## 🔐 CORS Configuration

Make sure your backend allows the frontend origin:

**Backend `.env`:**
```bash
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## 🚀 Running the Application

### 1. Start Backend
```bash
cd backend
npm run dev
```
Backend runs on: `http://localhost:5000`

### 2. Start Frontend
```bash
npm run dev
```
Frontend runs on: `http://localhost:5173`

---

## 🧪 Testing the Integration

### Test Product Fetching
1. Open browser console
2. Check for API calls to `/api/products`
3. Verify products are displayed

### Test Search
1. Click search icon
2. Type product name
3. Verify search results from backend

### Test Order Tracking
1. Click "Track Order"
2. Enter test order number: `ORD-20260202-A3B4C5`
3. Verify order details are displayed

### Test Checkout
1. Add items to cart
2. Click "Proceed to Checkout"
3. Razorpay checkout should open
4. Use test card: `4111 1111 1111 1111`

---

## 📝 Checkout Form Component

You'll need to create a checkout form to collect customer information:

```javascript
function CheckoutForm({ cart, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const total = cart.reduce((s,i) => s + effectivePrice(i)*i.qty, 0);
    const shippingCost = total >= 999 ? 0 : 50;
    
    const orderData = {
      customerName: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
        country: formData.country
      },
      products: cart.map(item => ({
        productId: item.id,
        size: item.size,
        quantity: item.qty
      })),
      totalAmount: total + shippingCost,
      shippingCost,
      paymentMethod: 'card'
    };

    await initiateRazorpayPayment(orderData, onSuccess, (error) => {
      alert('Payment failed: ' + error.message);
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

---

## ⚠️ Important Notes

### 1. Environment Variables
- Never commit `.env` files
- Use different API URLs for dev/prod

### 2. Error Handling
- Always wrap API calls in try-catch
- Show user-friendly error messages
- Log errors for debugging

### 3. Loading States
- Show loading spinners during API calls
- Disable buttons while processing
- Use skeleton loaders for products

### 4. Security
- Never expose API keys in frontend
- Razorpay key_id is safe to expose
- Never store sensitive data in localStorage

---

## 🐛 Troubleshooting

### CORS Errors
```
Access to fetch at 'http://localhost:5000/api/products' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Solution:** Add frontend URL to backend `ALLOWED_ORIGINS`

### API Not Found (404)
```
GET http://localhost:5000/api/products 404 (Not Found)
```

**Solution:** Ensure backend is running and routes are correct

### Razorpay Not Defined
```
ReferenceError: Razorpay is not defined
```

**Solution:** Add Razorpay script to `index.html`

---

## ✅ Integration Checklist

- [ ] API service layer created
- [ ] Environment variables configured
- [ ] Razorpay script added to HTML
- [ ] Products fetched from backend
- [ ] Search integrated with backend
- [ ] Order tracking working
- [ ] Checkout with Razorpay functional
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] CORS configured
- [ ] Both servers running

---

**Your frontend is now connected to the backend!** 🎉
