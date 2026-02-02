# 🎯 VELUNO - YOUR ACTION PLAN

## ⚡ START HERE - Do These 3 Things Now

### 1️⃣ Get Your API Keys (15 minutes)

**MongoDB (Database):**
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up (free)
3. Create cluster → Get connection string
4. Copy: `mongodb+srv://username:password@cluster.mongodb.net/veluno`

**Razorpay (Payments):**
1. Go to [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Sign up
3. Settings → API Keys → Generate Test Keys
4. Copy: Key ID and Key Secret

**Qikink (Products):**
1. Go to [qikink.com](https://qikink.com)
2. Login to your account
3. Settings → API Keys
4. Copy: API Key and Secret

---

### 2️⃣ Update Environment Files (5 minutes)

**File: `backend/.env`**
```bash
# Replace these with your actual values
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster.mongodb.net/veluno
JWT_SECRET=your-super-secret-random-string-here
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_SECRET
RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET
QIKINK_API_KEY=YOUR_QIKINK_KEY
QIKINK_API_SECRET=YOUR_QIKINK_SECRET
ALLOWED_ORIGINS=http://localhost:5173
```

**File: `.env` (frontend root)**
```bash
VITE_API_URL=http://localhost:5000/api
```

---

### 3️⃣ Frontend Integration (30 minutes)

**A. Add Razorpay Script**

Open `index.html`, add in `<head>`:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

**B. Update `veluno (1).jsx`**

Add at top (line 1-2):
```javascript
import { productAPI, transformProduct } from './services/api';
import CheckoutModal from './components/CheckoutModal';
```

Replace line 12-27 (PRODUCTS array) with:
```javascript
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);

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
```

Add after line 819 (in VelunoStore function):
```javascript
const [checkoutOpen, setCheckoutOpen] = useState(false);

const handleCheckoutSuccess = (order) => {
  addToast({ icon:"✅", title:"Order Placed!", sub:`Order #${order.orderNumber}` });
  setCart([]);
  setCheckoutOpen(false);
};
```

Update line 825 to use `products` instead of `PRODUCTS`:
```javascript
const filteredProducts = filter==="All" ? products : products.filter(p => p.category===filter);
```

In CartDrawer (around line 605), replace checkout button with:
```javascript
<button onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>
  Proceed to Checkout
</button>
```

Add to overlays section (around line 925):
```javascript
{checkoutOpen && (
  <CheckoutModal 
    cart={cart}
    total={cart.reduce((s,i) => s + effectivePrice(i)*i.qty, 0)}
    onClose={() => setCheckoutOpen(false)}
    onSuccess={handleCheckoutSuccess}
  />
)}
```

---

## 🚀 Test It Out

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend
npm install
npm run dev
```

**Open:** http://localhost:5173

**Test:**
- Products should load from backend
- Search should work
- Add to cart → Checkout → Razorpay opens
- Use test card: `4111 1111 1111 1111`

---

## 📦 Qikink Integration (Do After Testing Above)

### Install Dependencies
```bash
cd backend
npm install axios node-cron
```

### Create Qikink Service

**File: `backend/services/qikinkService.js`**
- Copy entire code from `QIKINK_INTEGRATION.md` (lines 15-150)

### Create Qikink Routes

**File: `backend/routes/qikinkRoutes.js`**
- Copy code from `QIKINK_INTEGRATION.md` (lines 180-200)

### Update Files

**1. `backend/models/Product.js`** - Add after line 50:
```javascript
qikinkProductId: { type: String, unique: true, sparse: true },
qikinkVariantId: String,
```

**2. `backend/server.js`** - Add after line 54:
```javascript
app.use('/api/qikink', require('./routes/qikinkRoutes'));
```

### Sync Products from Qikink

```bash
# Create admin user first
POST http://localhost:5000/api/users/register
{
  "name": "Admin",
  "email": "admin@veluno.com",
  "password": "SecurePass123",
  "role": "admin"
}

# Then sync products
POST http://localhost:5000/api/qikink/sync-products
Authorization: Bearer <your_admin_token>
```

---

## ✅ Complete Checklist

### Immediate (Do Now)
- [ ] Get MongoDB credentials
- [ ] Get Razorpay test keys
- [ ] Get Qikink API keys
- [ ] Update `backend/.env`
- [ ] Update frontend `.env`
- [ ] Add Razorpay script to HTML
- [ ] Update `veluno (1).jsx`
- [ ] Test: npm run dev (both servers)

### Next (After Testing)
- [ ] Install axios & node-cron
- [ ] Create qikinkService.js
- [ ] Create qikinkRoutes.js
- [ ] Update Product model
- [ ] Update server.js
- [ ] Create admin user
- [ ] Sync products from Qikink
- [ ] Test complete order flow

### Later (When Ready)
- [ ] Deploy backend (Render/Heroku)
- [ ] Deploy frontend (Vercel)
- [ ] Set up domain
- [ ] Configure webhooks

---

## 📞 Need Help?

**Check these files:**
- `WHATS_LEFT.md` - Detailed task list
- `QUICK_START.md` - Quick integration guide
- `QIKINK_INTEGRATION.md` - Qikink setup
- `FRONTEND_INTEGRATION.md` - API integration
- `PRODUCTION_SECURITY.md` - Security guide

**Common Issues:**
- **CORS Error**: Update `ALLOWED_ORIGINS` in backend `.env`
- **MongoDB Error**: Check connection string format
- **Razorpay Error**: Verify test keys are correct
- **Products Not Loading**: Check backend is running on port 5000

---

## 🎯 Time Estimate

- **Get credentials**: 15 mins
- **Update env files**: 5 mins
- **Frontend integration**: 30 mins
- **Test**: 15 mins
- **Qikink integration**: 1 hour
- **Final testing**: 30 mins

**Total: ~2.5 hours to fully working store**

---

## 🎉 What You'll Have

✅ Fully functional e-commerce website
✅ Product catalog from Qikink
✅ Secure Razorpay payments
✅ Order management system
✅ Automatic inventory tracking
✅ Order tracking for customers
✅ Admin dashboard APIs
✅ Production-ready security

---

**Start with Step 1 above and work your way down!** 💪

**Everything is built - you just need to connect the pieces!** 🚀
