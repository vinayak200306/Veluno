# Production Security Hardening - Complete Guide

## 🔐 Overview

Complete **production security hardening** for the Veluno e-commerce backend with protection against common attacks, rate limiting, secure headers, and HTTPS readiness.

---

## 📦 Security Packages Installed

### 1. Helmet
**Purpose:** Set secure HTTP headers

```bash
npm install helmet
```

**Protection Against:**
- ✅ XSS (Cross-Site Scripting)
- ✅ Clickjacking
- ✅ MIME sniffing
- ✅ DNS prefetch control
- ✅ Content Security Policy violations

---

### 2. Express Rate Limit
**Purpose:** Prevent brute force and DDoS attacks

```bash
npm install express-rate-limit
```

**Protection Against:**
- ✅ Brute force attacks
- ✅ DDoS attacks
- ✅ API abuse
- ✅ Credential stuffing

---

### 3. Express Mongo Sanitize
**Purpose:** Prevent NoSQL injection

```bash
npm install express-mongo-sanitize
```

**Protection Against:**
- ✅ NoSQL injection attacks
- ✅ MongoDB operator injection
- ✅ Malicious query manipulation

---

### 4. HPP (HTTP Parameter Pollution)
**Purpose:** Prevent parameter pollution

```bash
npm install hpp
```

**Protection Against:**
- ✅ HTTP Parameter Pollution
- ✅ Query string manipulation
- ✅ Duplicate parameter attacks

---

### 5. Compression
**Purpose:** Compress response bodies

```bash
npm install compression
```

**Benefits:**
- ✅ Reduced bandwidth usage
- ✅ Faster response times
- ✅ Better performance

---

## 🛡️ Security Middleware Configuration

### 1. Helmet Configuration

**File:** `config/security.js`

```javascript
const helmet = require('helmet');

const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "checkout.razorpay.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "api.razorpay.com"],
      frameSrc: ["'self'", "api.razorpay.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
});
```

**Headers Set:**
- `X-DNS-Prefetch-Control: off`
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 0`
- `Content-Security-Policy: ...`

---

### 2. Rate Limiting

**File:** `middleware/security.js`

#### General API Rate Limit
```javascript
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests, please try again later.'
});
```

#### Authentication Rate Limit
```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  skipSuccessfulRequests: true
});
```

#### Payment Rate Limit
```javascript
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 payment attempts per hour
});
```

#### Order Rate Limit
```javascript
const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 orders per hour
});
```

**Applied To:**
- `/api/*` - General API limiter (100 req/15min)
- `/api/users` - Auth limiter (5 req/15min)
- `/api/payment` - Payment limiter (10 req/hour)
- `/api/orders` - Order limiter (20 req/hour)

---

### 3. MongoDB Sanitization

**File:** `config/security.js`

```javascript
const mongoSanitize = require('express-mongo-sanitize');

const mongoSanitizeConfig = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized request: ${key} in ${req.path}`);
  },
});
```

**Prevents:**
```javascript
// Malicious input
{ "email": { "$gt": "" } }

// Sanitized to
{ "email": { "_gt": "" } }
```

---

### 4. HPP Protection

**File:** `config/security.js`

```javascript
const hpp = require('hpp');

const hppConfig = hpp({
  whitelist: [
    'price',
    'category',
    'size',
    'color',
    'page',
    'limit',
    'sort',
    'orderStatus',
    'paymentStatus'
  ]
});
```

**Prevents:**
```
// Attack
?price=100&price=200&price=300

// Protected
?price=300 (last value used)
```

---

### 5. CORS Configuration

**File:** `server.js`

```javascript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

**Environment Variable:**
```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

### 6. Payload Size Limits

**File:** `server.js`

```javascript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

**Prevents:**
- ✅ Large payload attacks
- ✅ Memory exhaustion
- ✅ Server overload

---

## 🔒 HTTPS Configuration

### Production Setup

**1. Obtain SSL Certificate**

**Option A: Let's Encrypt (Free)**
```bash
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com
```

**Option B: Commercial SSL**
- Purchase from SSL provider
- Download certificate files

---

**2. Configure HTTPS in Node.js**

**File:** `server.js`

```javascript
const https = require('https');
const fs = require('fs');

if (process.env.NODE_ENV === 'production') {
  const options = {
    key: fs.readFileSync('/path/to/private.key'),
    cert: fs.readFileSync('/path/to/certificate.crt')
  };
  
  https.createServer(options, app).listen(PORT, () => {
    console.log(`HTTPS Server running on port ${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`HTTP Server running on port ${PORT}`);
  });
}
```

---

**3. Force HTTPS Redirect**

```javascript
// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});
```

---

**4. Use Reverse Proxy (Recommended)**

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔐 Environment Variable Protection

### 1. Never Commit .env Files

**File:** `.gitignore`

```
node_modules/
.env
.env.local
.env.production
*.log
```

---

### 2. Use Strong Secrets

**Generate Strong JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Example .env:**
```bash
NODE_ENV=production
PORT=5000

# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname

# JWT (use strong random secret)
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_EXPIRE=30d

# Razorpay
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

### 3. Use Environment-Specific Files

```
.env.development
.env.staging
.env.production
```

**Load based on NODE_ENV:**
```javascript
require('dotenv').config({
  path: `.env.${process.env.NODE_ENV}`
});
```

---

## 🛡️ Attack Prevention

### 1. XSS (Cross-Site Scripting)

**Protected By:**
- ✅ Helmet CSP headers
- ✅ Input validation
- ✅ Output encoding

**Example:**
```javascript
// Malicious input
<script>alert('XSS')</script>

// Blocked by CSP headers
```

---

### 2. NoSQL Injection

**Protected By:**
- ✅ express-mongo-sanitize
- ✅ Mongoose validation

**Example:**
```javascript
// Attack attempt
POST /api/users/login
{
  "email": { "$gt": "" },
  "password": { "$gt": "" }
}

// Sanitized to
{
  "email": { "_gt": "" },
  "password": { "_gt": "" }
}
// Login fails ✅
```

---

### 3. Brute Force Attacks

**Protected By:**
- ✅ Rate limiting on auth routes
- ✅ Account lockout (can be added)

**Example:**
```
Attempt 1: Failed
Attempt 2: Failed
Attempt 3: Failed
Attempt 4: Failed
Attempt 5: Failed
Attempt 6: Blocked for 15 minutes ✅
```

---

### 4. DDoS Attacks

**Protected By:**
- ✅ Rate limiting
- ✅ Payload size limits
- ✅ Cloudflare (recommended)

---

### 5. CSRF (Cross-Site Request Forgery)

**Protected By:**
- ✅ CORS configuration
- ✅ JWT tokens (stateless)
- ✅ SameSite cookies (if using cookies)

---

### 6. Clickjacking

**Protected By:**
- ✅ Helmet X-Frame-Options header

---

## ✅ Production Security Checklist

### Pre-Deployment

- [ ] Install all security packages
- [ ] Configure helmet with CSP
- [ ] Set up rate limiting
- [ ] Enable MongoDB sanitization
- [ ] Configure HPP protection
- [ ] Set up CORS properly
- [ ] Limit payload sizes
- [ ] Enable compression
- [ ] Use strong JWT secrets
- [ ] Never commit .env files
- [ ] Use environment-specific configs

### SSL/TLS

- [ ] Obtain SSL certificate
- [ ] Configure HTTPS
- [ ] Force HTTPS redirect
- [ ] Set up reverse proxy (Nginx/Apache)
- [ ] Enable HTTP/2
- [ ] Configure SSL/TLS settings

### Database

- [ ] Use MongoDB Atlas or secure hosting
- [ ] Enable authentication
- [ ] Whitelist IP addresses
- [ ] Use connection string with credentials
- [ ] Enable encryption at rest
- [ ] Regular backups

### Monitoring

- [ ] Set up error logging
- [ ] Monitor rate limit hits
- [ ] Track failed login attempts
- [ ] Set up uptime monitoring
- [ ] Configure alerts

### Code Security

- [ ] Validate all inputs
- [ ] Sanitize outputs
- [ ] Use parameterized queries
- [ ] Hash passwords (bcrypt)
- [ ] Use JWT for authentication
- [ ] Implement proper error handling
- [ ] Don't expose stack traces in production

### Infrastructure

- [ ] Use firewall
- [ ] Keep dependencies updated
- [ ] Use process manager (PM2)
- [ ] Set up auto-restart
- [ ] Configure proper logging
- [ ] Use CDN for static assets
- [ ] Enable DDoS protection (Cloudflare)

---

## 🚀 Deployment Commands

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name veluno-backend

# Enable auto-restart on system reboot
pm2 startup
pm2 save

# Monitor
pm2 monit

# View logs
pm2 logs veluno-backend

# Restart
pm2 restart veluno-backend
```

---

### Environment Variables in Production

**Set in hosting platform:**

**Heroku:**
```bash
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secret
```

**AWS/DigitalOcean:**
```bash
export NODE_ENV=production
export JWT_SECRET=your_secret
```

---

## 📊 Security Headers Example

**Request:**
```bash
curl -I https://yourdomain.com/api/health
```

**Response Headers:**
```
HTTP/2 200
content-security-policy: default-src 'self';...
x-dns-prefetch-control: off
x-frame-options: SAMEORIGIN
x-content-type-options: nosniff
x-xss-protection: 0
strict-transport-security: max-age=15552000; includeSubDomains
```

---

## 🔍 Testing Security

### 1. Test Rate Limiting

```bash
# Send 10 requests quickly
for i in {1..10}; do
  curl http://localhost:5000/api/users/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

**Expected:** After 5 attempts, should get rate limit error

---

### 2. Test NoSQL Injection

```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":{"$gt":""},"password":{"$gt":""}}'
```

**Expected:** Login should fail (sanitized)

---

### 3. Test CORS

```bash
curl -H "Origin: http://malicious-site.com" \
  http://localhost:5000/api/products
```

**Expected:** CORS error (origin not allowed)

---

### 4. Test Security Headers

```bash
curl -I https://yourdomain.com/api/health
```

**Expected:** See helmet security headers

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

---

## ✅ Summary

**Security Measures Implemented:**
- ✅ Helmet security headers
- ✅ Rate limiting (general, auth, payment, order)
- ✅ MongoDB injection prevention
- ✅ HTTP Parameter Pollution protection
- ✅ CORS configuration
- ✅ Payload size limits
- ✅ Compression
- ✅ HTTPS readiness
- ✅ Environment variable protection

**Your backend is now production-ready and secure!** 🎉
