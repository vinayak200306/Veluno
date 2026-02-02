import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const T = {
    bg: "#0d0d0d", bgCard: "#141414", bgHover: "#1a1a1a",
    border: "#1e1e1e", borderHi: "#c8a96e33",
    gold: "#c8a96e", text: "#ffffff", textDim: "#666666"
};

export default function AdminDashboard() {
    const [token, setToken] = useState(localStorage.getItem('adminToken'));
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [syncStatus, setSyncStatus] = useState('');
    const [stats, setStats] = useState(null);
    const [orders, setOrders] = useState([]);

    // Add Product State
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '', description: '', price: '', category: 'Men',
        image: '', sizes: 'S, M, L, XL', colors: 'Black, White', qikinkProductId: ''
    });

    const inputStyle = {
        width: '100%', padding: '10px', background: '#0a0a0a',
        border: `1px solid ${T.border}`, color: 'white', borderRadius: '4px', outline: 'none'
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (limit to 2MB to be safe for MongoDB and performance)
        if (file.size > 2 * 1024 * 1024) {
            alert('File is too large. Please select an image under 2MB.');
            return;
        }

        setUploading(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            setNewProduct(prev => ({ ...prev, image: reader.result }));
            setUploading(false);
        };
        reader.onerror = () => {
            alert('Failed to read file');
            setUploading(false);
        };
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await adminAPI.createProduct({
                ...newProduct,
                price: Number(newProduct.price),
                images: [newProduct.image],
                sizes: newProduct.sizes.split(',').map(s => s.trim()),
                colors: newProduct.colors.split(',').map(c => c.trim()),
                stock: 100 // Default stock
            }, token);
            alert('Product Created Successfully!');
            setShowAddProduct(false);
            setNewProduct({ name: '', description: '', price: '', category: 'Men', image: '', sizes: 'S, M, L, XL', colors: 'Black, White', qikinkProductId: '' });
            fetchData(token);
        } catch (err) {
            alert('Failed to create product: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Login Handler
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await adminAPI.login(email, password);
            if (res.token) {
                setToken(res.token);
                localStorage.setItem('adminToken', res.token);
                fetchData(res.token);
            } else {
                setError('Invalid credentials');
            }
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    // Logout Handler
    const handleLogout = () => {
        setToken(null);
        localStorage.removeItem('adminToken');
        setStats(null);
        setOrders([]);
    };

    // Data Fetcher
    const fetchData = async (authToken) => {
        try {
            const statsRes = await adminAPI.getStats(authToken);
            if (statsRes.success) setStats(statsRes.stats);

            const ordersRes = await adminAPI.getOrders(authToken);
            // Handle different API response structures safely
            const ordersList = ordersRes.orders || (ordersRes.data?.orders) || [];
            console.log("Fetched orders:", ordersList); // Debugging
            setOrders(ordersList);
        } catch (err) {
            console.error(err);
            if (err.message.includes('401')) handleLogout();
        }
    };

    // Qikink Sync Handler
    const handleSync = async () => {
        setSyncStatus('Syncing...');
        try {
            const res = await adminAPI.syncProducts(token);
            setSyncStatus(`Success! Synced ${res.count} products.`);
            fetchData(token); // Refresh stats
        } catch (err) {
            console.error("Sync Error:", err);
            setSyncStatus(`Sync failed: ${err.message}`);
        }
    };

    useEffect(() => {
        if (token) fetchData(token);
    }, [token]);

    // ─── LOGIN VIEW ─────────────────────────────────────────────────────
    if (!token) {
        return (
            <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text, fontFamily: 'sans-serif' }}>
                <form onSubmit={handleLogin} style={{ background: T.bgCard, padding: '40px', borderRadius: '8px', border: `1px solid ${T.border}`, width: '100%', maxWidth: '400px' }}>
                    <h2 style={{ color: T.gold, margin: '0 0 24px', textAlign: 'center', letterSpacing: '2px' }}>ADMIN LOGIN</h2>
                    {error && <div style={{ color: '#e57373', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', color: T.textDim, marginBottom: '8px', fontSize: '12px' }}>EMAIL</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                            style={{ width: '100%', padding: '12px', background: T.bg, border: `1px solid ${T.border}`, color: 'white', borderRadius: '4px', outline: 'none' }} />
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', color: T.textDim, marginBottom: '8px', fontSize: '12px' }}>PASSWORD</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                            style={{ width: '100%', padding: '12px', background: T.bg, border: `1px solid ${T.border}`, color: 'white', borderRadius: '4px', outline: 'none' }} />
                    </div>
                    <button type="submit" disabled={loading}
                        style={{ width: '100%', padding: '14px', background: T.gold, border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
                        {loading ? 'LOGGING IN...' : 'LOGIN'}
                    </button>
                    <a href="/" style={{ display: 'block', textAlign: 'center', marginTop: '20px', color: T.textDim, textDecoration: 'none', fontSize: '12px' }}>← Back to Store</a>
                </form>
            </div>
        );
    }

    // ─── DASHBOARD VIEW ─────────────────────────────────────────────────
    return (
        <div style={{ minHeight: '100vh', background: T.bg, color: T.text, padding: '40px 20px', fontFamily: 'sans-serif' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: `1px solid ${T.border}`, paddingBottom: '20px' }}>
                    <h1 style={{ color: T.gold, margin: 0, letterSpacing: '2px' }}>VELUNO ADMIN</h1>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <a href="/" target="_blank" style={{ color: T.textDim, textDecoration: 'none' }}>View Store ↗</a>
                        <button onClick={handleLogout} style={{ background: 'transparent', border: `1px solid ${T.border}`, color: T.textDim, padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
                    </div>
                </div>

                {/* Quick Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                    {/* Create Product Card */}
                    <div style={{ background: T.bgCard, padding: '24px', borderRadius: '8px', border: `1px solid ${T.border}` }}>
                        <h3 style={{ margin: '0 0 16px', color: 'white' }}>Manage Products</h3>
                        <p style={{ color: T.textDim, fontSize: '14px', marginBottom: '20px' }}>Manually add products and map to Qikink IDs.</p>
                        <button onClick={() => setShowAddProduct(!showAddProduct)} style={{ background: T.border, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                            {showAddProduct ? 'Cancel' : '+ Add New Product'}
                        </button>
                    </div>

                    {/* Qikink Sync Card */}
                    <div style={{ background: T.bgCard, padding: '24px', borderRadius: '8px', border: `1px solid ${T.border}` }}>
                        <h3 style={{ margin: '0 0 16px', color: 'white' }}>Product Sync</h3>
                        <p style={{ color: T.textDim, fontSize: '14px', marginBottom: '20px' }}>Import/Update products from Qikink API.</p>
                        <button onClick={handleSync} style={{ background: T.gold, border: 'none', padding: '10px 20px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Sync Qikink Products
                        </button>
                        {syncStatus && <p style={{ marginTop: '14px', color: syncStatus.includes('failed') ? '#e57373' : '#66bb6a', fontSize: '13px' }}>{syncStatus}</p>}
                    </div>

                    {/* Stats Card */}
                    <div style={{ background: T.bgCard, padding: '24px', borderRadius: '8px', border: `1px solid ${T.border}` }}>
                        <h3 style={{ margin: '0 0 16px', color: 'white' }}>Quick Stats</h3>
                        {stats ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <p style={{ color: T.textDim, fontSize: '12px', margin: 0 }}>Total Products</p>
                                    <p style={{ fontSize: '24px', margin: '4px 0 0', fontWeight: 'bold' }}>{stats.totalProducts}</p>
                                </div>
                                <div>
                                    <p style={{ color: T.textDim, fontSize: '12px', margin: 0 }}>Orders</p>
                                    <p style={{ fontSize: '24px', margin: '4px 0 0', fontWeight: 'bold' }}>{orders.length}</p>
                                </div>
                            </div>
                        ) : <p style={{ color: T.textDim }}>Loading stats...</p>}
                    </div>
                </div>

                {/* Add Product Form */}
                {showAddProduct && (
                    <div style={{ background: T.bgCard, padding: '30px', borderRadius: '8px', border: `1px solid ${T.border}`, marginBottom: '40px' }}>
                        <h3 style={{ color: T.gold, marginTop: 0, marginBottom: '20px' }}>Add New Product</h3>
                        <form onSubmit={handleCreateProduct} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {/* Left Col */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', color: T.textDim, marginBottom: '5px', fontSize: '12px' }}>PRODUCT NAME</label>
                                    <input required placeholder="e.g. Classic Black Hoodie" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: T.textDim, marginBottom: '5px', fontSize: '12px' }}>DESCRIPTION</label>
                                    <textarea required rows="4" placeholder="Product details..." value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} style={inputStyle} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label style={{ display: 'block', color: T.textDim, marginBottom: '5px', fontSize: '12px' }}>PRICE (₹)</label>
                                        <input type="number" required placeholder="999" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: T.textDim, marginBottom: '5px', fontSize: '12px' }}>CATEGORY</label>
                                        <select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} style={inputStyle}>
                                            <option>Men</option><option>Women</option><option>Kids</option><option>Accessories</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Right Col */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', color: T.gold, marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>QIKINK PRODUCT ID (Result from Qikink Dashboard)</label>
                                    <input placeholder="e.g. 5678 (Critical for Sync)" value={newProduct.qikinkProductId} onChange={e => setNewProduct({ ...newProduct, qikinkProductId: e.target.value })} style={{ ...inputStyle, borderColor: T.gold }} />
                                    <p style={{ fontSize: '11px', color: T.textDim, marginTop: '4px' }}>Paste the ID from your Qikink dashboard here so orders sync automatically.</p>
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: T.textDim, marginBottom: '5px', fontSize: '12px' }}>PRODUCT IMAGE</label>
                                    <input type="file" onChange={handleFileChange} style={{ ...inputStyle, padding: '8px' }} accept="image/*" />
                                    {uploading && <p style={{ color: T.gold, fontSize: '12px', margin: '5px 0' }}>Uploading...</p>}
                                    <input
                                        required
                                        placeholder="Image Preview (Auto-filled)"
                                        value={newProduct.image}
                                        onChange={e => setNewProduct({ ...newProduct, image: e.target.value })}
                                        style={{ ...inputStyle, marginTop: '8px', opacity: 0.7 }}
                                        readOnly // Prefer file selection to avoid pasting huge strings
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: T.textDim, marginBottom: '5px', fontSize: '12px' }}>SIZES (Comma separated)</label>
                                    <input placeholder="S, M, L, XL" value={newProduct.sizes} onChange={e => setNewProduct({ ...newProduct, sizes: e.target.value })} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: T.textDim, marginBottom: '5px', fontSize: '12px' }}>COLORS (Comma separated)</label>
                                    <input placeholder="Black, White, Red" value={newProduct.colors} onChange={e => setNewProduct({ ...newProduct, colors: e.target.value })} style={inputStyle} />
                                </div>
                                <button type="submit" disabled={loading} style={{ marginTop: 'auto', background: T.gold, border: 'none', padding: '12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                                    {loading ? 'SAVING...' : 'SAVE PRODUCT'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Orders Table */}
                <h3 style={{ color: T.gold, marginBottom: '20px', letterSpacing: '1px' }}>RECENT ORDERS</h3>
                <div style={{ background: T.bgCard, borderRadius: '8px', border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ background: '#0a0a0a', borderBottom: `1px solid ${T.border}` }}>
                                <th style={{ textAlign: 'left', padding: '16px', color: T.textDim }}>Order ID</th>
                                <th style={{ textAlign: 'left', padding: '16px', color: T.textDim }}>Customer</th>
                                <th style={{ textAlign: 'right', padding: '16px', color: T.textDim }}>Amount</th>
                                <th style={{ textAlign: 'center', padding: '16px', color: T.textDim }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr><td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: T.textDim }}>No orders found</td></tr>
                            ) : (
                                orders.map(order => (
                                    <tr key={order._id} style={{ borderBottom: `1px solid ${T.border}` }}>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ color: 'white' }}>{order.orderNumber}</div>
                                            <div style={{ fontSize: '11px', color: T.textDim }}>{new Date(order.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td style={{ padding: '16px', color: T.textDim }}>{order.customerName}</td>
                                        <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold' }}>₹{order.items?.reduce((a, b) => a + (b.total || 0), 0) || 0}</td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                                                background: order.orderStatus === 'delivered' ? '#e8f5e9' : '#fff3e0',
                                                color: order.orderStatus === 'delivered' ? '#2e7d32' : '#ef6c00'
                                            }}>
                                                {order.orderStatus?.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
