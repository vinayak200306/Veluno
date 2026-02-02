// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        throw error;
    }
};

// ═══════════════════════════════════════════════════════════════════
// PRODUCT APIs
// ═══════════════════════════════════════════════════════════════════

export const productAPI = {
    // Get all products with optional filters
    getAll: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.category) params.append('category', filters.category);
        if (filters.search) params.append('search', filters.search);
        if (filters.page) params.append('page', filters.page);
        if (filters.limit) params.append('limit', filters.limit);

        const query = params.toString();
        return await apiCall(`/products${query ? `?${query}` : ''}`);
    },

    // Get single product by ID
    getById: async (id) => {
        return await apiCall(`/products/${id}`);
    },

    // Search products
    search: async (query) => {
        return await apiCall(`/products?search=${encodeURIComponent(query)}`);
    },
};

// ═══════════════════════════════════════════════════════════════════
// ORDER APIs
// ═══════════════════════════════════════════════════════════════════

export const orderAPI = {
    // Create new order
    create: async (orderData) => {
        return await apiCall('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData),
        });
    },

    // Track order by order number
    track: async (orderNumber) => {
        return await apiCall(`/orders/track/${orderNumber}`);
    },

    // Get order by ID
    getById: async (orderId) => {
        return await apiCall(`/orders/${orderId}`);
    },
};

// ═══════════════════════════════════════════════════════════════════
// PAYMENT APIs (Razorpay)
// ═══════════════════════════════════════════════════════════════════

export const paymentAPI = {
    // Create Razorpay order
    createOrder: async (amount, currency = 'INR') => {
        return await apiCall('/payment/create-order', {
            method: 'POST',
            body: JSON.stringify({
                amount,
                currency,
                receipt: `receipt_${Date.now()}`,
            }),
        });
    },

    // Verify payment
    verifyPayment: async (paymentData) => {
        return await apiCall('/payment/verify', {
            method: 'POST',
            body: JSON.stringify(paymentData),
        });
    },
};

// ═══════════════════════════════════════════════════════════════════
// CATEGORY APIs
// ═══════════════════════════════════════════════════════════════════

export const categoryAPI = {
    // Get all categories
    getAll: async () => {
        return await apiCall('/categories');
    },
};

// ═══════════════════════════════════════════════════════════════════
// RAZORPAY CHECKOUT HELPER
// ═══════════════════════════════════════════════════════════════════

export const initiateRazorpayPayment = async (orderData, onSuccess, onFailure) => {
    try {
        // Create Razorpay order
        const { order, key_id } = await paymentAPI.createOrder(orderData.totalAmount);

        // Razorpay checkout options
        const options = {
            key: key_id,
            amount: order.amount * 100, // Amount in paise
            currency: order.currency,
            name: 'Veluno',
            description: 'Order Payment',
            order_id: order.id,
            handler: async function (response) {
                try {
                    // Verify payment on backend
                    const verifyData = {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        orderData: orderData,
                    };

                    const result = await paymentAPI.verifyPayment(verifyData);

                    if (result.success && result.verified) {
                        onSuccess(result.order);
                    } else {
                        onFailure(new Error('Payment verification failed'));
                    }
                } catch (error) {
                    onFailure(error);
                }
            },
            prefill: {
                name: orderData.customerName,
                email: orderData.email,
                contact: orderData.phone,
            },
            theme: {
                color: '#c8a96e', // Veluno gold
            },
            modal: {
                ondismiss: function () {
                    onFailure(new Error('Payment cancelled by user'));
                }
            }
        };

        // Open Razorpay checkout
        const razorpay = new window.Razorpay(options);
        razorpay.open();
    } catch (error) {
        onFailure(error);
    }
};

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

// Transform backend product to frontend format
export const transformProduct = (backendProduct) => {
    return {
        id: backendProduct._id,
        name: backendProduct.name,
        category: backendProduct.category,
        type: backendProduct.type || 'Classic Tee',
        price: backendProduct.price,
        salePrice: backendProduct.discount > 0
            ? backendProduct.price - (backendProduct.price * backendProduct.discount / 100)
            : null,
        sizes: backendProduct.sizes,
        img: backendProduct.images[0],
        badge: backendProduct.isFeatured ? 'HOT' : (backendProduct.isNew ? 'NEW' : null),
    };
};

// Transform cart to order format
export const transformCartToOrder = (cart, customerInfo) => {
    return {
        customerName: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        address: {
            street: customerInfo.address.street,
            city: customerInfo.address.city,
            state: customerInfo.address.state,
            postalCode: customerInfo.address.postalCode,
            country: customerInfo.address.country || 'India',
        },
        products: cart.map(item => ({
            productId: item.id,
            size: item.size,
            color: item.color || '',
            quantity: item.qty,
        })),
        paymentMethod: customerInfo.paymentMethod || 'cod',
        shippingCost: customerInfo.shippingCost || 0,
        discount: customerInfo.discount || 0,
        notes: customerInfo.notes || '',
    };
};

export default {
    productAPI,
    orderAPI,
    paymentAPI,
    categoryAPI,
    initiateRazorpayPayment,
    transformProduct,
    transformCartToOrder,
};
