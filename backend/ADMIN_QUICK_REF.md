# Admin Authentication - Quick Reference

## 🚀 Quick Start

### 1. Create Superadmin
```bash
npm run create-superadmin
```

**Default Login:**
- Email: `admin@veluno.com`
- Password: `Admin@123456`

### 2. Login
```bash
POST /api/admin/login
{
  "email": "admin@veluno.com",
  "password": "Admin@123456"
}
```

### 3. Use Token
```bash
Authorization: Bearer YOUR_TOKEN_HERE
```

---

## 📡 API Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/admin/login` | Public | Admin login |
| GET | `/api/admin/profile` | Admin | Get profile |
| PUT | `/api/admin/password` | Admin | Update password |
| POST | `/api/admin/create` | Superadmin | Create admin |
| GET | `/api/admin/list` | Superadmin | List admins |
| PUT | `/api/admin/:id/deactivate` | Superadmin | Deactivate admin |

---

## 🔒 Middleware

```javascript
const { protectAdmin, superadminOnly } = require('../middleware/adminAuthMiddleware');

// Protect route (any admin)
router.get('/route', protectAdmin, controller);

// Superadmin only
router.post('/route', protectAdmin, superadminOnly, controller);
```

---

## 📁 Files

- `models/Admin.js` - Admin model with bcrypt
- `controllers/adminAuthController.js` - Auth logic
- `middleware/adminAuthMiddleware.js` - JWT middleware
- `routes/adminRoutes.js` - Admin routes
- `routes/adminProductRoutes.js` - Example protected routes
- `utils/createSuperadmin.js` - Superadmin creation script

---

## 🔑 Admin Object

```javascript
req.admin = {
  _id: ObjectId,
  name: String,
  email: String,
  role: 'admin' | 'superadmin',
  isActive: Boolean,
  lastLogin: Date
}
```

---

## ⚠️ Important

1. **Change default password** after first login
2. **Use HTTPS** in production
3. **Set strong JWT_SECRET** in .env
4. **Token in header:** `Authorization: Bearer <token>`
5. **Deactivate** unused admins (don't delete)
