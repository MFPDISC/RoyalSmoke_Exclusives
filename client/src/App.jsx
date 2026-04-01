import React, { useEffect, useState, lazy, Suspense } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useSearchParams, useNavigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { CartProvider, useCart } from './context/CartContext';
import {
  Phone,
  ShoppingBag,
  Sparkles,
  RefreshCcw,
  Truck,
  MessageCircle,
  ArrowRight,
  Package,
  ChevronRight,
  Star,
  Zap,
  PhoneCall,
  LayoutGrid,
  Crown,
  Plus
} from 'lucide-react';

const Home = lazy(() => import('./pages/Home'));
const Cigars = lazy(() => import('./pages/Cigars'));
const Cart = lazy(() => import('./pages/Cart'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const Admin = lazy(() => import('./pages/Admin'));
const StoreDashboard = lazy(() => import('./pages/StoreDashboard'));
const Dispensary = lazy(() => import('./pages/Dispensary'));

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const PageShell = ({ title, children }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-serif text-white mb-6">{title}</h1>
      <div className="bg-dark-800 border border-gray-800 rounded-lg p-6 text-gray-200 leading-relaxed">
        {children}
      </div>
    </div>
  );
};

const About = () => {
  return (
    <PageShell title="About RoyalSmoke">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-serif text-white mb-3">Our Story</h2>
          <p className="text-gray-300 leading-relaxed">
            RoyalSmoke Exclusives was born from a simple belief: premium cigars deserve a premium experience. We're not just another online store—we're a curated destination for connoisseurs who demand excellence in every draw.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-serif text-white mb-3">What Makes Us Different</h2>
          <div className="space-y-3">
            <div className="bg-dark-900 border border-gray-800 rounded-lg p-4">
              <h3 className="text-gold-400 font-semibold mb-2">Curated Selection</h3>
              <p className="text-gray-400 text-sm">Every cigar in our collection is hand-selected from the world's finest tobacco regions. No mass-market products—only premium, limited-edition drops.</p>
            </div>
            <div className="bg-dark-900 border border-gray-800 rounded-lg p-4">
              <h3 className="text-gold-400 font-semibold mb-2">Fast, Tracked Delivery</h3>
              <p className="text-gray-400 text-sm">Same-day dispatch for orders placed before 2 PM. Real-time tracking so you know exactly when your cigars arrive.</p>
            </div>
            <div className="bg-dark-900 border border-gray-800 rounded-lg p-4">
              <h3 className="text-gold-400 font-semibold mb-2">VIP Treatment</h3>
              <p className="text-gray-400 text-sm">Our exclusive membership program rewards loyalty with monthly deliveries, priority access, and member-only pricing on top sellers.</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-serif text-white mb-3">Our Promise</h2>
          <p className="text-gray-300 leading-relaxed">
            Authenticity, quality, and service. Every order is verified for age compliance, packaged with care, and delivered with precision. We're building a community of aficionados who appreciate the finer things.
          </p>
        </div>
      </div>
    </PageShell>
  );
};

const Shipping = () => {
  return (
    <PageShell title="Shipping & Delivery">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Delivery zones</h2>
          <p>Delivery fees are calculated at checkout using your postal code.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">ETA</h2>
          <p>Most deliveries are dispatched fast. For some areas we support live tracking when available.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">21+ only</h2>
          <p>ID verification must be performed on delivery in accordance with regulatory guidelines.</p>
        </div>
      </div>
    </PageShell>
  );
};

const Returns = () => {
  return (
    <PageShell title="Returns & Refunds">
      <div className="space-y-4">
        <p>
          If there’s an issue with an order (missing item, damaged goods, wrong product), contact us immediately so we can make it right.
        </p>
        <p>
          For hygiene and compliance reasons, opened tobacco products may not be eligible for return. We’ll always aim for a fair resolution.
        </p>
      </div>
    </PageShell>
  );
};

const FAQ = () => {
  return (
    <PageShell title="FAQ">
      <div className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">How do I login?</h3>
          <p>Use your mobile number and your 3‑digit PIN. Your PIN is sent to you after your first order.</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Do you offer member discounts?</h3>
          <p>Yes — VIP members receive 25% off all orders and a monthly cigar delivery.</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Can I track delivery?</h3>
          <p>When tracking is available, a tracking link will be provided after checkout.</p>
        </div>
      </div>
    </PageShell>
  );
};

const Contact = () => {
  return (
    <PageShell title="Contact">
      <div className="space-y-4">
        <p>Support hours: Mon–Sun</p>
        <p>
          Email: <span className="text-white">support@royalsmoke.co.za</span>
        </p>
        <p>
          WhatsApp: <span className="text-white">+27</span>
        </p>
      </div>
    </PageShell>
  );
};

// OrderTracking moved to separate file ./pages/OrderTracking.jsx

const Account = () => {
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [loginMode, setLoginMode] = useState('password');
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [setPasswordPin, setSetPasswordPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [changePasswordNew, setChangePasswordNew] = useState('');
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('royal_customer');
    if (saved) {
      try {
        setCustomer(JSON.parse(saved));
      } catch {
        localStorage.removeItem('royal_customer');
      }
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!customer?.id) return;
      setLoading(true);
      try {
        const [ordersRes, productsRes] = await Promise.all([
          axios.get(`${API}/auth/orders/${customer.id}`),
          axios.get(`${API}/products`)
        ]);
        setOrders(ordersRes.data || []);
        setAllProducts(productsRes.data || []);
      } catch (e) {
        console.error('Failed to fetch data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [customer?.id]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthMessage('');
    setLoading(true);
    try {
      const payload = loginMode === 'password' ? { identifier, password } : { identifier, pin };
      const res = await axios.post(`${API}/auth/login`, payload);
      if (res.data?.customer) {
        localStorage.setItem('royal_customer', JSON.stringify(res.data.customer));
        setCustomer(res.data.customer);
        setPin('');
        setPassword('');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPin = async () => {
    setAuthMessage('');
    if (!identifier) {
      alert('Please enter your mobile or email first');
      return;
    }
    setLoading(true);
    
    // Simulate interactive signup without needing real SMS/PIN
    setTimeout(() => {
        const mockCustomer = {
            id: 'mock-' + Date.now(),
            name: identifier.split('@')[0] || 'Member',
            phone: identifier,
            email: identifier.includes('@') ? identifier : null,
            is_vip: true,
            tier: 'reserve-club'
        };
        localStorage.setItem('royal_customer', JSON.stringify(mockCustomer));
        setCustomer(mockCustomer);
        setAuthMessage('Registration successful! Welcome to the club.');
        setLoading(false);
    }, 1500);
  };

  const handleSetPassword = async () => {
    setAuthMessage('');
    if (!identifier || !setPasswordPin || !newPassword) {
      alert('Please enter your details and new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/set-password`, {
        phone: identifier,
        pin: setPasswordPin,
        password: newPassword
      });
      if (res.data?.customer) {
        localStorage.setItem('royal_customer', JSON.stringify(res.data.customer));
        setCustomer(res.data.customer);
      }
      setShowSetPassword(false);
      setSetPasswordPin('');
      setNewPassword('');
      setConfirmPassword('');
      setAuthMessage('Password set successfully.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('royal_customer');
    setCustomer(null);
    setOrders([]);
    setIdentifier('');
    setPin('');
    setPassword('');
    setAuthMessage('');
  };

  const lastOrder = orders.length > 0 ? orders[0] : null;
  const recommendedProducts = allProducts
    .filter(p => !String(p.id).startsWith('membership-') && p.category !== 'Membership')
    .sort((a, b) => b.stock_qty - a.stock_qty)
    .slice(0, 4);

  if (!customer) {
    return (
      <div className="max-w-xl mx-auto py-12 px-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif text-white mb-2">My Account</h1>
          <p className="text-gray-500">Sign up or sign in using your mobile number.</p>
        </div>
        <div className="bg-dark-800 border border-white/5 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Mobile or Email</label>
              <div className="relative group">
                <input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  className="w-full bg-dark-900 border border-white/5 rounded-xl p-4 text-white focus:border-gold-500 outline-none transition-all group-hover:border-white/20"
                  placeholder="Enter phone or email"
                  required
                />
              </div>
            </div>

            <div className="flex bg-dark-900 p-1 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setLoginMode('password')}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${loginMode === 'password' ? 'bg-white text-black shadow-lg translate-y-[-1px]' : 'text-gray-500 hover:text-white'}`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => setLoginMode('pin')}
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${loginMode === 'pin' ? 'bg-white text-black shadow-lg translate-y-[-1px]' : 'text-gray-500 hover:text-white'}`}
              >
                PIN
              </button>
            </div>

            <div>
              {loginMode === 'password' ? (
                <>
                  <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full bg-dark-900 border border-white/5 rounded-xl p-4 text-white focus:border-gold-500 outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                </>
              ) : (
                <>
                  <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">3-digit PIN</label>
                  <input
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full bg-dark-900 border border-white/5 rounded-xl p-4 text-white focus:border-gold-500 outline-none transition-all"
                    placeholder="000"
                    required
                  />
                </>
              )}
            </div>

            {loginMode === 'pin' && (
              <button
                type="button"
                onClick={handleRequestPin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 text-gold-500/80 hover:text-gold-500 text-xs font-bold uppercase tracking-widest transition"
              >
                <MessageCircle size={14} />
                Send me a PIN
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full bg-gold-500 text-black font-black py-4 rounded-xl hover:bg-gold-400 active:scale-[0.98] transition-all shadow-xl overflow-hidden"
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {loading ? 'Processing...' : 'Sign In / Register'}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {authMessage && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs text-center font-bold">
                {authMessage}
              </div>
            )}

            <div className="pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowSetPassword(v => !v)}
                className="w-full text-xs text-gray-500 hover:text-white transition flex items-center justify-center gap-1"
              >
                {showSetPassword ? 'Hide setup' : 'Don’t have a password? Set one here'}
              </button>
            </div>

            {showSetPassword && (
              <div className="bg-dark-900 border border-white/10 rounded-2xl p-6 space-y-4 animate-fadeIn">
                <div className="text-white font-bold flex items-center gap-2">
                  <Sparkles size={16} className="text-gold-500" />
                  Create Password
                </div>
                <div className="text-xs text-gray-500 leading-relaxed mb-4">You'll need a PIN sent to your phone to verify this change.</div>

                <button
                  type="button"
                  onClick={handleRequestPin}
                  disabled={loading}
                  className="w-full bg-dark-800 border border-white/5 text-gray-400 font-bold py-2 rounded-lg hover:border-gold-500/50 transition-all text-xs uppercase"
                >
                  Send Verification PIN
                </button>

                <input
                  value={setPasswordPin}
                  onChange={(e) => setSetPasswordPin(e.target.value)}
                  className="w-full bg-dark-800 border border-white/5 rounded-lg p-3 text-white focus:border-gold-500 outline-none text-sm"
                  placeholder="Enter 3-digit PIN"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-dark-800 border border-white/5 rounded-lg p-3 text-white focus:border-gold-500 outline-none text-sm"
                  placeholder="New secure password"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-dark-800 border border-white/5 rounded-lg p-3 text-white focus:border-gold-500 outline-none text-sm"
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  onClick={handleSetPassword}
                  disabled={loading}
                  className="w-full bg-white text-black font-black py-3 rounded-lg hover:bg-gray-100 transition shadow-lg"
                >
                  Confirm & Save
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 lg:py-12 px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl lg:text-5xl font-serif text-white mb-2">Welcome Back, {customer.name} 👑</h1>
          <p className="text-gray-500 font-medium tracking-wide">RoyalSmoke Exclusives Membership Dashboard</p>
        </div>
        <button
          onClick={handleLogout}
          className="self-start px-6 py-2 border border-white/10 rounded-full text-sm font-bold text-gray-400 hover:text-white hover:border-white/30 transition-all"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar: Profile & VIP */}
        <div className="lg:col-span-4 space-y-8">
          {/* Profile Card */}
          <div className="bg-dark-800 border border-white/5 rounded-3xl p-8 relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 blur-[80px] rounded-full -mr-16 -mt-16 group-hover:bg-gold-500/10 transition-colors"></div>

            <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
              <Star size={18} className="text-gold-500 fill-gold-500/20" />
              Member Profile
            </h2>
            <div className="space-y-4 text-sm font-medium">
              <div className="flex flex-col gap-1">
                <span className="text-gray-500 uppercase tracking-widest text-[10px] font-black">Full Name</span>
                <span className="text-white text-lg">{customer.name}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-gray-500 uppercase tracking-widest text-[10px] font-black">Identifier</span>
                <span className="text-white">{customer.email || customer.phone}</span>
              </div>
              {customer.date_of_birth && (
                <div className="flex flex-col gap-1">
                  <span className="text-gray-500 uppercase tracking-widest text-[10px] font-black">Birthday</span>
                  <span className="text-white">{customer.date_of_birth}</span>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <span className="text-gray-500 uppercase tracking-widest text-[10px] font-black">Shipping Access</span>
                <span className="text-white text-xs truncate opacity-60">{customer.address || 'Standard Delivery Enabled'}</span>
              </div>
            </div>

            {/* Quick Actions Support */}
            <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-3">
              <a
                href="tel:+27"
                className="flex flex-col items-center justify-center p-4 bg-dark-900 rounded-2xl border border-white/5 hover:border-gold-500/50 hover:bg-dark-700 transition-all group/btn"
              >
                <PhoneCall size={20} className="text-gold-500 mb-2 group-hover/btn:scale-110 transition-transform" />
                <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Call Us</span>
              </a>
              <Link
                to="/cigars"
                className="flex flex-col items-center justify-center p-4 bg-dark-900 rounded-2xl border border-white/5 hover:border-purple-500/50 hover:bg-dark-700 transition-all group/btn"
              >
                <ShoppingBag size={20} className="text-purple-500 mb-2 group-hover/btn:scale-110 transition-transform" />
                <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Order Online</span>
              </Link>
            </div>
          </div>

          {/* VIP Status */}
          {customer.is_vip ? (
            <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-2 border-purple-500/20 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-2 right-4 text-purple-500/20"><Crown size={80} /></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="px-3 py-1 bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-purple-500/20">Elite Member</div>
                  <div className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">{customer.discount_reset_month}</div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="text-3xl font-bold text-white tracking-tighter">R {customer.discount_used_this_month?.toFixed(0) || 0} Saved</div>
                    <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Cap: R{customer.discount_cap_monthly || 1000}</div>
                  </div>

                  <div className="h-2 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 rounded-full transition-all duration-1000 animate-gradient-x"
                      style={{ width: `${Math.min(100, (customer.discount_used_this_month || 0) / (customer.discount_cap_monthly || 1000) * 100)}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-purple-300 font-medium leading-relaxed italic">Your VIP status automatically applies 25% off every drop, saving you an average of R350 each time.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-dark-800 border-2 border-dashed border-white/10 rounded-3xl p-8 text-center group hover:border-gold-500/30 transition-all duration-500 shadow-xl">
              <div className="w-16 h-16 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Crown size={30} className="text-gold-500" />
              </div>
              <h3 className="text-white font-serif text-lg mb-2">Upgrade to VIP</h3>
              <p className="text-gray-500 text-xs mb-6 leading-relaxed">Join the Reserve Club for 25% off storewide and monthly exclusive drops.</p>
              <Link to="/" className="inline-block w-full bg-gold-500 text-black font-black py-3 rounded-xl hover:bg-gold-400 transition-all shadow-lg active:scale-95">
                Join Now
              </Link>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-8">
          {/* Buy It Again - FEATURED */}
          {lastOrder && (
            <div className="bg-white text-black rounded-3xl p-8 shadow-2xl relative overflow-hidden group border border-gray-100">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                <RefreshCcw size={160} />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1 px-3 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-full">One-Click Reorder</div>
                    <span className="text-xs font-bold text-gray-400">Previous order #{lastOrder.id}</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-serif font-black leading-tight">Pick up exactly where <br />you left off.</h2>
                </div>
                <button
                  onClick={() => {
                    try {
                      const items = JSON.parse(lastOrder.items || '[]');
                      items.forEach(item => addToCart(item));
                      navigate('/cart');
                    } catch {
                      alert('Could not reorder');
                    }
                  }}
                  className="flex items-center justify-center gap-3 bg-black text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/20 group/re"
                >
                  <RefreshCcw size={18} className="group-hover/re:rotate-180 transition-transform duration-500" />
                  Buy It Again
                </button>
              </div>
            </div>
          )}

          {/* Recommendations Subsection */}
          {recommendedProducts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-serif text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-gold-500" />
                  Top Picks for You
                </h2>
                <Link to="/cigars" className="text-xs font-black uppercase tracking-widest text-gold-500 hover:text-white transition">Explore All <ArrowRight size={12} className="inline ml-1" /></Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recommendedProducts.map(p => (
                  <div key={p.id} className="bg-dark-800 border border-white/5 rounded-2xl p-3 hover:border-white/20 transition-all cursor-pointer group">
                    <div className="aspect-square bg-dark-900 rounded-xl mb-3 overflow-hidden">
                      <img
                        src={p.image_url || '/placeholder_cigar.jpg'}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-60 group-hover:opacity-100"
                        alt={p.name}
                      />
                    </div>
                    <div className="text-[11px] font-black text-white truncate mb-1">{p.name}</div>
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-bold text-gold-500">R {p.price_zar}</div>
                      <button
                        onClick={(e) => { e.preventDefault(); addToCart({ ...p, quantity: 1 }); }}
                        className="p-1 px-2 bg-white text-black rounded-lg hover:bg-gold-500 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historical Orders */}
          <div className="bg-dark-800 border border-white/5 rounded-3xl p-8 shadow-xl">
            <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
              <Package size={18} className="text-gray-500" />
              Recent Deliveries
            </h2>

            {loading ? (
              <div className="flex flex-col items-center py-12 text-gray-500 animate-pulse">
                <RefreshCcw className="animate-spin mb-2" />
                <span className="text-xs font-black uppercase tracking-widest">Fetching Vault...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-gray-600 font-medium">No order history found yet.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {orders.map((o) => (
                  <div key={o.id} className="bg-dark-900 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/10 transition-all">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 bg-dark-800 rounded-xl flex items-center justify-center text-gold-500 font-bold border border-white/5">
                        #{o.id}
                      </div>
                      <div>
                        <div className="text-white font-bold">R {Number(o.total_amount).toFixed(2)}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{o.created_at}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${o.status === 'delivered' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        o.status === 'dispatched' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          'bg-gold-500/10 text-gold-500 border-gold-500/20'
                        }`}>
                        {o.status}
                      </div>
                      <Link
                        to={`/track/${o.id}`}
                        className="p-2 px-4 hover:bg-white/5 rounded-full text-xs font-bold text-gray-400 hover:text-white transition-all"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderConfirmation = () => {
  const [params] = useSearchParams();
  const orderId = params.get('orderId');
  return (
    <PageShell title="Order Confirmation">
      <div className="space-y-4">
        <p className="text-gray-200">Thank you. Your order has been received.</p>
        {orderId && (
          <p className="text-white font-semibold">Order ID: {orderId}</p>
        )}
        <p className="text-gray-300 text-sm">
          If you paid via PayFast, payment confirmation is processed via IPN.
        </p>
        <Link className="inline-block bg-gold-500 text-black font-bold px-5 py-3 rounded hover:bg-gold-400 transition" to="/">
          Continue shopping
        </Link>
      </div>
    </PageShell>
  );
};

const PaymentCancelled = () => {
  return (
    <PageShell title="Payment Cancelled">
      <div className="space-y-4">
        <p>Your payment was cancelled. Your cart is still available.</p>
        <Link className="inline-block bg-white text-black font-bold px-5 py-3 rounded hover:bg-gray-200 transition" to="/cart">
          Return to cart
        </Link>
      </div>
    </PageShell>
  );
};

const PaymentInstructions = () => {
  const [params] = useSearchParams();
  const method = (params.get('method') || '').toLowerCase();
  const orderId = params.get('orderId');
  const amount = params.get('amount');

  const usdtAddress = import.meta.env.VITE_USDT_ADDRESS || '';
  const usdtNetwork = import.meta.env.VITE_USDT_NETWORK || 'TRC20';
  const payshapRecipient = import.meta.env.VITE_PAYSHAP_RECIPIENT || '';
  const payshapName = import.meta.env.VITE_PAYSHAP_NAME || 'RoyalSmoke Exclusives';

  const copy = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied');
    } catch {
      alert('Copy failed. Please copy manually.');
    }
  };

  const title = method === 'usdt'
    ? 'Pay with USDT'
    : method === 'payshap'
      ? 'Pay with PayShap'
      : 'Payment Instructions';

  return (
    <PageShell title={title}>
      <div className="space-y-4">
        <div className="bg-dark-900 border border-gray-800 rounded p-4">
          <div className="text-gray-300">Order</div>
          <div className="text-white font-semibold">#{orderId || '—'}</div>
          {amount && (
            <div className="text-gold-400 font-bold mt-1">Amount: R {Number(amount).toFixed(2)}</div>
          )}
          <div className="text-xs text-gray-500 mt-2">Your order is reserved while we verify payment.</div>
        </div>

        {method === 'payshap' && (
          <div className="space-y-3">
            <p className="text-gray-200">
              Send a PayShap payment and include your <span className="text-white font-semibold">Order ID</span> in the reference.
            </p>
            <div className="bg-dark-900 border border-gray-800 rounded p-4">
              <div className="text-xs text-gray-500">Recipient</div>
              <div className="text-white font-semibold">{payshapName}</div>
              <div className="text-xs text-gray-500 mt-3">PayShap ID / Mobile</div>
              <div className="flex items-center justify-between gap-3">
                <div className="text-white break-all">{payshapRecipient || 'SET_VITE_PAYSHAP_RECIPIENT'}</div>
                <button onClick={() => copy(payshapRecipient)} className="bg-white text-black px-3 py-2 rounded font-semibold hover:bg-gray-200 transition">
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}

        {method === 'usdt' && (
          <div className="space-y-3">
            <p className="text-gray-200">
              Pay using Binance / VALR or any wallet. Use network <span className="text-white font-semibold">{usdtNetwork}</span> and include your <span className="text-white font-semibold">Order ID</span> in the note if supported.
            </p>
            <div className="bg-dark-900 border border-gray-800 rounded p-4">
              <div className="text-xs text-gray-500">USDT Address ({usdtNetwork})</div>
              <div className="flex items-center justify-between gap-3">
                <div className="text-white break-all">{usdtAddress || 'SET_VITE_USDT_ADDRESS'}</div>
                <button onClick={() => copy(usdtAddress)} className="bg-white text-black px-3 py-2 rounded font-semibold hover:bg-gray-200 transition">
                  Copy
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-3">Important</div>
              <div className="text-sm text-gray-300">
                Send only USDT on the selected network. Wrong network deposits may be lost.
              </div>
            </div>
          </div>
        )}

        {method !== 'usdt' && method !== 'payshap' && (
          <p className="text-gray-300">Select a payment method from checkout.</p>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          <Link className="bg-gold-500 text-black font-bold px-5 py-3 rounded hover:bg-gold-400 transition" to="/">
            Continue shopping
          </Link>
          <Link className="border border-gray-700 text-gray-200 font-bold px-5 py-3 rounded hover:bg-dark-900 transition" to="/cart">
            Back to cart
          </Link>
        </div>
      </div>
    </PageShell>
  );
};

const LoadingFallback = () => (
  <div className="min-h-screen bg-dark-900 flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gold-400"></div>
      <p className="text-gray-400 mt-4">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <CartProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="cigars" element={<Cigars />} />
              <Route path="cart" element={<Cart />} />
              <Route path="account" element={<Account />} />
              <Route path="about" element={<About />} />
              <Route path="shipping" element={<Shipping />} />
              <Route path="returns" element={<Returns />} />
              <Route path="faq" element={<FAQ />} />
              <Route path="contact" element={<Contact />} />
              <Route path="order-confirmation" element={<OrderConfirmation />} />
              <Route path="payment-cancelled" element={<PaymentCancelled />} />
              <Route path="payment-instructions" element={<PaymentInstructions />} />
              <Route path="track/:orderId" element={<OrderTracking />} />
              <Route path="track" element={<OrderTracking />} />
              <Route path="dispensary" element={<Dispensary />} />
              <Route path="admin" element={<Admin />} />
              <Route path="store" element={<StoreDashboard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </CartProvider>
  );
}

export default App;
