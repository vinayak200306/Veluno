# 🚀 Quick Start - Frontend-Backend Integration

## ⚡ 3-Step Setup

### Step 1: Add Razorpay Script
Add to `index.html` in `<head>`:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### Step 2: Update veluno (1).jsx
Add imports at the top:
```javascript
import { productAPI, transformProduct } from './services/api';
import CheckoutModal from './components/CheckoutModal';
```

Replace hardcoded PRODUCTS:
```javascript
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);
const [checkoutOpen, setCheckoutOpen] = useState(false);

useEffect(() => {
  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll({ limit: 20 });
      const transformed = response.products.map(transformProduct);
      setProducts(transformed);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };
  fetchProducts();
}, []);

const filteredProducts = filter === "All" 
  ? products 
  : products.filter(p => p.category === filter);
```

Update CartDrawer checkout button:
```javascript
// Replace the checkout button in CartDrawer with:
<button onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>
  Proceed to Checkout
</button>

// Add checkout success handler:
const handleCheckoutSuccess = (order) => {
  addToast({ 
    icon:"✅", 
    title:"Order Placed!", 
    sub:`Order #${order.orderNumber}` 
  });
  setCart([]);
  setCheckoutOpen(false);
};

// Add to overlays section (around line 922):
{checkoutOpen && (
  <CheckoutModal 
    cart={cart}
    total={cart.reduce((s,i) => s + effectivePrice(i)*i.qty, 0)}
    onClose={() => setCheckoutOpen(false)}
    onSuccess={handleCheckoutSuccess}
  />
)}
```

### Step 3: Start Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

---

## 🧪 Test Checklist

- [ ] Products load from backend
- [ ] Search works
- [ ] Order tracking works
- [ ] Add to cart works
- [ ] Checkout modal opens
- [ ] Razorpay payment opens
- [ ] Order created successfully

---

## 🔑 Test Credentials

### Razorpay Test Card
```
Card Number: 4111 1111 1111 1111
CVV: 123
Expiry: Any future date
```

### Test Order Number
```
ORD-20260202-A3B4C5
```

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/products` | GET | Get all products |
| `/api/products?search=cotton` | GET | Search products |
| `/api/products/:id` | GET | Get single product |
| `/api/orders` | POST | Create order |
| `/api/orders/track/:orderNumber` | GET | Track order |
| `/api/payment/create-order` | POST | Create Razorpay order |
| `/api/payment/verify` | POST | Verify payment |
| `/api/categories` | GET | Get categories |

---

## 🐛 Common Issues

### CORS Error
**Error:** `Access to fetch has been blocked by CORS policy`

**Fix:** Add frontend URL to backend `.env`:
```bash
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Razorpay Not Defined
**Error:** `ReferenceError: Razorpay is not defined`

**Fix:** Add script to `index.html`:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### API 404 Error
**Error:** `GET http://localhost:5000/api/products 404`

**Fix:** Ensure backend is running on port 5000

---

## 📁 Files Created

```
Veluno website/
├── src/
│   ├── services/
│   │   └── api.js              ✅ API service layer
│   └── components/
│       └── CheckoutModal.jsx   ✅ Checkout component
├── .env                         ✅ Environment config
├── FRONTEND_INTEGRATION.md      ✅ Full guide
└── QUICK_START.md               ✅ This file
```

---

## 🎯 Next Steps

1. ✅ Add Razorpay script to HTML
2. ✅ Update veluno (1).jsx imports
3. ✅ Replace PRODUCTS with API call
4. ✅ Add CheckoutModal to overlays
5. ✅ Start both servers
6. ✅ Test complete flow

---

**Ready to go!** 🚀
