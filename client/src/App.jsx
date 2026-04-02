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
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [loginMode, setLoginMode] = useState('password');
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [setPasswordPin, setSetPasswordPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dispensary';

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
          axios.get(`${API}/auth/orders/${customer.id}`).catch(() => ({ data: [] })),
          axios.get(`${API}/products`).catch(() => ({ data: [] }))
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
        setAuthMessage('Welcome back!');
        setTimeout(() => navigate(redirectPath), 1000);
      }
    } catch (err) {
      // Fallback for GH Pages / Demo Mode
      if (err.code === 'ERR_NETWORK' || err.response?.status === 404) {
        setAuthMessage('Demo Mode: Entering as guest...');
        const mockCustomer = {
          id: 'demo-' + Date.now(),
          name: identifier.split('@')[0] || 'Royal Member',
          phone: identifier,
          is_vip: true,
          tier: 'reserve-club'
        };
        localStorage.setItem('royal_customer', JSON.stringify(mockCustomer));
        setCustomer(mockCustomer);
        setTimeout(() => navigate(redirectPath), 1500);
      } else {
        alert(err.response?.data?.error || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthMessage('');
    if (!identifier || !name) {
      alert('Name and Phone/Email are required');
      return;
    }
    setLoading(true);
    
    try {
      // Try real registration first
      const res = await axios.post(`${API}/auth/request-pin`, { name, phone: identifier, email: identifier.includes('@') ? identifier : email });
      if (res.data?.success) {
        setAuthMessage('PIN sent! Please check your messages.');
        setLoginMode('pin');
        setActiveTab('login');
      }
    } catch (err) {
      // Fallback/Mock for GH Pages
      console.log('Using mock registration for demo...');
      setTimeout(() => {
        const mockCustomer = {
          id: 'mock-' + Date.now(),
          name: name || 'Member',
          phone: identifier,
          email: identifier.includes('@') ? identifier : email,
          is_vip: true,
          tier: 'reserve-club'
        };
        localStorage.setItem('royal_customer', JSON.stringify(mockCustomer));
        setCustomer(mockCustomer);
        setAuthMessage('Registration successful! Welcome to the club.');
        setLoading(false);
        setTimeout(() => navigate(redirectPath), 1500);
      }, 1500);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('royal_customer');
    setCustomer(null);
    setOrders([]);
    setIdentifier('');
    setName('');
    setEmail('');
    setPin('');
    setPassword('');
    setAuthMessage('');
  };

  if (!customer) {
    return (
      <div className="max-w-xl mx-auto py-12 px-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif text-white mb-2">Access the Club</h1>
          <p className="text-gray-500">Become a member for exclusive dispensary access.</p>
        </div>

        <div className="bg-dark-800 border border-white/5 rounded-3xl p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex bg-dark-900 p-1 rounded-xl border border-white/5 mb-8">
            <button
              onClick={() => { setActiveTab('login'); setAuthMessage(''); }}
              className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'login' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('register'); setAuthMessage(''); }}
              className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'register' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              Sign Up
            </button>
          </div>

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Mobile or Email</label>
                <input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-dark-900 border border-white/5 rounded-xl p-4 text-white focus:border-gold-500 outline-none transition-all"
                  placeholder="Enter phone or email"
                  required
                />
              </div>

              <div className="flex bg-dark-900 p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setLoginMode('password')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${loginMode === 'password' ? 'bg-dark-700 text-white shadow-sm' : 'text-gray-500'}`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMode('pin')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${loginMode === 'pin' ? 'bg-dark-700 text-white shadow-sm' : 'text-gray-500'}`}
                >
                  PIN
                </button>
              </div>

              <div>
                {loginMode === 'password' ? (
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-dark-900 border border-white/5 rounded-xl p-4 text-white focus:border-gold-500 outline-none"
                    placeholder="••••••••"
                    required
                  />
                ) : (
                  <input
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full bg-dark-900 border border-white/5 rounded-xl p-4 text-white focus:border-gold-500 outline-none"
                    placeholder="3-digit PIN"
                    required
                  />
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold-500 text-black font-black py-4 rounded-xl hover:bg-gold-400 transition-all shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? 'Processing...' : 'Sign In Now'}
                <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-dark-900 border border-white/5 rounded-xl p-4 text-white focus:border-gold-500 outline-none"
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Mobile Number</label>
                <input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-dark-900 border border-white/5 rounded-xl p-4 text-white focus:border-gold-500 outline-none"
                  placeholder="e.g. 072 123 4567"
                  required
                />
              </div>
              <div className="flex items-center gap-3 p-4 bg-gold-500/5 border border-gold-500/20 rounded-2xl">
                <ShieldCheck size={20} className="text-gold-500 shrink-0" />
                <p className="text-[10px] text-gray-400 leading-relaxed uppercase font-bold tracking-wider">
                  By signing up, you confirm you are 21 or older and agree to our membership terms.
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-black py-4 rounded-xl hover:bg-gray-100 transition-all shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? 'Registering...' : 'Complete Registration'}
                <Sparkles size={18} />
              </button>
            </form>
          )}

          {authMessage && (
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm text-center font-bold animate-pulse">
              {authMessage}
            </div>
          )}
          
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-gray-500 text-xs">Forgot your credentials? Contact <span className="text-white">support@royalsmoke.co.za</span></p>
          </div>
        </div>
      </div>
    );
  }

  // Logged in view remains mostly same but polished
  const lastOrder = orders.length > 0 ? orders[0] : null;
  const recommendedProducts = allProducts
    .filter(p => !String(p.id).startsWith('membership-') && p.category !== 'Membership')
    .sort((a, b) => b.stock_qty - a.stock_qty)
    .slice(0, 4);

  return (
    <div className="max-w-6xl mx-auto py-8 lg:py-12 px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl lg:text-5xl font-serif text-white mb-2">Welcome Back, {customer.name} 👑</h1>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-gold-500 text-black text-[10px] font-black uppercase rounded">Royal Member</span>
            <p className="text-gray-500 font-medium tracking-wide">Membership Dashboard</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="self-start px-6 py-2 border border-white/10 rounded-full text-sm font-bold text-gray-400 hover:text-white hover:border-white/30 transition-all"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
          {/* Profile Card */}
          <div className="bg-dark-800 border border-white/5 rounded-3xl p-8 relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 blur-[80px] rounded-full -mr-16 -mt-16 group-hover:bg-gold-500/10 transition-colors"></div>
            <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-2">Member Profile</h2>
            <div className="space-y-4 text-sm">
              <div><span className="text-gray-500 text-[10px] uppercase font-black">Name</span><div className="text-white text-lg font-bold">{customer.name}</div></div>
              <div><span className="text-gray-500 text-[10px] uppercase font-black">Verified At</span><div className="text-white">{customer.email || customer.phone}</div></div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/5">
              <Link to="/dispensary" className="flex items-center justify-center gap-2 w-full bg-green-600 text-white font-black py-4 rounded-2xl hover:bg-green-500 transition shadow-lg shadow-green-600/20">
                <Leaf size={18} />
                Access Dispensary
              </Link>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          {lastOrder && (
            <div className="bg-white text-black rounded-3xl p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="text-xs font-black uppercase tracking-widest text-gray-400">Order #{lastOrder.id}</div>
                <h2 className="text-2xl font-serif font-black">Pick up where you left off.</h2>
              </div>
              <button 
                onClick={() => { try { JSON.parse(lastOrder.items || '[]').forEach(i => addToCart(i)); navigate('/cart'); } catch { alert('Reorder failed'); } }}
                className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 transition active:scale-95 flex items-center gap-2"
              >
                <RefreshCcw size={18} />
                One-Click Reorder
              </button>
            </div>
          )}

          <div className="bg-dark-800 border border-white/5 rounded-3xl p-8 shadow-xl">
            <h2 className="text-xl font-serif text-white mb-6">Recent Deliveries</h2>
            {loading ? <div className="text-center py-12 animate-pulse">Fetching records...</div> : orders.length === 0 ? <div className="text-center py-12 text-gray-600">No history found.</div> : (
              <div className="space-y-4">
                {orders.map(o => (
                  <div key={o.id} className="bg-dark-900 border border-white/5 rounded-2xl p-6 flex items-center justify-between">
                    <div>
                      <div className="text-white font-bold">Order #{o.id}</div>
                      <div className="text-xs text-gray-500">{o.created_at}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-serif">R {Number(o.total_amount).toFixed(2)}</div>
                      <div className="text-[10px] text-gold-500 uppercase font-black">{o.status}</div>
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
