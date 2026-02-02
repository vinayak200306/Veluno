# Admin Authentication System - Complete Guide

## 🔐 Overview

This is a **production-ready admin-only authentication system** for the Veluno e-commerce backend. It provides secure JWT-based authentication with bcrypt password hashing and role-based access control.

---

## 📁 Files Created

### 1. **Admin Model**
[models/Admin.js](file:///c:/Users/ADMIN/Downloads/Veluno%20website/backend/models/Admin.js)

**Features:**
- Email and password authentication
- Bcrypt password hashing (10 salt rounds)
- Role-based access (admin, superadmin)
- Email validation with regex
- Password minimum length (8 characters)
- Active/inactive status
- Last login tracking
- Password excluded from queries by default
- Password comparison method
- JSON serialization without password

**Schema:**
```javascript
{
  email: String (required, unique, validated),
  password: String (required, hashed, min 8 chars),
  role: String (enum: 'admin', 'superadmin'),
  name: String (required),
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdBy: ObjectId (ref: Admin),
  timestamps: true
}
```

### 2. **Auth Controller**
[controllers/adminAuthController.js](file:///c:/Users/ADMIN/Downloads/Veluno%20website/backend/controllers/adminAuthController.js)

**Endpoints Implemented:**

#### `loginAdmin` - POST /api/admin/login
- Validates email and password
- Checks admin existence and active status
- Verifies password with bcrypt
- Updates last login timestamp
- Returns JWT token and admin data

#### `getAdminProfile` - GET /api/admin/profile
- Returns authenticated admin's profile
- Requires JWT authentication

#### `createAdmin` - POST /api/admin/create
- Creates new admin accounts
- Superadmin only
- Prevents duplicate emails
- Tracks who created the admin

#### `updatePassword` - PUT /api/admin/password
- Updates admin password
- Verifies current password
- Requires authentication

#### `getAllAdmins` - GET /api/admin/list
- Lists all admin accounts
- Superadmin only
- Populates creator information

#### `deactivateAdmin` - PUT /api/admin/:id/deactivate
- Deactivates admin accounts
- Superadmin only
- Prevents self-deactivation

### 3. **Auth Middleware**
[middleware/adminAuthMiddleware.js](file:///c:/Users/ADMIN/Downloads/Veluno%20website/backend/middleware/adminAuthMiddleware.js)

**Middleware Functions:**

#### `protectAdmin`
- Verifies JWT token from Authorization header
- Extracts admin from token
- Checks admin existence and active status
- Attaches admin to `req.admin`

#### `superadminOnly`
- Restricts access to superadmin role only
- Use after `protectAdmin`

#### `adminOnly`
- Allows both admin and superadmin roles
- Use after `protectAdmin`

### 4. **Admin Routes**
[routes/adminRoutes.js](file:///c:/Users/ADMIN/Downloads/Veluno%20website/backend/routes/adminRoutes.js)

**Route Structure:**
```
POST   /api/admin/login              (Public)
GET    /api/admin/profile            (Protected)
PUT    /api/admin/password           (Protected)
POST   /api/admin/create             (Superadmin only)
GET    /api/admin/list               (Superadmin only)
PUT    /api/admin/:id/deactivate     (Superadmin only)
```

### 5. **Example Protected Routes**
[routes/adminProductRoutes.js](file:///c:/Users/ADMIN/Downloads/Veluno%20website/backend/routes/adminProductRoutes.js)

**Admin Product Management:**
```
GET    /api/admin/products           (Admin protected)
POST   /api/admin/products           (Admin protected)
GET    /api/admin/products/:id       (Admin protected)
PUT    /api/admin/products/:id       (Admin protected)
DELETE /api/admin/products/:id       (Admin protected)
```

### 6. **Superadmin Creation Script**
[utils/createSuperadmin.js](file:///c:/Users/ADMIN/Downloads/Veluno%20website/backend/utils/createSuperadmin.js)

**Purpose:**
- Creates the initial superadmin account
- Prevents duplicate superadmin creation
- Provides default credentials for first login

---

## 🚀 Setup Instructions

### Step 1: Create Superadmin Account

Before you can use the admin system, you need to create the first superadmin:

```bash
npm run create-superadmin
```

**Default Credentials:**
- **Email:** admin@veluno.com
- **Password:** Admin@123456

⚠️ **IMPORTANT:** Change this password immediately after first login!

### Step 2: Test Admin Login

**Request:**
```bash
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@veluno.com",
    "password": "Admin@123456"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "admin": {
    "_id": "...",
    "name": "Super Admin",
    "email": "admin@veluno.com",
    "role": "superadmin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Step 3: Use Token for Protected Routes

Copy the token from the login response and use it in the Authorization header:

```bash
curl -X GET http://localhost:5000/api/admin/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📡 API Usage Examples

### 1. Admin Login
```javascript
// POST /api/admin/login
{
  "email": "admin@veluno.com",
  "password": "Admin@123456"
}

// Response
{
  "success": true,
  "message": "Login successful",
  "admin": { ... },
  "token": "eyJhbGci..."
}
```

### 2. Get Admin Profile
```javascript
// GET /api/admin/profile
// Headers: Authorization: Bearer <token>

// Response
{
  "success": true,
  "admin": {
    "_id": "...",
    "name": "Super Admin",
    "email": "admin@veluno.com",
    "role": "superadmin",
    "lastLogin": "2026-02-02T06:51:26.000Z",
    "createdAt": "2026-02-02T06:45:00.000Z"
  }
}
```

### 3. Create New Admin (Superadmin Only)
```javascript
// POST /api/admin/create
// Headers: Authorization: Bearer <superadmin_token>
{
  "name": "John Doe",
  "email": "john@veluno.com",
  "password": "SecurePass123",
  "role": "admin"
}

// Response
{
  "success": true,
  "message": "Admin created successfully",
  "admin": { ... }
}
```

### 4. Update Password
```javascript
// PUT /api/admin/password
// Headers: Authorization: Bearer <token>
{
  "currentPassword": "Admin@123456",
  "newPassword": "NewSecurePass123"
}

// Response
{
  "success": true,
  "message": "Password updated successfully"
}
```

### 5. Get All Admins (Superadmin Only)
```javascript
// GET /api/admin/list
// Headers: Authorization: Bearer <superadmin_token>

// Response
{
  "success": true,
  "count": 3,
  "admins": [...]
}
```

### 6. Deactivate Admin (Superadmin Only)
```javascript
// PUT /api/admin/:id/deactivate
// Headers: Authorization: Bearer <superadmin_token>

// Response
{
  "success": true,
  "message": "Admin deactivated successfully"
}
```

---

## 🔒 Security Features

✅ **Password Hashing** - Bcrypt with 10 salt rounds  
✅ **JWT Authentication** - Secure token-based auth  
✅ **Role-Based Access** - Admin and Superadmin roles  
✅ **Account Status** - Active/inactive admin accounts  
✅ **Password Validation** - Minimum 8 characters  
✅ **Email Validation** - Regex pattern matching  
✅ **Token Verification** - JWT signature validation  
✅ **Password Exclusion** - Never returned in queries  
✅ **Self-Protection** - Cannot deactivate own account  
✅ **Duplicate Prevention** - Unique email constraint  

---

## 🛡️ Middleware Usage

### Protect Admin Routes
```javascript
const { protectAdmin } = require('../middleware/adminAuthMiddleware');

router.get('/dashboard', protectAdmin, getDashboard);
```

### Superadmin Only Routes
```javascript
const { protectAdmin, superadminOnly } = require('../middleware/adminAuthMiddleware');

router.post('/settings', protectAdmin, superadminOnly, updateSettings);
```

### Admin or Superadmin Routes
```javascript
const { protectAdmin, adminOnly } = require('../middleware/adminAuthMiddleware');

router.get('/reports', protectAdmin, adminOnly, getReports);
```

---

## 🔑 Authorization Header Format

All protected routes require the JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example with Fetch:**
```javascript
fetch('http://localhost:5000/api/admin/profile', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

**Example with Axios:**
```javascript
axios.get('http://localhost:5000/api/admin/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

---

## 📝 Error Responses

### Invalid Credentials
```json
{
  "success": false,
  "error": "Invalid credentials",
  "timestamp": "2026-02-02T06:51:26.000Z"
}
```

### No Token Provided
```json
{
  "success": false,
  "error": "Not authorized - no token provided",
  "timestamp": "2026-02-02T06:51:26.000Z"
}
```

### Invalid Token
```json
{
  "success": false,
  "error": "Not authorized - invalid token",
  "timestamp": "2026-02-02T06:51:26.000Z"
}
```

### Insufficient Permissions
```json
{
  "success": false,
  "error": "Access denied - superadmin privileges required",
  "timestamp": "2026-02-02T06:51:26.000Z"
}
```

### Deactivated Account
```json
{
  "success": false,
  "error": "Admin account is deactivated",
  "timestamp": "2026-02-02T06:51:26.000Z"
}
```

---

## 🎯 Best Practices

1. **Change Default Password** - Immediately after first login
2. **Use Strong Passwords** - Minimum 8 characters with complexity
3. **Secure JWT_SECRET** - Use a long, random string in production
4. **HTTPS Only** - Always use HTTPS in production
5. **Token Expiration** - Set appropriate JWT_EXPIRE in .env
6. **Regular Audits** - Review admin accounts periodically
7. **Deactivate Unused** - Deactivate instead of deleting admins
8. **Monitor Logins** - Track lastLogin timestamps

---

## 🔄 Integration with Existing Routes

You can now protect any existing route with admin authentication:

**Before:**
```javascript
router.post('/products', createProduct);
```

**After:**
```javascript
const { protectAdmin } = require('../middleware/adminAuthMiddleware');

router.post('/products', protectAdmin, createProduct);
```

---

## ✅ Testing Checklist

- [ ] Create superadmin account
- [ ] Login with superadmin credentials
- [ ] Get admin profile
- [ ] Update password
- [ ] Create new admin
- [ ] List all admins
- [ ] Deactivate admin
- [ ] Test protected product routes
- [ ] Verify token expiration
- [ ] Test invalid credentials
- [ ] Test deactivated account access

---

## 🚀 Next Steps

1. **Run the superadmin creation script**
2. **Test the login endpoint**
3. **Update the default password**
4. **Create additional admin accounts**
5. **Integrate with your frontend**
6. **Add admin dashboard routes**
7. **Implement admin activity logging**

---

**Admin authentication system is ready to use!** 🎉
