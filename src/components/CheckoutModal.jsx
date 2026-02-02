import { useState } from 'react';
import { initiateRazorpayPayment } from '../services/api';

// Theme tokens (matching veluno.jsx)
const T = {
    bg: "#0d0d0d", bgCard: "#141414", bgHover: "#1a1a1a",
    border: "#1e1e1e", borderHi: "#c8a96e33",
    gold: "#c8a96e", goldDim: "#c8a96e88",
    text: "#ffffff", textMid: "#aaaaaa", textDim: "#666666",
};

export default function CheckoutModal({ cart, total, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India'
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    const shippingCost = total >= 999 ? 0 : 50;
    const finalTotal = total + shippingCost;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Invalid email';
        if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
        else if (!/^[0-9]{10}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) newErrors.phone = 'Invalid phone number';
        if (!formData.street.trim()) newErrors.street = 'Street address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.state.trim()) newErrors.state = 'State is required';
        if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) return;

        setProcessing(true);

        const orderData = {
            customerName: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: {
                street: formData.street,
                city: formData.city,
                state: formData.state,
                postalCode: formData.postalCode,
                country: formData.country
            },
            products: cart.map(item => ({
                productId: item.id,
                size: item.size,
                color: item.color || '',
                quantity: item.qty
            })),
            totalAmount: finalTotal,
            shippingCost,
            paymentMethod: 'card'
        };

        await initiateRazorpayPayment(
            orderData,
            (order) => {
                // Payment successful
                setProcessing(false);
                onSuccess(order);
            },
            (error) => {
                // Payment failed
                console.error('Payment failed:', error);
                alert('Payment failed: ' + error.message);
                setProcessing(false);
            }
        );
    };

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", animation: "fadeIn .2s ease" }} onClick={onClose}>
            <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "8px", maxWidth: "540px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "32px 28px" }} onClick={e => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <h3 style={{ color: T.text, fontSize: "20px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "3px", margin: 0 }}>CHECKOUT</h3>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: "20px" }}>✕</button>
                </div>
                <p style={{ color: T.textDim, fontSize: "12px", margin: "0 0 22px" }}>Complete your order details</p>

                <form onSubmit={handleSubmit}>
                    {/* Customer Info */}
                    <div style={{ marginBottom: "18px" }}>
                        <label style={{ color: T.textMid, fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif", display: "block", marginBottom: "6px" }}>Full Name *</label>
                        <input name="name" value={formData.name} onChange={handleChange} placeholder="John Doe"
                            style={{ width: "100%", background: T.bg, border: `1px solid ${errors.name ? '#e57373' : T.border}`, borderRadius: "4px", padding: "11px 14px", color: T.text, fontSize: "13px", outline: "none", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "1px" }} />
                        {errors.name && <p style={{ color: "#e57373", fontSize: "11px", marginTop: "4px" }}>{errors.name}</p>}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" }}>
                        <div>
                            <label style={{ color: T.textMid, fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif", display: "block", marginBottom: "6px" }}>Email *</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com"
                                style={{ width: "100%", background: T.bg, border: `1px solid ${errors.email ? '#e57373' : T.border}`, borderRadius: "4px", padding: "11px 14px", color: T.text, fontSize: "13px", outline: "none" }} />
                            {errors.email && <p style={{ color: "#e57373", fontSize: "11px", marginTop: "4px" }}>{errors.email}</p>}
                        </div>
                        <div>
                            <label style={{ color: T.textMid, fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif", display: "block", marginBottom: "6px" }}>Phone *</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="9876543210"
                                style={{ width: "100%", background: T.bg, border: `1px solid ${errors.phone ? '#e57373' : T.border}`, borderRadius: "4px", padding: "11px 14px", color: T.text, fontSize: "13px", outline: "none" }} />
                            {errors.phone && <p style={{ color: "#e57373", fontSize: "11px", marginTop: "4px" }}>{errors.phone}</p>}
                        </div>
                    </div>

                    {/* Address */}
                    <div style={{ marginBottom: "18px" }}>
                        <label style={{ color: T.textMid, fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif", display: "block", marginBottom: "6px" }}>Street Address *</label>
                        <input name="street" value={formData.street} onChange={handleChange} placeholder="123 Main Street"
                            style={{ width: "100%", background: T.bg, border: `1px solid ${errors.street ? '#e57373' : T.border}`, borderRadius: "4px", padding: "11px 14px", color: T.text, fontSize: "13px", outline: "none" }} />
                        {errors.street && <p style={{ color: "#e57373", fontSize: "11px", marginTop: "4px" }}>{errors.street}</p>}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" }}>
                        <div>
                            <label style={{ color: T.textMid, fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif", display: "block", marginBottom: "6px" }}>City *</label>
                            <input name="city" value={formData.city} onChange={handleChange} placeholder="Mumbai"
                                style={{ width: "100%", background: T.bg, border: `1px solid ${errors.city ? '#e57373' : T.border}`, borderRadius: "4px", padding: "11px 14px", color: T.text, fontSize: "13px", outline: "none" }} />
                            {errors.city && <p style={{ color: "#e57373", fontSize: "11px", marginTop: "4px" }}>{errors.city}</p>}
                        </div>
                        <div>
                            <label style={{ color: T.textMid, fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif", display: "block", marginBottom: "6px" }}>State *</label>
                            <input name="state" value={formData.state} onChange={handleChange} placeholder="Maharashtra"
                                style={{ width: "100%", background: T.bg, border: `1px solid ${errors.state ? '#e57373' : T.border}`, borderRadius: "4px", padding: "11px 14px", color: T.text, fontSize: "13px", outline: "none" }} />
                            {errors.state && <p style={{ color: "#e57373", fontSize: "11px", marginTop: "4px" }}>{errors.state}</p>}
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "22px" }}>
                        <div>
                            <label style={{ color: T.textMid, fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif", display: "block", marginBottom: "6px" }}>Postal Code *</label>
                            <input name="postalCode" value={formData.postalCode} onChange={handleChange} placeholder="400001"
                                style={{ width: "100%", background: T.bg, border: `1px solid ${errors.postalCode ? '#e57373' : T.border}`, borderRadius: "4px", padding: "11px 14px", color: T.text, fontSize: "13px", outline: "none" }} />
                            {errors.postalCode && <p style={{ color: "#e57373", fontSize: "11px", marginTop: "4px" }}>{errors.postalCode}</p>}
                        </div>
                        <div>
                            <label style={{ color: T.textMid, fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif", display: "block", marginBottom: "6px" }}>Country</label>
                            <input name="country" value={formData.country} onChange={handleChange}
                                style={{ width: "100%", background: T.bg, border: `1px solid ${T.border}`, borderRadius: "4px", padding: "11px 14px", color: T.text, fontSize: "13px", outline: "none" }} />
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: "18px", marginBottom: "18px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                            <span style={{ color: T.textDim, fontSize: "12px" }}>Subtotal</span>
                            <span style={{ color: T.text, fontSize: "13px", fontFamily: "'Bebas Neue',sans-serif" }}>₹{total.toLocaleString()}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                            <span style={{ color: T.textDim, fontSize: "12px" }}>Shipping</span>
                            <span style={{ color: shippingCost === 0 ? "#4caf50" : T.text, fontSize: "13px", fontFamily: "'Bebas Neue',sans-serif" }}>{shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "12px", borderTop: `1px solid ${T.border}` }}>
                            <span style={{ color: T.text, fontSize: "14px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "2px" }}>TOTAL</span>
                            <span style={{ color: T.gold, fontSize: "18px", fontFamily: "'Bebas Neue',sans-serif" }}>₹{finalTotal.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Submit */}
                    <button type="submit" disabled={processing}
                        style={{ width: "100%", background: processing ? "#888" : T.gold, border: "none", color: "#111", padding: "14px", fontSize: "12px", letterSpacing: "4px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif", cursor: processing ? "not-allowed" : "pointer", fontWeight: 700, borderRadius: "4px" }}>
                        {processing ? 'Processing...' : 'Pay with Razorpay'}
                    </button>

                    <div style={{ marginTop: "12px", display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
                        {["🔒 Secure", "💳 Cards", "📱 UPI", "💰 COD"].map(t => (
                            <span key={t} style={{ color: T.textLow, fontSize: "9px", letterSpacing: "0.5px" }}>{t}</span>
                        ))}
                    </div>
                </form>
            </div>
        </div>
    );
}
