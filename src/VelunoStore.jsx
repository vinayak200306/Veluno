import { useState, useEffect, useRef, useCallback } from "react";
import { productAPI, transformProduct } from './services/api';
import CheckoutModal from './components/CheckoutModal';


// ─── THEME TOKENS ───────────────────────────────────────────────────
const T = {
  bg: "#0d0d0d", bgCard: "#141414", bgHover: "#1a1a1a",
  border: "#1e1e1e", borderHi: "#c8a96e33",
  gold: "#c8a96e", goldDim: "#c8a96e88",
  text: "#ffffff", textMid: "#aaaaaa", textDim: "#666666", textLow: "#444444", textTiny: "#333333",
};

// ─── DATA ───────────────────────────────────────────────────────────
// Products will be fetched from backend API
// Keeping CATEGORIES and other static data
const CATEGORIES = [
  { name: "Oversized T-Shirts", label: "OVERSIZED", count: 3 },
  { name: "Hoodies", label: "HOODIES", count: 2 },
  { name: "Sweatshirts", label: "SWEATSHIRTS", count: 1 },
  { name: "T-Shirts", label: "TEES", count: 7 },
];
const SIZE_GUIDE = [
  { size: "S", chest: "96–101", length: "68–70", shoulder: "44–46" },
  { size: "M", chest: "102–107", length: "71–73", shoulder: "46–48" },
  { size: "L", chest: "108–113", length: "74–76", shoulder: "48–50" },
  { size: "XL", chest: "114–119", length: "77–79", shoulder: "50–52" },
  { size: "XXL", chest: "120–127", length: "80–83", shoulder: "52–55" },
];
const MOCK_ORDERS = {
  "VLN-20260115-A1B2C3": { status: "shipped", trackingNumber: "1234567890", items: [{ name: "Bad Decision", size: "M", qty: 1, price: 699 }], total: 699, statusLog: [{ status: "created", date: "Jan 15" }, { status: "paid", date: "Jan 15" }, { status: "processing", date: "Jan 16" }, { status: "shipped", date: "Jan 17" }] },
  "VLN-20260120-D4E5F6": { status: "delivered", trackingNumber: "9876543210", items: [{ name: "Brave", size: "L", qty: 2, price: 499 }], total: 998, statusLog: [{ status: "created", date: "Jan 20" }, { status: "paid", date: "Jan 20" }, { status: "processing", date: "Jan 21" }, { status: "shipped", date: "Jan 22" }, { status: "delivered", date: "Jan 25" }] },
  "VLN-20260128-G7H8I9": { status: "processing", trackingNumber: null, items: [{ name: "Frequency", size: "XL", qty: 1, price: 599 }], total: 599, statusLog: [{ status: "created", date: "Jan 28" }, { status: "paid", date: "Jan 28" }, { status: "processing", date: "Jan 29" }] },
};


// ─── HELPERS ────────────────────────────────────────────────────────
const effectivePrice = (p) => p.salePrice !== null ? p.salePrice : p.price;
const discountPct = (p) => p.salePrice !== null ? Math.round((1 - p.salePrice / p.price) * 100) : 0;

// ─── HOOK: IntersectionObserver scroll-reveal ───────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

// ═══════════════════════════════════════════════════════════════════
// SCROLL PROGRESS BAR  (new)
// ═══════════════════════════════════════════════════════════════════
function ScrollProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const fn = () => {
      const el = document.documentElement;
      setPct((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return <div style={{ position: "fixed", top: 0, left: 0, height: "2px", width: `${pct}%`, background: T.gold, zIndex: 999, transition: "width .12s linear", pointerEvents: "none" }} />;
}

// ═══════════════════════════════════════════════════════════════════
// SCROLL-TO-TOP BUTTON  (new)
// ═══════════════════════════════════════════════════════════════════
function ScrollToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const fn = () => setShow(window.scrollY > 700);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  if (!show) return null;
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      style={{ position: "fixed", bottom: "30px", right: "30px", zIndex: 150, width: "44px", height: "44px", borderRadius: "50%", background: T.bgCard, border: `1px solid ${T.border}`, color: T.gold, fontSize: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(0,0,0,.45)", transition: "transform .2s, border-color .2s", animation: "fadeIn .3s ease" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.transform = "scale(1.1)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "scale(1)"; }}
    >↑</button>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TOAST SYSTEM  (new — replaces silent quick-add)
// ═══════════════════════════════════════════════════════════════════
function ToastContainer({ toasts, removeToast }) {
  return (
    <div style={{ position: "fixed", top: "22px", right: "22px", zIndex: 500, display: "flex", flexDirection: "column", gap: "10px", pointerEvents: "none", maxWidth: "320px", width: "100%" }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: T.bgCard, border: `1px solid ${T.gold}`, borderRadius: "6px", padding: "14px 18px", pointerEvents: "auto", animation: "toastSlide .3s cubic-bezier(.22,1,.36,1) forwards", display: "flex", alignItems: "flex-start", gap: "12px", boxShadow: "0 8px 32px rgba(0,0,0,.55)" }}>
          <span style={{ fontSize: "18px", flexShrink: 0 }}>{t.icon || "✓"}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: T.text, fontSize: "13px", margin: "0 0 1px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "1px" }}>{t.title}</p>
            {t.sub && <p style={{ color: T.textDim, fontSize: "11px", margin: 0 }}>{t.sub}</p>}
          </div>
          <button onClick={() => removeToast(t.id)} style={{ background: "none", border: "none", color: T.textLow, cursor: "pointer", fontSize: "16px", padding: 0, lineHeight: 1, flexShrink: 0 }}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MARQUEE  (fix: loop seamless with 12 clones + -50% translate)
// ═══════════════════════════════════════════════════════════════════
function Marquee({ text, speed = 28 }) {
  const items = Array(12).fill(text);
  return (
    <div style={{ overflow: "hidden", whiteSpace: "nowrap", background: "#111", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: "11px 0" }}>
      <div style={{ display: "inline-flex", animation: `marquee ${speed}s linear infinite` }}>
        {items.map((t, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "18px", paddingRight: "40px" }}>
            <span style={{ color: T.gold, fontSize: "8px" }}>✦</span>
            <span style={{ color: T.text, fontSize: "11px", letterSpacing: "5px", fontWeight: 500, textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif" }}>{t}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// NAVBAR  (fix: hamburger uses className, proper mobile toggle)
// ═══════════════════════════════════════════════════════════════════
function Navbar({ cartCount, onCartOpen, onSearchOpen }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    { label: "Shop All", target: "products" },
    { label: "Oversized T-Shirts", target: "products" },
    { label: "Hoodies", target: "products" },
    { label: "Sweatshirts", target: "products" },
    { label: "T-Shirts", target: "products" },
    { label: "Contact", target: "contact" },
  ];
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(13,13,13,0.92)", backdropFilter: "blur(14px)", borderBottom: `1px solid ${T.border}`, padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "62px" }}>
        <span style={{ color: T.text, fontSize: "22px", letterSpacing: "7px", fontWeight: 700, fontFamily: "'Bebas Neue',sans-serif", cursor: "pointer" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>VELUNO</span>

        {/* Desktop nav — hidden on mobile via .nav-links CSS */}
        <div className="nav-links" style={{ display: "flex", gap: "26px" }}>
          {links.map(l => (
            <a key={l.label} href="#" onClick={e => { e.preventDefault(); scrollTo(l.target); }}
              style={{ color: T.textMid, textDecoration: "none", fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif", transition: "color .25s" }}
              onMouseEnter={e => e.currentTarget.style.color = T.gold} onMouseLeave={e => e.currentTarget.style.color = T.textMid}
            >{l.label}</a>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          {/* Search */}
          <button onClick={onSearchOpen} style={{ background: "none", border: "none", color: T.textMid, cursor: "pointer", padding: "2px", transition: "color .25s" }}
            onMouseEnter={e => e.currentTarget.style.color = T.gold} onMouseLeave={e => e.currentTarget.style.color = T.textMid}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </button>
          {/* Cart */}
          <button onClick={onCartOpen} style={{ background: "none", border: "none", color: T.text, cursor: "pointer", position: "relative", padding: "2px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
            {cartCount > 0 && <span style={{ position: "absolute", top: "-7px", right: "-8px", background: T.gold, color: "#111", borderRadius: "50%", width: "17px", height: "17px", fontSize: "9px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{cartCount}</span>}
          </button>
          {/* Hamburger — shown on mobile via .hamburger-btn CSS */}
          <button className="hamburger-btn" onClick={() => setMenuOpen(true)} style={{ background: "none", border: "none", color: T.text, cursor: "pointer", display: "none", flexDirection: "column", gap: "5px", padding: "4px" }}>
            <span style={{ width: "22px", height: "1.5px", background: T.text }} />
            <span style={{ width: "22px", height: "1.5px", background: T.text }} />
            <span style={{ width: "16px", height: "1.5px", background: T.text }} />
          </button>
        </div>
      </nav>

      {/* Mobile fullscreen menu */}
      {menuOpen && (
        <div style={{ position: "fixed", inset: 0, background: "#0d0d0d", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "28px", animation: "fadeIn .22s ease" }}>
          <button onClick={() => setMenuOpen(false)} style={{ position: "absolute", top: "22px", right: "26px", background: "none", border: "none", color: T.text, fontSize: "26px", cursor: "pointer" }}>✕</button>
          {links.map((l, i) => (
            <a key={l.label} href="#" onClick={e => { e.preventDefault(); setMenuOpen(false); scrollTo(l.target); }}
              style={{ color: T.text, textDecoration: "none", fontSize: "26px", letterSpacing: "5px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif", opacity: 0, animation: `slideUp .3s ease ${i * 0.07}s forwards` }}
            >{l.label}</a>
          ))}
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SEARCH OVERLAY  (new)
// ═══════════════════════════════════════════════════════════════════
function SearchOverlay({ onClose, onViewProduct, products = [] }) {
  const [q, setQ] = useState("");
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const results = q.length > 1
    ? products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.category.toLowerCase().includes(q.toLowerCase()))
    : [];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,.84)", backdropFilter: "blur(8px)", display: "flex", flexDirection: "column", alignItems: "center", padding: "76px 20px 40px", animation: "fadeIn .2s ease" }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: "540px" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "6px", padding: "14px 18px", gap: "12px" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.textDim} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Search products…"
            style={{ flex: 1, background: "transparent", border: "none", color: T.text, fontSize: "16px", outline: "none", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "1px" }} />
          {q && <button onClick={() => setQ("")} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: "18px" }}>✕</button>}
        </div>
        {q.length > 1 && (
          <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {results.length === 0
              ? <p style={{ color: T.textDim, fontSize: "13px", textAlign: "center", padding: "36px 0", fontFamily: "Georgia,serif", fontStyle: "italic" }}>No products match "{q}"</p>
              : results.map(p => (
                <div key={p.id} onClick={() => { onViewProduct(p); onClose(); }}
                  style={{ display: "flex", gap: "14px", alignItems: "center", background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "5px", padding: "12px 16px", cursor: "pointer", transition: "border-color .2s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = T.gold} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
                >
                  <img src={p.img} alt={p.name} style={{ width: "52px", height: "52px", objectFit: "cover", borderRadius: "3px", background: T.bgHover }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ color: T.text, fontSize: "14px", margin: "0 0 2px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "1px", textTransform: "uppercase" }}>{p.name}</p>
                    <p style={{ color: T.textDim, fontSize: "11px", margin: 0 }}>{p.category} · ₹{effectivePrice(p).toLocaleString()}</p>
                  </div>
                  <span style={{ color: T.gold, fontSize: "18px" }}>→</span>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SIZE GUIDE MODAL  (new)
// ═══════════════════════════════════════════════════════════════════
function SizeGuideModal({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 310, background: "rgba(0,0,0,.82)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", animation: "fadeIn .2s ease" }} onClick={onClose}>
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "8px", maxWidth: "500px", width: "100%", maxHeight: "85vh", overflowY: "auto", padding: "34px 30px" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
          <h3 style={{ color: T.text, fontSize: "20px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "3px", margin: 0 }}>SIZE GUIDE</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: "20px" }}>✕</button>
        </div>
        <p style={{ color: T.textDim, fontSize: "12px", marginBottom: "18px", lineHeight: 1.6 }}>All measurements in <strong style={{ color: T.textMid }}>centimeters (cm)</strong>.</p>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {["Size", "Chest", "Length", "Shoulder"].map(h => (
                <th key={h} style={{ color: T.gold, fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif", textAlign: "left", padding: "10px 8px", fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SIZE_GUIDE.map((row, i) => (
              <tr key={row.size} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,.02)" }}>
                <td style={{ color: T.gold, fontSize: "14px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "2px", padding: "11px 8px" }}>{row.size}</td>
                <td style={{ color: T.textMid, fontSize: "13px", padding: "11px 8px" }}>{row.chest}</td>
                <td style={{ color: T.textMid, fontSize: "13px", padding: "11px 8px" }}>{row.length}</td>
                <td style={{ color: T.textMid, fontSize: "13px", padding: "11px 8px" }}>{row.shoulder}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: "24px", padding: "16px", background: "rgba(200,169,110,.06)", border: `1px solid ${T.borderHi}`, borderRadius: "5px" }}>
          <p style={{ color: T.gold, fontSize: "10px", letterSpacing: "1px", margin: "0 0 5px", fontFamily: "'Bebas Neue',sans-serif" }}>💡 PRO TIP</p>
          <p style={{ color: T.textDim, fontSize: "12px", margin: 0, lineHeight: 1.6 }}>Oversized tees are designed to hang loose. If you're between sizes, size up for the relaxed streetwear fit.</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ORDER TRACKER  (new)
// ═══════════════════════════════════════════════════════════════════
function OrderTracker({ onClose }) {
  const [input, setInput] = useState("");
  const [order, setOrder] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const lookup = () => {
    const o = MOCK_ORDERS[input.trim().toUpperCase()];
    if (o) { setOrder(o); setNotFound(false); } else { setOrder(null); setNotFound(true); }
  };
  const statusColor = (s) => s === "delivered" ? "#4caf50" : s === "shipped" ? T.gold : T.textDim;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,.82)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", animation: "fadeIn .2s ease" }} onClick={onClose}>
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "8px", maxWidth: "460px", width: "100%", maxHeight: "85vh", overflowY: "auto", padding: "34px 28px" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <h3 style={{ color: T.text, fontSize: "20px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "3px", margin: 0 }}>TRACK ORDER</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: "20px" }}>✕</button>
        </div>
        <p style={{ color: T.textDim, fontSize: "12px", margin: "0 0 18px" }}>Try: VLN-20260115-A1B2C3</p>
        <div style={{ display: "flex", gap: "8px" }}>
          <input value={input} onChange={e => { setInput(e.target.value); setNotFound(false); setOrder(null); }} onKeyDown={e => e.key === "Enter" && lookup()} placeholder="Order number"
            style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: "5px", padding: "12px 14px", color: T.text, fontSize: "13px", outline: "none", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "1px" }} />
          <button onClick={lookup} style={{ background: T.gold, border: "none", color: "#111", padding: "12px 22px", borderRadius: "5px", fontSize: "11px", letterSpacing: "2px", fontFamily: "'Bebas Neue',sans-serif", cursor: "pointer", fontWeight: 700 }}>TRACK</button>
        </div>
        {notFound && <p style={{ color: "#e57373", fontSize: "12px", marginTop: "10px" }}>Order not found. Check the number and try again.</p>}
        {order && (
          <div style={{ marginTop: "26px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", paddingBottom: "14px", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ color: T.text, fontSize: "13px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "1px" }}>{input.trim().toUpperCase()}</span>
              <span style={{ color: statusColor(order.status), fontSize: "10px", letterSpacing: "2px", fontFamily: "'Bebas Neue',sans-serif", textTransform: "uppercase", background: `${statusColor(order.status)}18`, padding: "4px 10px", borderRadius: "3px" }}>{order.status}</span>
            </div>
            {/* Timeline */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {order.statusLog.map((s, i) => (
                <div key={i} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: i === order.statusLog.length - 1 ? T.gold : T.border, border: `2px solid ${i === order.statusLog.length - 1 ? T.gold : T.border}`, boxSizing: "border-box", marginTop: "2px", flexShrink: 0 }} />
                    {i < order.statusLog.length - 1 && <div style={{ width: "2px", height: "34px", background: T.border }} />}
                  </div>
                  <div>
                    <p style={{ color: i === order.statusLog.length - 1 ? T.text : T.textDim, fontSize: "13px", margin: "0 0 1px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "1px", textTransform: "uppercase" }}>{s.status}</p>
                    <p style={{ color: T.textLow, fontSize: "11px", margin: 0 }}>{s.date}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Items summary */}
            <div style={{ marginTop: "22px", paddingTop: "18px", borderTop: `1px solid ${T.border}` }}>
              <p style={{ color: T.textDim, fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif", margin: "0 0 8px" }}>Items</p>
              {order.items.map((it, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
                  <span style={{ color: T.textMid, fontSize: "13px" }}>{it.name} – {it.size} × {it.qty}</span>
                  <span style={{ color: T.gold, fontSize: "13px", fontFamily: "'Bebas Neue',sans-serif" }}>₹{(it.price * it.qty).toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${T.border}` }}>
                <span style={{ color: T.text, fontSize: "13px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "1px" }}>TOTAL</span>
                <span style={{ color: T.gold, fontSize: "16px", fontFamily: "'Bebas Neue',sans-serif" }}>₹{order.total.toLocaleString()}</span>
              </div>
            </div>
            {order.trackingNumber && (
              <div style={{ marginTop: "18px", padding: "14px", background: "rgba(200,169,110,.06)", border: `1px solid ${T.borderHi}`, borderRadius: "5px" }}>
                <p style={{ color: T.gold, fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif", margin: "0 0 4px" }}>Tracking Number</p>
                <p style={{ color: T.text, fontSize: "14px", margin: 0, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "2px" }}>{order.trackingNumber}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HERO  (upgraded: asymmetric layout + featured product image)
// ═══════════════════════════════════════════════════════════════════
function Hero({ onShopClick, onTrackClick, featuredProduct }) {
  return (
    <div className="hero-layout" style={{ position: "relative", minHeight: "520px", background: "linear-gradient(160deg,#0a0a0a 0%,#141414 40%,#0d0d0d 100%)", display: "flex", alignItems: "center", overflow: "hidden" }}>
      {/* Noise grain overlay */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")", backgroundRepeat: "repeat", backgroundSize: "200px", pointerEvents: "none", zIndex: 1 }} />
      {/* Glow 1 */}
      <div style={{ position: "absolute", top: "-100px", left: "-80px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle,rgba(200,169,110,0.07) 0%,transparent 65%)", pointerEvents: "none" }} />
      {/* Glow 2 */}
      <div style={{ position: "absolute", bottom: "-60px", right: "-60px", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle,rgba(200,169,110,0.05) 0%,transparent 65%)", pointerEvents: "none" }} />

      {/* Left content */}
      <div style={{ position: "relative", zIndex: 2, flex: 1, padding: "72px 48px 72px 64px", maxWidth: "560px" }}>
        <p style={{ color: T.gold, fontSize: "10px", letterSpacing: "5px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif", margin: "0 0 16px" }}>— Est. 2025 —</p>
        <h1 style={{ color: T.text, fontSize: "66px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "5px", textTransform: "uppercase", margin: 0, lineHeight: 1.06 }}>STYLE<br />MEETS<br /><span style={{ color: T.gold }}>BRAVERY</span></h1>
        <div style={{ width: "44px", height: "2px", background: T.gold, margin: "22px 0" }} />
        <p style={{ color: T.textDim, fontSize: "13px", margin: "0 0 32px", lineHeight: 1.7, maxWidth: "360px" }}>Premium streetwear designed in India. Bold prints, quality fabric — made for those who dare.</p>
        <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
          <button onClick={onShopClick}
            style={{ background: T.gold, border: "none", color: "#111", padding: "13px 36px", fontSize: "11px", letterSpacing: "4px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif", cursor: "pointer", fontWeight: 700, transition: "transform .2s, box-shadow .2s", boxShadow: "0 4px 18px rgba(200,169,110,.3)" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(200,169,110,.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(200,169,110,.3)"; }}
          >Shop All</button>
          <button onClick={onTrackClick}
            style={{ background: "transparent", border: `1px solid ${T.border}`, color: T.textMid, padding: "13px 26px", fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif", cursor: "pointer", transition: "border-color .25s, color .25s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.color = T.gold; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMid; }}
          >📦 Track Order</button>
        </div>
      </div>

      {/* Right: featured product card (hidden on mobile via .hero-img) */}
      {featuredProduct && (
        <div className="hero-img" style={{ position: "relative", zIndex: 2, flex: "0 0 400px", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 48px 40px 0" }}>
          <div style={{ position: "relative", width: "260px", height: "340px" }}>
            <div style={{ position: "absolute", inset: "14px", background: "rgba(200,169,110,.04)", border: `1px solid ${T.borderHi}`, borderRadius: "6px" }} />
            <img src={featuredProduct.img} alt={featuredProduct.name} style={{ position: "relative", zIndex: 1, width: "100%", height: "100%", objectFit: "cover", borderRadius: "5px", border: `1px solid ${T.border}` }} />
            <span style={{ position: "absolute", top: "14px", left: "14px", zIndex: 2, background: T.gold, color: "#111", fontSize: "9px", letterSpacing: "2px", padding: "4px 10px", fontWeight: 700, fontFamily: "'Bebas Neue',sans-serif" }}>NEW DROP</span>
            <div style={{ position: "absolute", bottom: "14px", right: "14px", zIndex: 2, background: "rgba(13,13,13,.88)", border: `1px solid ${T.border}`, borderRadius: "4px", padding: "7px 14px" }}>
              <span style={{ color: T.gold, fontSize: "18px", fontFamily: "'Bebas Neue',sans-serif" }}>₹{featuredProduct.price}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SKELETON  (new — shimmer placeholders while "loading")
// ═══════════════════════════════════════════════════════════════════
function ProductSkeleton() {
  return (
    <div style={{ background: T.bgCard, borderRadius: "4px", border: `1px solid ${T.border}`, overflow: "hidden" }}>
      <div style={{ height: "320px", background: "linear-gradient(90deg,#1a1a1a 25%,#222 50%,#1a1a1a 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }} />
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {[40, 70, 50, 30].map((w, i) => (
          <div key={i} style={{ height: i === 1 || i === 3 ? "12px" : "8px", width: `${w}%`, borderRadius: "4px", background: "linear-gradient(90deg,#1a1a1a 25%,#222 50%,#1a1a1a 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite", marginTop: i === 2 || i === 3 ? "2px" : 0 }} />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PRODUCT CARD  (upgraded: sale price, staggered scroll-reveal, badge row)
// ═══════════════════════════════════════════════════════════════════
function ProductCard({ product, onAdd, onView, delay = 0 }) {
  const [hovered, setHovered] = useState(false);
  const [ref, visible] = useReveal(0.1);
  const sale = discountPct(product);
  const price = effectivePrice(product);
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(26px)", transition: `opacity .5s ease ${delay}s, transform .5s ease ${delay}s` }}>
      <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{ background: T.bgCard, borderRadius: "4px", overflow: "hidden", border: `1px solid ${T.border}`, transition: "transform .3s, border-color .3s", transform: hovered ? "translateY(-4px)" : "translateY(0)", borderColor: hovered ? T.borderHi : T.border, cursor: "pointer" }}
        onClick={() => onView(product)}
      >
        <div style={{ position: "relative", height: "320px", overflow: "hidden", background: T.bgHover }}>
          <img src={product.img} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .5s", transform: hovered ? "scale(1.06)" : "scale(1)", opacity: .82 }} />
          {/* Badge row */}
          <div style={{ position: "absolute", top: "10px", left: "10px", display: "flex", gap: "5px" }}>
            {product.badge && <span style={{ background: product.badge === "SALE" ? "#e57373" : T.gold, color: "#111", fontSize: "9px", letterSpacing: "2px", padding: "3px 9px", fontWeight: 700, textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif" }}>{product.badge}</span>}
            {sale > 0 && <span style={{ background: "#e57373", color: "#fff", fontSize: "9px", letterSpacing: "1px", padding: "3px 7px", fontWeight: 700, fontFamily: "'Bebas Neue',sans-serif" }}>-{sale}%</span>}
          </div>
          {/* Quick add */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px", opacity: hovered ? 1 : 0, transition: "opacity .3s", background: "linear-gradient(transparent,rgba(0,0,0,.75))" }}>
            <button onClick={e => { e.stopPropagation(); onAdd(product, "M", 1); }}
              style={{ width: "100%", background: T.gold, border: "none", color: "#111", padding: "10px", fontSize: "10px", letterSpacing: "3px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif", cursor: "pointer", fontWeight: 700 }}
            >+ Quick Add</button>
          </div>
        </div>
        <div style={{ padding: "16px" }}>
          <p style={{ color: T.textDim, fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 5px", fontFamily: "'Bebas Neue',sans-serif" }}>{product.category}</p>
          <h3 style={{ color: T.text, fontSize: "15px", margin: "0 0 3px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "1px", textTransform: "uppercase" }}>{product.name}</h3>
          <p style={{ color: T.textDim, fontSize: "11px", margin: "0 0 10px", fontFamily: "Georgia,serif", fontStyle: "italic" }}>{product.type}</p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: T.gold, fontSize: "16px", fontWeight: 600, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "1px" }}>₹{price.toLocaleString()}</span>
            {sale > 0 && <span style={{ color: T.textLow, fontSize: "12px", textDecoration: "line-through" }}>₹{product.price.toLocaleString()}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PRODUCT MODAL  (upgraded: sale price, size guide link, entrance anim)
// ═══════════════════════════════════════════════════════════════════
function ProductModal({ product, onClose, onAdd }) {
  const [size, setSize] = useState("M");
  const [qty, setQty] = useState(1);
  const [sizeGuide, setSizeGuide] = useState(false);
  if (!product) return null;
  const sale = discountPct(product);
  const price = effectivePrice(product);
  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.82)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", animation: "fadeIn .25s ease" }} onClick={onClose}>
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "6px", maxWidth: "720px", width: "100%", display: "flex", maxHeight: "92vh", overflow: "auto", animation: "slideUp .3s cubic-bezier(.22,1,.36,1) forwards" }} onClick={e => e.stopPropagation()}>
          {/* Image pane */}
          <div style={{ flex: "0 0 46%", background: T.bgHover, position: "relative", minHeight: "420px" }}>
            <img src={product.img} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", minHeight: "420px" }} />
            <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", gap: "5px" }}>
              {product.badge && <span style={{ background: product.badge === "SALE" ? "#e57373" : T.gold, color: "#111", fontSize: "9px", letterSpacing: "2px", padding: "3px 9px", fontWeight: 700, fontFamily: "'Bebas Neue',sans-serif" }}>{product.badge}</span>}
              {sale > 0 && <span style={{ background: "#e57373", color: "#fff", fontSize: "9px", letterSpacing: "1px", padding: "3px 7px", fontWeight: 700, fontFamily: "'Bebas Neue',sans-serif" }}>-{sale}%</span>}
            </div>
          </div>
          {/* Details pane */}
          <div style={{ flex: 1, padding: "32px 28px", display: "flex", flexDirection: "column" }}>
            <button onClick={onClose} style={{ alignSelf: "flex-end", background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: "20px", marginBottom: "6px" }}>✕</button>
            <p style={{ color: T.textDim, fontSize: "9px", letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 6px", fontFamily: "'Bebas Neue',sans-serif" }}>{product.category}</p>
            <h2 style={{ color: T.text, fontSize: "26px", margin: "0 0 4px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "2px", textTransform: "uppercase" }}>{product.name}</h2>
            <p style={{ color: T.textDim, fontSize: "12px", margin: "0 0 14px", fontFamily: "Georgia,serif", fontStyle: "italic" }}>{product.type}</p>
            {/* Price row */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "22px" }}>
              <span style={{ color: T.gold, fontSize: "24px", fontWeight: 600, fontFamily: "'Bebas Neue',sans-serif" }}>₹{price.toLocaleString()}</span>
              {sale > 0 && <span style={{ color: T.textLow, fontSize: "15px", textDecoration: "line-through" }}>₹{product.price.toLocaleString()}</span>}
              {sale > 0 && <span style={{ background: "#e57373", color: "#fff", fontSize: "9px", padding: "2px 7px", borderRadius: "3px", fontFamily: "'Bebas Neue',sans-serif" }}>-{sale}%</span>}
            </div>
            {/* Size */}
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: "18px", marginBottom: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <p style={{ color: T.textMid, fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", margin: 0, fontFamily: "'Bebas Neue',sans-serif" }}>Size</p>
                <button onClick={() => setSizeGuide(true)} style={{ background: "none", border: "none", color: T.gold, fontSize: "10px", letterSpacing: "1px", cursor: "pointer", textDecoration: "underline", fontFamily: "'Bebas Neue',sans-serif", textTransform: "uppercase" }}>Size Guide</button>
              </div>
              <div style={{ display: "flex", gap: "7px", flexWrap: "wrap" }}>
                {product.sizes.map(s => (
                  <button key={s} onClick={() => setSize(s)}
                    style={{ background: size === s ? T.gold : "transparent", border: `1px solid ${size === s ? T.gold : T.border}`, color: size === s ? "#111" : T.textMid, width: "40px", height: "40px", fontSize: "11px", cursor: "pointer", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "1px", transition: "all .2s" }}
                  >{s}</button>
                ))}
              </div>
            </div>
            {/* Qty */}
            <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: "18px", marginBottom: "22px" }}>
              <p style={{ color: T.textMid, fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 10px", fontFamily: "'Bebas Neue',sans-serif" }}>Quantity</p>
              <div style={{ display: "flex" }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRight: "none", color: T.text, width: "38px", height: "38px", cursor: "pointer", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                <div style={{ border: `1px solid ${T.border}`, width: "44px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", color: T.text, fontSize: "15px", fontFamily: "'Bebas Neue',sans-serif" }}>{qty}</div>
                <button onClick={() => setQty(qty + 1)} style={{ background: "transparent", border: `1px solid ${T.border}`, borderLeft: "none", color: T.text, width: "38px", height: "38px", cursor: "pointer", fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
              </div>
            </div>
            {/* CTA */}
            <button onClick={() => { onAdd(product, size, qty); onClose(); }}
              style={{ marginTop: "auto", background: T.gold, border: "none", color: "#111", padding: "15px", fontSize: "12px", letterSpacing: "4px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif", cursor: "pointer", fontWeight: 700, boxShadow: "0 3px 14px rgba(200,169,110,.25)", transition: "box-shadow .2s" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 5px 22px rgba(200,169,110,.4)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "0 3px 14px rgba(200,169,110,.25)"}
            >Add to Cart — ₹{(price * qty).toLocaleString()}</button>
            <div style={{ marginTop: "14px", display: "flex", justifyContent: "center", gap: "18px", flexWrap: "wrap" }}>
              <span style={{ color: T.textLow, fontSize: "9px", letterSpacing: "1px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif" }}>🚚 Free shipping ₹999+</span>
              <span style={{ color: T.textLow, fontSize: "9px", letterSpacing: "1px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif" }}>↩ Easy returns</span>
            </div>
          </div>
        </div>
      </div>
      {sizeGuide && <SizeGuideModal onClose={() => setSizeGuide(false)} />}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CART DRAWER  (upgraded: slide-in anim, qty controls, free-shipping bar, payment icons, empty CTA)
// ═══════════════════════════════════════════════════════════════════
function CartDrawer({ cart, onClose, onRemove, onUpdateQty, onCheckout }) {
  const total = cart.reduce((s, i) => s + effectivePrice(i) * i.qty, 0);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.7)", display: "flex", justifyContent: "flex-end", animation: "fadeIn .2s ease" }} onClick={onClose}>
      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, width: "100%", maxWidth: "400px", height: "100%", display: "flex", flexDirection: "column", boxShadow: "-24px 0 60px rgba(0,0,0,.5)", animation: "slideLeft .3s cubic-bezier(.22,1,.36,1) forwards" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 24px", borderBottom: `1px solid ${T.border}` }}>
          <h3 style={{ color: T.text, margin: 0, fontSize: "17px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "3px" }}>YOUR CART <span style={{ color: T.gold, fontSize: "13px" }}>({cart.reduce((s, i) => s + i.qty, 0)})</span></h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: "20px" }}>✕</button>
        </div>
        {/* Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 24px" }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: "center", paddingTop: "68px" }}>
              <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke={T.textLow} strokeWidth="1.2" style={{ marginBottom: "14px" }}><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
              <p style={{ color: T.textLow, fontSize: "14px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "2px", margin: "0 0 18px" }}>Your cart is empty</p>
              <button onClick={onClose}
                style={{ background: "transparent", border: `1px solid ${T.gold}`, color: T.gold, padding: "9px 26px", fontSize: "10px", letterSpacing: "3px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif", cursor: "pointer", transition: "all .2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = T.gold; e.currentTarget.style.color = "#111"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.gold; }}
              >Browse Shop</button>
            </div>
          ) : cart.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: "12px", padding: "14px 0", borderBottom: `1px solid ${T.border}`, alignItems: "center" }}>
              <img src={item.img} alt={item.name} style={{ width: "58px", height: "58px", objectFit: "cover", borderRadius: "3px", background: T.bgHover, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: T.text, fontSize: "12px", margin: "0 0 1px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "1px", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</p>
                <p style={{ color: T.textDim, fontSize: "10px", margin: "0 0 4px" }}>Size: {item.size}</p>
                <p style={{ color: T.gold, fontSize: "13px", margin: 0, fontFamily: "'Bebas Neue',sans-serif" }}>₹{(effectivePrice(item) * item.qty).toLocaleString()}</p>
              </div>
              {/* Inline qty */}
              <div style={{ display: "flex", flexShrink: 0 }}>
                <button onClick={() => onUpdateQty(i, item.qty - 1)} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRight: "none", color: T.textMid, width: "26px", height: "26px", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                <div style={{ border: `1px solid ${T.border}`, width: "28px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", color: T.text, fontSize: "12px", fontFamily: "'Bebas Neue',sans-serif" }}>{item.qty}</div>
                <button onClick={() => onUpdateQty(i, item.qty + 1)} style={{ background: "transparent", border: `1px solid ${T.border}`, borderLeft: "none", color: T.textMid, width: "26px", height: "26px", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
              </div>
              <button onClick={() => onRemove(i)} style={{ background: "none", border: "none", color: T.textLow, cursor: "pointer", fontSize: "14px", flexShrink: 0, transition: "color .2s" }}
                onMouseEnter={e => e.currentTarget.style.color = "#e57373"} onMouseLeave={e => e.currentTarget.style.color = T.textLow}>🗑</button>
            </div>
          ))}
        </div>
        {/* Footer */}
        {cart.length > 0 && (
          <div style={{ borderTop: `1px solid ${T.border}`, padding: "18px 24px" }}>
            {/* Free shipping progress bar */}
            {total < 999 ? (
              <div style={{ marginBottom: "14px" }}>
                <p style={{ color: T.textDim, fontSize: "10px", letterSpacing: "1px", fontFamily: "'Bebas Neue',sans-serif", margin: "0 0 6px" }}>🚚 ADD ₹{999 - total} FOR FREE SHIPPING</p>
                <div style={{ background: T.border, height: "3px", borderRadius: "2px" }}>
                  <div style={{ background: T.gold, height: "100%", width: `${Math.min((total / 999) * 100, 100)}%`, borderRadius: "2px", transition: "width .3s" }} />
                </div>
              </div>
            ) : <p style={{ color: "#4caf50", fontSize: "11px", margin: "0 0 10px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "1px" }}>🎉 FREE SHIPPING UNLOCKED!</p>}

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <span style={{ color: T.textMid, fontSize: "12px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "2px" }}>TOTAL</span>
              <span style={{ color: T.text, fontSize: "20px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "1px" }}>₹{total.toLocaleString()}</span>
            </div>
            <button onClick={onCheckout} style={{ width: "100%", background: T.gold, border: "none", color: "#111", padding: "14px", fontSize: "12px", letterSpacing: "4px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif", cursor: "pointer", fontWeight: 700 }}>
              Proceed to Checkout
            </button>
            {/* Payment trust icons */}
            <div style={{ marginTop: "12px", display: "flex", justifyContent: "center", gap: "14px" }}>
              {["🔒 Secure", "💳 Cards", "📱 UPI", "💰 COD"].map(t => (
                <span key={t} style={{ color: T.textLow, fontSize: "9px", letterSpacing: "0.5px" }}>{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CATEGORIES  (upgraded: larger cards, corner glow, scroll-reveal)
// ═══════════════════════════════════════════════════════════════════
function Categories({ onFilter }) {
  const [ref, visible] = useReveal(0.15);
  const icons = { "Oversized T-Shirts": "👕", Hoodies: "🧥", Sweatshirts: "👔", "T-Shirts": "👕" };
  return (
    <section ref={ref} style={{ padding: "64px 24px", background: "#0e0e0e", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: "opacity .6s, transform .6s" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <h2 style={{ color: T.text, textAlign: "center", fontSize: "26px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "6px", textTransform: "uppercase", margin: "0 0 6px" }}>Shop by Category</h2>
        <div style={{ width: "36px", height: "2px", background: T.gold, margin: "0 auto 38px" }} />
        <div className="cat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" }}>
          {CATEGORIES.map((cat, i) => (
            <div key={cat.name} onClick={() => { onFilter(cat.name); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); }}
              style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "5px", padding: "38px 20px 34px", textAlign: "center", cursor: "pointer", transition: "all .3s", position: "relative", overflow: "hidden", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(18px)", animationDelay: `${i * 0.08}s` }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.transform = "translateY(-4px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div style={{ position: "absolute", top: "-28px", right: "-28px", width: "100px", height: "100px", borderRadius: "50%", background: "radial-gradient(circle,rgba(200,169,110,0.06) 0%,transparent 70%)", pointerEvents: "none" }} />
              <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: T.bgHover, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "20px" }}>{icons[cat.name]}</div>
              <p style={{ color: T.text, fontSize: "13px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "2px", textTransform: "uppercase", margin: "0 0 5px" }}>{cat.label}</p>
              <p style={{ color: T.textDim, fontSize: "11px", margin: "0 0 12px" }}>{cat.count} {cat.count === 1 ? "item" : "items"}</p>
              <span style={{ color: T.gold, fontSize: "10px", letterSpacing: "2px", fontFamily: "'Bebas Neue',sans-serif" }}>EXPLORE →</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LOOKBOOK BANNERS  (upgraded: real background images + overlay)
// ═══════════════════════════════════════════════════════════════════
function LookbookBanners() {
  const banners = [
    { title: "Unique Streetwear", sub: "Styled for the brave", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop" },
    { title: "Best Backprints", sub: "Hoodies · Sweatshirts · Tees · Caps", img: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&h=400&fit=crop" },
    { title: "Thank You", sub: "Your feedback helps us grow", img: "https://images.unsplash.com/photo-1576297045793-b894554cf604?w=600&h=400&fit=crop" },
  ];
  const [ref, visible] = useReveal(0.12);
  return (
    <section ref={ref} style={{ padding: "60px 24px", background: "#111", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: "opacity .6s, transform .6s" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px" }}>
        {banners.map((b, i) => (
          <div key={i} style={{ position: "relative", borderRadius: "5px", overflow: "hidden", minHeight: "240px", cursor: "pointer" }}
            onMouseEnter={e => { const img = e.currentTarget.querySelector("img"); if (img) img.style.transform = "scale(1.06)"; }}
            onMouseLeave={e => { const img = e.currentTarget.querySelector("img"); if (img) img.style.transform = "scale(1)"; }}
          >
            <img src={b.img} alt={b.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "transform .5s", opacity: .38 }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(13,13,13,.3) 0%,rgba(13,13,13,.86) 100%)" }} />
            <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", padding: "32px 24px", textAlign: "center" }}>
              <h3 style={{ color: T.text, fontSize: "20px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "3px", textTransform: "uppercase", margin: "0 0 8px" }}>{b.title}</h3>
              <div style={{ width: "28px", height: "1px", background: T.gold, margin: "0 auto 10px" }} />
              <p style={{ color: T.textDim, fontSize: "11px", margin: "0 0 16px", maxWidth: "260px" }}>{b.sub}</p>
              <span style={{ color: T.gold, fontSize: "10px", letterSpacing: "3px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif", border: `1px solid ${T.gold}`, padding: "5px 16px", borderRadius: "2px" }}>Explore →</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// RECENTLY VIEWED  (new)
// ═══════════════════════════════════════════════════════════════════
function RecentlyViewed({ history, onView }) {
  if (!history.length) return null;
  return (
    <section style={{ padding: "44px 24px 52px", background: T.bg }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
          <h2 style={{ color: T.text, fontSize: "17px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "4px", textTransform: "uppercase", margin: 0 }}>Recently Viewed</h2>
          <span style={{ color: T.gold, fontSize: "10px", letterSpacing: "2px", fontFamily: "'Bebas Neue',sans-serif" }}>{history.length} items</span>
        </div>
        <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "6px" }}>
          {history.map(p => (
            <div key={p.id} onClick={() => onView(p)}
              style={{ flexShrink: 0, width: "154px", background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "4px", overflow: "hidden", cursor: "pointer", transition: "border-color .25s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.borderHi} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
            >
              <div style={{ height: "186px", overflow: "hidden", background: T.bgHover }}>
                <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: .78 }} />
              </div>
              <div style={{ padding: "10px 12px" }}>
                <p style={{ color: T.text, fontSize: "12px", margin: "0 0 3px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "1px", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</p>
                <p style={{ color: T.gold, fontSize: "13px", margin: 0, fontFamily: "'Bebas Neue',sans-serif" }}>₹{effectivePrice(p).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TRUST BADGES  (upgraded: SVG icons instead of emoji)
// ═══════════════════════════════════════════════════════════════════
function TrustBadges() {
  const badges = [
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>, text: "Designed in India" },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="1.8" strokeLinecap="round"><rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8l5 3-5 3z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>, text: "Delivery 5–7 Days" },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="1.8" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>, text: "Premium Quality" },
    { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>, text: "100% Satisfaction" },
  ];
  return (
    <section style={{ background: "#0a0a0a", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: "30px 24px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto", display: "flex", justifyContent: "center", gap: "48px", flexWrap: "wrap" }}>
        {badges.map((b, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {b.icon}
            <span style={{ color: T.textMid, fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif" }}>{b.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FOOTER  (fix: typo in margin; added track-order link)
// ═══════════════════════════════════════════════════════════════════
function Footer({ onTrackOrder }) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  return (
    <footer id="contact" style={{ background: "#0a0a0a", paddingTop: "64px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>
        <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1.5fr", gap: "44px", paddingBottom: "48px", borderBottom: `1px solid ${T.border}` }}>
          {/* Brand */}
          <div>
            <h4 style={{ color: T.text, fontSize: "22px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "5px", margin: "0 0 14px" }}>VELUNO</h4>
            <p style={{ color: T.textDim, fontSize: "13px", lineHeight: 1.7, margin: "0 0 18px" }}>Style meets bravery. A streetwear brand designed in India, built for those who dare to be different.</p>
            <a href="https://www.instagram.com/officialveluno" target="_blank" rel="noreferrer"
              style={{ color: T.textDim, textDecoration: "none", fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif", transition: "color .25s", display: "inline-flex", alignItems: "center", gap: "6px" }}
              onMouseEnter={e => e.currentTarget.style.color = T.gold} onMouseLeave={e => e.currentTarget.style.color = T.textDim}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r=".5" fill="currentColor" /></svg>
              Instagram
            </a>
          </div>
          {/* Quick links */}
          <div>
            <h5 style={{ color: T.text, fontSize: "11px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "3px", margin: "0 0 18px", textTransform: "uppercase" }}>Quick Links</h5>
            {["Shop All", "Oversized T-Shirts", "Hoodies", "Sweatshirts", "T-Shirts"].map(l => (
              <a key={l} href="#" onClick={e => { e.preventDefault(); document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }); }}
                style={{ display: "block", color: T.textDim, textDecoration: "none", fontSize: "13px", marginBottom: "10px", transition: "color .25s" }}
                onMouseEnter={e => e.currentTarget.style.color = T.gold} onMouseLeave={e => e.currentTarget.style.color = T.textDim}>{l}</a>
            ))}
          </div>
          {/* Help */}
          <div>
            <h5 style={{ color: T.text, fontSize: "11px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "3px", margin: "0 0 18px", textTransform: "uppercase" }}>Help</h5>
            {["Privacy Policy", "Refund Policy", "Shipping Policy", "Terms of Service"].map(l => (
              <a key={l} href="#" style={{ display: "block", color: T.textDim, textDecoration: "none", fontSize: "13px", marginBottom: "10px", transition: "color .25s" }}
                onMouseEnter={e => e.currentTarget.style.color = T.gold} onMouseLeave={e => e.currentTarget.style.color = T.textDim}>{l}</a>
            ))}
            <a href="#" onClick={e => { e.preventDefault(); onTrackOrder(); }}
              style={{ display: "block", color: T.gold, textDecoration: "none", fontSize: "13px", marginTop: "14px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "1px", transition: "opacity .25s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = ".7"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>📦 Track Your Order →</a>
          </div>
          {/* Newsletter — fix: margin typo corrected */}
          <div>
            <h5 style={{ color: T.text, fontSize: "11px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "3px", margin: "0 0 10px", textTransform: "uppercase" }}>Stay Connected</h5>
            <p style={{ color: T.textDim, fontSize: "13px", marginBottom: "16px", lineHeight: 1.6 }}>New drops, exclusive offers, behind-the-scenes.</p>
            {!subscribed ? (
              <div style={{ display: "flex" }}>
                <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && email) setSubscribed(true); }} placeholder="Your email"
                  style={{ flex: 1, background: T.bgCard, border: `1px solid ${T.border}`, borderRight: "none", padding: "11px 14px", color: T.text, fontSize: "12px", outline: "none", borderRadius: "3px 0 0 3px" }} />
                <button onClick={() => { if (email) setSubscribed(true); }}
                  style={{ background: T.gold, border: "none", color: "#111", padding: "11px 18px", fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif", cursor: "pointer", fontWeight: 700, borderRadius: "0 3px 3px 0" }}>Join</button>
              </div>
            ) : <p style={{ color: "#4caf50", fontSize: "13px" }}>✓ Thanks for subscribing!</p>}
            <p style={{ color: T.textLow, fontSize: "11px", marginTop: "14px" }}>Contact: officialveluno@gmail.com</p>
          </div>
        </div>
        {/* Bottom */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 0", flexWrap: "wrap", gap: "10px" }}>
          <p style={{ color: T.textTiny, fontSize: "12px", margin: 0 }}>© 2026 Veluno. All rights reserved.</p>
          <p style={{ color: T.textTiny, fontSize: "11px", margin: 0 }}>India | INR ₹</p>
        </div>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════
export default function VelunoStore() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filter, setFilter] = useState("All");
  const [toasts, setToasts] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // NEW: Products from API
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Fetch products from backend API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        const response = await productAPI.getAll({ limit: 50 });

        if (response.success && response.products) {
          // Transform backend products to frontend format
          const transformedProducts = response.products.map(transformProduct);
          setProducts(transformedProducts);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
        // Fallback to empty array if API fails
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Simulate load delay for skeleton
  useEffect(() => { const t = setTimeout(() => setImagesLoaded(true), 900); return () => clearTimeout(t); }, []);

  const filteredProducts = filter === "All" ? products : products.filter(p => p.category === filter);

  // ── toasts ──
  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3400);
  }, []);
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // ── cart ──
  const addToCart = (product, size = "M", qty = 1) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.id === product.id && i.size === size);
      if (idx >= 0) { const n = [...prev]; n[idx] = { ...n[idx], qty: n[idx].qty + qty }; return n; }
      return [...prev, { ...product, size, qty }];
    });
    addToast({ icon: "🛒", title: `${product.name} added`, sub: `Size ${size} · ₹${effectivePrice(product).toLocaleString()}` });
  };
  const removeFromCart = (idx) => setCart(prev => prev.filter((_, i) => i !== idx));
  const updateCartQty = (idx, newQty) => {
    if (newQty <= 0) return removeFromCart(idx);
    setCart(prev => prev.map((item, i) => i === idx ? { ...item, qty: newQty } : item));
  };

  // ── recently viewed ──
  const viewProduct = (product) => {
    setSelectedProduct(product);
    setRecentlyViewed(prev => [product, ...prev.filter(p => p.id !== product.id)].slice(0, 6));
  };

  // ── checkout success handler ──
  const handleCheckoutSuccess = (order) => {
    addToast({
      icon: "✅",
      title: "Order Placed Successfully!",
      sub: `Order #${order.orderNumber}`
    });
    setCart([]);
    setCheckoutOpen(false);
    setCartOpen(false);
  };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "system-ui,sans-serif", color: T.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideLeft{from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes toastSlide{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:${T.bg}}
        ::-webkit-scrollbar-thumb{background:#222;border-radius:3px}
        input::placeholder{color:${T.textDim}}
        @media(max-width:920px){
          .nav-links{display:none!important}
          .hamburger-btn{display:flex!important}
          .hero-layout{flex-direction:column!important}
          .hero-img{display:none!important}
        }
        @media(max-width:700px){
          .product-grid{grid-template-columns:repeat(2,1fr)!important}
          .cat-grid{grid-template-columns:repeat(2,1fr)!important}
          .footer-grid{grid-template-columns:1fr 1fr!important}
        }
        @media(max-width:480px){
          .product-grid{grid-template-columns:1fr!important}
        }
      `}</style>

      <ScrollProgress />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <Marquee text="NEW DROP IS LIVE!" speed={26} />
      <Navbar cartCount={cart.reduce((s, i) => s + i.qty, 0)} onCartOpen={() => setCartOpen(true)} onSearchOpen={() => setSearchOpen(true)} />
      <Hero onShopClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })} onTrackClick={() => setTrackOpen(true)} featuredProduct={products[0]} />
      <TrustBadges />

      {/* Products */}
      <section id="products" style={{ padding: "68px 24px", background: T.bg }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 style={{ color: T.text, textAlign: "center", fontSize: "26px", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "6px", textTransform: "uppercase", margin: "0 0 6px" }}>Featured Products</h2>
          <div style={{ width: "36px", height: "2px", background: T.gold, margin: "0 auto 28px" }} />
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "34px", flexWrap: "wrap" }}>
            {["All", ...CATEGORIES.map(c => c.name)].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ background: filter === f ? T.gold : "transparent", border: `1px solid ${filter === f ? T.gold : T.border}`, color: filter === f ? "#111" : T.textMid, padding: "7px 18px", fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'Bebas Neue',sans-serif", cursor: "pointer", borderRadius: "3px", transition: "all .2s", fontWeight: filter === f ? 700 : 500 }}
              >{f}</button>
            ))}
          </div>
          <div className="product-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
            {!imagesLoaded
              ? [1, 2, 3, 4].map(i => <ProductSkeleton key={i} />)
              : filteredProducts.map((p, i) => <ProductCard key={p.id} product={p} onAdd={addToCart} onView={viewProduct} delay={i * 0.06} />)
            }
          </div>
        </div>
      </section>

      <Marquee text="STYLED FOR THE BRAVE" speed={32} />
      <Categories onFilter={setFilter} />
      <LookbookBanners />
      <RecentlyViewed history={recentlyViewed} onView={viewProduct} />
      <Footer onTrackOrder={() => setTrackOpen(true)} />

      {/* Overlays */}
      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={addToCart} />}
      {cartOpen && <CartDrawer cart={cart} onClose={() => setCartOpen(false)} onRemove={removeFromCart} onUpdateQty={updateCartQty} onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }} />}
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} onViewProduct={viewProduct} products={products} />}
      {trackOpen && <OrderTracker onClose={() => setTrackOpen(false)} />}
      {checkoutOpen && (
        <CheckoutModal
          cart={cart}
          total={cart.reduce((s, i) => effectivePrice(i) * i.qty, 0)}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={handleCheckoutSuccess}
        />
      )}
      <ScrollToTop />
    </div>
  );
}
