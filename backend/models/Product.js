const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Product description is required'],
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price cannot be negative'],
        validate: {
            validator: function (value) {
                return value > 0;
            },
            message: 'Price must be greater than 0'
        }
    },
    category: {
        type: String,
        required: [true, 'Product category is required'],
        enum: {
            values: ['Men', 'Women', 'Kids', 'Accessories', 'Footwear', 'Activewear'],
            message: '{VALUE} is not a valid category'
        }
    },
    sizes: {
        type: [String],
        required: [true, 'At least one size is required'],
        validate: {
            validator: function (sizes) {
                return sizes && sizes.length > 0;
            },
            message: 'Product must have at least one size'
        },
        enum: {
            values: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'],
            message: '{VALUE} is not a valid size'
        }
    },
    stock: {
        type: Number,
        required: [true, 'Stock quantity is required'],
        min: [0, 'Stock cannot be negative'],
        default: 0,
        validate: {
            validator: Number.isInteger,
            message: 'Stock must be a whole number'
        }
    },
    images: {
        type: [String],
        required: [true, 'At least one product image is required'],
        validate: {
            validator: function (images) {
                return images && images.length > 0 && images.length <= 10;
            },
            message: 'Product must have between 1 and 10 images'
        }
    },
    // Additional useful fields
    sku: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    brand: {
        type: String,
        trim: true
    },
    colors: {
        type: [String],
        default: []
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    discount: {
        type: Number,
        min: [0, 'Discount cannot be negative'],
        max: [100, 'Discount cannot exceed 100%'],
        default: 0
    },
    tags: {
        type: [String],
        default: []
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, {
    timestamps: true
});

// Indexes for better query performance
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

// Virtual for final price after discount
productSchema.virtual('finalPrice').get(function () {
    if (this.discount > 0) {
        return this.price - (this.price * this.discount / 100);
    }
    return this.price;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function () {
    if (this.stock === 0) return 'Out of Stock';
    if (this.stock < 10) return 'Low Stock';
    return 'In Stock';
});

// Ensure virtuals are included in JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Pre-save middleware to generate SKU if not provided
productSchema.pre('save', function (next) {
    if (!this.sku && this.isNew) {
        // Generate SKU: CATEGORY-TIMESTAMP-RANDOM
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.sku = `${this.category.substring(0, 3).toUpperCase()}-${timestamp}-${random}`;
    }
    next();
});

module.exports = mongoose.model('Product', productSchema);
