const axios = require('axios');

const qikinkAPI = axios.create({
    baseURL: process.env.QIKINK_API_URL || 'https://api.qikink.com/api/v2',
    headers: {
        'Authorization': `Bearer ${process.env.QIKINK_API_KEY}`,
        'Content-Type': 'application/json'
    }
});

// ═══════════════════════════════════════════════════════════════════
// PRODUCT SYNC
// ═══════════════════════════════════════════════════════════════════

// Fetch products from Qikink
exports.fetchQikinkProducts = async () => {
    try {
        const response = await qikinkAPI.get('/products');
        return response.data;
    } catch (error) {
        console.error('Qikink API Error:', error.response?.data || error.message);
        throw error;
    }
};

// Sync Qikink products to your database
exports.syncProducts = async () => {
    try {
        const qikinkProducts = await this.fetchQikinkProducts();
        const Product = require('../models/Product');

        // Handle both array/object response structures potentially returned by API
        const productsList = Array.isArray(qikinkProducts) ? qikinkProducts :
            (qikinkProducts.data ? qikinkProducts.data : []);

        let syncedCount = 0;

        for (const qProduct of productsList) {
            // Transform Qikink product to your schema
            const productData = {
                name: qProduct.name,
                description: qProduct.description || 'Premium quality product from Veluno',
                price: parseFloat(qProduct.price) || 0,
                category: getCategoryFromTags(qProduct.tags) || 'T-Shirts',
                images: qProduct.images || [],
                sizes: qProduct.variants?.map(v => v.size) || ['S', 'M', 'L', 'XL'],
                colors: qProduct.variants?.map(v => v.color) || [],
                stock: qProduct.stock || 100,
                qikinkProductId: qProduct.id,
                isActive: true
            };

            // Update or create product
            await Product.findOneAndUpdate(
                { qikinkProductId: qProduct.id },
                productData,
                { upsert: true, new: true }
            );
            syncedCount++;
        }

        console.log(`Synced ${syncedCount} products from Qikink`);
        return { success: true, count: syncedCount };
    } catch (error) {
        console.error('Product sync failed:', error);
        throw error;
    }
};

// Helper to guess category from tags/name
function getCategoryFromTags(tags) {
    if (!tags) return 'Men';
    const tagStr = Array.isArray(tags) ? tags.join(' ').toLowerCase() : tags.toLowerCase();

    if (tagStr.includes('hoodie')) return 'Hoodies';
    if (tagStr.includes('sweatshirt')) return 'Sweatshirts';
    if (tagStr.includes('oversized')) return 'Oversized T-Shirts';
    if (tagStr.includes('women')) return 'Women';
    if (tagStr.includes('kid')) return 'Kids';
    return 'Men'; // Default
}

// ═══════════════════════════════════════════════════════════════════
// ORDER FULFILLMENT
// ═══════════════════════════════════════════════════════════════════

// Create order on Qikink
exports.createQikinkOrder = async (orderData) => {
    try {
        const qikinkOrder = {
            order_id: orderData.orderNumber,
            customer: {
                name: orderData.customerName,
                email: orderData.email,
                phone: orderData.phone,
                address: {
                    line1: orderData.address.street,
                    city: orderData.address.city,
                    state: orderData.address.state,
                    pincode: orderData.address.postalCode,
                    country: orderData.address.country || 'India'
                }
            },
            items: orderData.products.map(item => ({
                product_id: item.qikinkProductId,
                variant_id: item.qikinkVariantId || null, // Might need logic to find correct variant
                quantity: item.quantity,
                size: item.size,
                color: item.color
            }))
        };

        const response = await qikinkAPI.post('/orders', qikinkOrder);
        return response.data;
    } catch (error) {
        console.error('Qikink order creation failed:', error.response?.data || error.message);
        throw error;
    }
};

// ═══════════════════════════════════════════════════════════════════
// WEBHOOK HANDLER
// ═══════════════════════════════════════════════════════════════════

exports.handleQikinkWebhook = async (webhookData) => {
    try {
        const Order = require('../models/Order');

        switch (webhookData.event) {
            case 'order.shipped':
                await Order.findOneAndUpdate(
                    { orderNumber: webhookData.order_id },
                    {
                        orderStatus: 'shipped',
                        trackingNumber: webhookData.tracking_number,
                        $push: {
                            statusHistory: {
                                status: 'shipped',
                                timestamp: new Date()
                            }
                        }
                    }
                );
                break;

            case 'order.delivered':
                await Order.findOneAndUpdate(
                    { orderNumber: webhookData.order_id },
                    {
                        orderStatus: 'delivered',
                        $push: {
                            statusHistory: {
                                status: 'delivered',
                                timestamp: new Date()
                            }
                        }
                    }
                );
                break;

            case 'order.cancelled':
                await Order.findOneAndUpdate(
                    { orderNumber: webhookData.order_id },
                    {
                        orderStatus: 'cancelled',
                        $push: {
                            statusHistory: {
                                status: 'cancelled',
                                timestamp: new Date()
                            }
                        }
                    }
                );
                break;
        }

        return { success: true };
    } catch (error) {
        console.error('Webhook handling failed:', error);
        throw error;
    }
};
