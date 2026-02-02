# 📍 WHERE TO PASTE YOUR API KEYS

## ✅ DONE FOR YOU:
- ✅ Backend environment file created with placeholders
- ✅ Frontend integration complete
- ✅ Razorpay script added to HTML
- ✅ Checkout modal integrated
- ✅ Products will load from backend API

---

## 🔑 STEP 1: Get Your API Keys

### MongoDB Atlas (Database)
1. Go to: https://www.mongodb.com/cloud/atlas
2. Sign up (free tier available)
3. Create a cluster
4. Click "Connect" → "Connect your application"
5. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/veluno`)

**✅ ALREADY DONE!** Your MongoDB is already configured in `backend/.env` line 6

### Razorpay (Payment Gateway)
1. Go to: https://dashboard.razorpay.com
2. Sign up / Login
3. Go to Settings → API Keys
4. Click "Generate Test Keys" (for development)
5. Copy:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret** (long string)

### Qikink (Product Fulfillment)
1. Go to: https://qikink.com
2. Login to your account
3. Go to Settings → API Keys
4. Generate API Key and Secret
5. Copy both values

---

## 📝 STEP 2: Paste Keys in Backend Environment File

**File:** `backend/.env`

**Open this file and replace the placeholders:**

```bash
# Line 24-26: RAZORPAY KEYS
RAZORPAY_KEY_ID=rzp_test_PASTE_YOUR_KEY_ID_HERE          ← Replace this
RAZORPAY_KEY_SECRET=PASTE_YOUR_KEY_SECRET_HERE            ← Replace this
RAZORPAY_WEBHOOK_SECRET=PASTE_YOUR_WEBHOOK_SECRET_HERE    ← Replace this

# Line 36-38: QIKINK KEYS
QIKINK_API_KEY=PASTE_YOUR_QIKINK_API_KEY_HERE            ← Replace this
QIKINK_API_SECRET=PASTE_YOUR_QIKINK_API_SECRET_HERE      ← Replace this
```

**Example (after pasting):**
```bash
RAZORPAY_KEY_ID=rzp_test_1234567890abcdef
RAZORPAY_KEY_SECRET=abcdef1234567890abcdef1234567890
RAZORPAY_WEBHOOK_SECRET=webhook_secret_here

QIKINK_API_KEY=qk_1234567890
QIKINK_API_SECRET=qks_abcdef1234567890
```

---

## ✅ STEP 3: Verify Frontend Environment

**File:** `.env` (in root folder)

**Already configured!** Should contain:
```bash
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 STEP 4: Start the Application

### Terminal 1 - Backend
```bash
cd backend
npm install
npm run dev
```

**Expected output:**
```
✓ Server running on port 5000
✓ MongoDB connected successfully
```

### Terminal 2 - Frontend
```bash
npm install
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

---

## 🧪 STEP 5: Test the Integration

1. **Open:** http://localhost:5173
2. **Check:** Products should load from backend
3. **Test Search:** Click search icon, type something
4. **Test Cart:** Add items to cart
5. **Test Checkout:** 
   - Click cart → "Proceed to Checkout"
   - Fill form
   - Click "Pay with Razorpay"
   - Use test card: `4111 1111 1111 1111`
   - CVV: `123`, Expiry: any future date

---

## 📂 File Locations Summary

| What | Where to Paste |
|------|----------------|
| **Razorpay Keys** | `backend/.env` lines 24-26 |
| **Qikink Keys** | `backend/.env` lines 36-38 |
| **MongoDB URI** | Already set in `backend/.env` line 6 |
| **Frontend API URL** | Already set in `.env` |

---

## ✅ Checklist

- [ ] Get Razorpay test keys
- [ ] Get Qikink API keys
- [ ] Paste Razorpay keys in `backend/.env`
- [ ] Paste Qikink keys in `backend/.env`
- [ ] Run `cd backend && npm install && npm run dev`
- [ ] Run `npm install && npm run dev` (in new terminal)
- [ ] Test: Products load
- [ ] Test: Add to cart
- [ ] Test: Checkout with Razorpay

---

## 🎉 What's Already Done

✅ Backend environment file with placeholders
✅ Frontend `.env` configured
✅ `index.html` with Razorpay script
✅ `veluno (1).jsx` updated with API integration
✅ Checkout modal component created
✅ API service layer created
✅ All imports added
✅ Products fetch from backend
✅ Checkout flow integrated

**You just need to paste your API keys and start the servers!** 🚀
