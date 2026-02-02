const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, 'Product reference is required']
    },
    productName: {
        type: String,
        required: true
    },
    productImage: {
        type: String,
        required: true
    },
    size: {
        type: String,
        required: [true, 'Size is required']
    },
    color: {
        type: String
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1'],
        validate: {
            validator: Number.isInteger,
            message: 'Quantity must be a whole number'
        }
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    subtotal: {
        type: Number,
        required: true
    }
});

const orderSchema = new mongoose.Schema({
    orderNumber: {
        type: String,
        unique: true,
        required: true
    },
    customerName: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
        maxlength: [100, 'Customer name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        validate: {
            validator: function (v) {
                return /^[0-9]{10,15}$/.test(v.replace(/[\s\-\(\)]/g, ''));
            },
            message: 'Please provide a valid phone number'
        }
    },
    address: {
        street: {
            type: String,
            required: [true, 'Street address is required'],
            trim: true
        },
        city: {
            type: String,
            required: [true, 'City is required'],
            trim: true
        },
        state: {
            type: String,
            required: [true, 'State is required'],
            trim: true
        },
        postalCode: {
            type: String,
            required: [true, 'Postal code is required'],
            trim: true
        },
        country: {
            type: String,
            required: [true, 'Country is required'],
            trim: true,
            default: 'India'
        }
    },
    products: {
        type: [orderItemSchema],
        required: [true, 'Order must contain at least one product'],
        validate: {
            validator: function (products) {
                return products && products.length > 0;
            },
            message: 'Order must contain at least one product'
        }
    },
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required'],
        min: [0, 'Total amount cannot be negative']
    },
    paymentStatus: {
        type: String,
        required: true,
        enum: {
            values: ['pending', 'paid', 'failed', 'refunded'],
            message: '{VALUE} is not a valid payment status'
        },
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cod', 'card', 'upi', 'netbanking', 'wallet'],
        default: 'cod'
    },
    paymentId: {
        type: String,
        trim: true
    },
    orderStatus: {
        type: String,
        required: true,
        enum: {
            values: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
            message: '{VALUE} is not a valid order status'
        },
        default: 'pending'
    },
    trackingNumber: {
        type: String,
        trim: true
    },
    shippingCost: {
        type: Number,
        default: 0,
        min: [0, 'Shipping cost cannot be negative']
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Discount cannot be negative']
    },
    notes: {
        type: String,
        maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    cancelReason: {
        type: String,
        maxlength: [500, 'Cancel reason cannot exceed 500 characters']
    },
    statusHistory: [{
        status: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Admin'
        },
        note: String
    }],
    deliveredAt: Date,
    cancelledAt: Date
}, {
    timestamps: true
});

// Indexes for better query performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ email: 1 });
orderSchema.index({ phone: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

// Pre-save middleware to generate order number
orderSchema.pre('save', function (next) {
    if (!this.orderNumber && this.isNew) {
        // Generate order number: ORD-YYYYMMDD-RANDOM
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.orderNumber = `ORD-${dateStr}-${random}`;
    }
    next();
});

// Pre-save middleware to add status to history
orderSchema.pre('save', function (next) {
    if (this.isModified('orderStatus')) {
        this.statusHistory.push({
            status: this.orderStatus,
            timestamp: new Date()
        });
    }
    next();
});

// Virtual for full address
orderSchema.virtual('fullAddress').get(function () {
    return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.postalCode}, ${this.address.country}`;
});

// Virtual for total items
orderSchema.virtual('totalItems').get(function () {
    return this.products.reduce((total, item) => total + item.quantity, 0);
});

// Ensure virtuals are included in JSON
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);
