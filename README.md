# Veluno E-Commerce Website

**Style Meets Bravery** ⚡

Premium streetwear e-commerce platform built with React, Node.js, and MongoDB.

## 🌐 Live Site
**https://officialveluno.in**

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account
- Razorpay account (Indian payment gateway)
- Qikink account (print-on-demand fulfillment)

### Local Development

**1. Backend Setup**
```bash
cd backend
npm install
# Update backend/.env with your credentials
npm run dev
# Backend runs on http://localhost:5000
```

**2. Frontend Setup**
```bash
# In root directory
npm install
# Update .env with local API URL
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 📁 Project Structure

```
veluno-website/
├── backend/                 # Node.js + Express API
│   ├── config/             # Database & app config
│   ├── controllers/        # Route controllers
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Auth & validation
│   ├── utils/              # Helper functions
│   └── server.js           # Entry point
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── services/           # API services
│   └── main.jsx            # Entry point
├── veluno (1).jsx          # Main app component
├── index.html              # HTML template
├── package.json            # Frontend dependencies
└── vite.config.js          # Vite configuration
```

---

## 🔧 Tech Stack

**Frontend:**
- React 18
- Vite
- Vanilla CSS

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Razorpay (Payments)
- Qikink API (Fulfillment)

**Deployment:**
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas
- Domain: officialveluno.in

---

## 📚 Documentation

- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[Quick Deploy](./QUICK_DEPLOY.md)** - Fast-track 30-minute deployment
- **[Deployment Plan](./deployment_plan.md)** - Step-by-step deployment checklist
- **[Backend API Docs](./backend/README.md)** - API documentation
- **[Product API](./backend/PRODUCT_API_DOCS.md)** - Product endpoints
- **[Order API](./backend/ORDER_API_DOCS.md)** - Order endpoints
- **[Admin Guide](./backend/ADMIN_AUTH_GUIDE.md)** - Admin authentication

---

## 🔑 Environment Variables

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### Backend (backend/.env)
```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
QIKINK_API_KEY=your_qikink_api_key
QIKINK_API_SECRET=your_qikink_api_secret
ALLOWED_ORIGINS=http://localhost:5173
```

---

## 🎯 Features

✅ Product catalog with categories
✅ Search & filter functionality
✅ Shopping cart with quantity management
✅ Razorpay payment integration
✅ Order tracking system
✅ Size guide modal
✅ Recently viewed products
✅ Mobile responsive design
✅ Admin panel for product/order management
✅ Qikink integration for fulfillment
✅ Secure JWT authentication
✅ Rate limiting & security middleware

---

## 🚀 Deployment

See **[deployment_plan.md](./deployment_plan.md)** for complete deployment instructions.

**Quick Deploy:**
1. Deploy backend to Render
2. Deploy frontend to Vercel
3. Configure DNS for officialveluno.in
4. Set up webhooks (Razorpay, Qikink)
5. Create admin user
6. Test & go live!

**Total Time:** ~45 minutes
**Cost:** FREE (using free tiers)

---

## 📞 Support

- **Email:** officialveluno@gmail.com
- **Instagram:** [@officialveluno](https://www.instagram.com/officialveluno)

---

## 📄 License

All rights reserved © 2026 Veluno

---

**Built with ❤️ in India**
