import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Package, TrendingUp, DollarSign, RefreshCw, Plus, LogOut, Store, AlertTriangle, CheckCircle, XCircle, Users, ShoppingCart, Zap } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const StoreDashboard = () => {
    const [store, setStore] = useState(null);
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '', owner_name: '', email: '', phone: '', password: '',
        address: '', city: '', postal_code: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('inventory');
    const [inventory, setInventory] = useState([]);
    const [stats, setStats] = useState(null);
    const [newProduct, setNewProduct] = useState({
        product_name: '', description: '', category: 'Premium Cigars',
        image_url: '', store_cost_price: '', stock_qty: ''
    });
    const [cart, setCart] = useState([]);

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const discountThreshold = 5000;
    const progressToDiscount = Math.min((cartTotal / discountThreshold) * 100, 100);
    const amountToDiscount = Math.max(discountThreshold - cartTotal, 0);

    useEffect(() => {
        const storedStore = localStorage.getItem('store');
        if (storedStore) {
            const parsed = JSON.parse(storedStore);
            setStore(parsed);
            fetchDashboardData(parsed.id);
        }
    }, []);

    const fetchDashboardData = async (storeId) => {
        if (!storeId) storeId = store?.id;
        if (!storeId) return;

        setLoading(true);
        try {
            const [inventoryRes, statsRes] = await Promise.all([
                axios.get(`${API}/stores/${storeId}/inventory`),
                axios.get(`${API}/stores/${storeId}/stats`)
            ]);
            setInventory(inventoryRes.data || []);
            setStats(statsRes.data || null);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                const res = await axios.post(`${API}/stores/login`, {
                    email: formData.email,
                    password: formData.password
                });
                setStore(res.data.store);
                localStorage.setItem('store', JSON.stringify(res.data.store));
                fetchDashboardData(res.data.store.id);
            } else {
                await axios.post(`${API}/stores/register`, formData);
                setError('Registration successful! Awaiting admin approval. You can login once approved.');
                setIsLogin(true);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Authentication failed');
        }
    };

    const handleSubmitProduct = async (e) => {
        e.preventDefault();
        try {
            const productData = {
                product_name: newProduct.product_name,
                description: newProduct.description,
                category: newProduct.category,
                image_url: newProduct.image_url || null,
                store_cost_price: parseFloat(newProduct.store_cost_price),
                stock_qty: parseInt(newProduct.stock_qty)
            };

            if (newProduct.id) {
                await axios.put(`${API}/stores/${store.id}/inventory/${newProduct.id}`, productData);
                alert('Product updated! Awaiting admin re-approval.');
            } else {
                await axios.post(`${API}/stores/${store.id}/inventory`, productData);
                alert('Product submitted for admin approval!');
            }

            setNewProduct({ product_name: '', description: '', category: 'Premium Cigars', image_url: '', store_cost_price: '', stock_qty: '' });
            setActiveTab('inventory');
            fetchDashboardData();
        } catch (err) {
            alert('Failed to submit product: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('store');
        setStore(null);
        setInventory([]);
        setStats(null);
    };

    const updateStockQty = async (productId, qty) => {
        try {
            await axios.patch(`${API}/stores/${store.id}/inventory/${productId}/stock`, { stock_qty: parseInt(qty) });
            fetchDashboardData();
        } catch (err) {
            alert('Failed to update stock');
        }
    };

    if (!store) {
        return (
            <div className="min-h-screen bg-dark-900 p-4">
                <div className="max-w-6xl mx-auto">
                    {/* Hero Section */}
                    <div className="text-center mb-12 pt-8">
                        <Store className="w-16 h-16 text-gold-500 mx-auto mb-4" />
                        <h1 className="text-4xl md:text-5xl font-serif text-white mb-4">Become a RoyalSmoke Partner</h1>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto">Join South Africa's fastest-growing premium cigar network</p>
                    </div>

                    {/* Value Proposition */}
                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-dark-800 border border-gold-500/30 rounded-lg p-6">
                            <div className="w-12 h-12 bg-gold-500/20 rounded-full flex items-center justify-center mb-4">
                                <TrendingUp className="text-gold-500" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Free Marketing</h3>
                            <p className="text-gray-400">We handle all advertising and customer acquisition. You just fulfill orders from your existing inventory.</p>
                        </div>

                        <div className="bg-dark-800 border border-gold-500/30 rounded-lg p-6">
                            <div className="w-12 h-12 bg-gold-500/20 rounded-full flex items-center justify-center mb-4">
                                <Package className="text-gold-500" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Smart Fulfillment</h3>
                            <p className="text-gray-400">Orders automatically route to the nearest store. No shipping hassles, just local pickup or short delivery.</p>
                        </div>

                        <div className="bg-dark-800 border border-gold-500/30 rounded-lg p-6">
                            <div className="w-12 h-12 bg-gold-500/20 rounded-full flex items-center justify-center mb-4">
                                <Users className="text-gold-500" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">100+ Ready Clients</h3>
                            <p className="text-gray-400">Access our established customer base of premium cigar enthusiasts actively placing orders.</p>
                        </div>
                    </div>

                    {/* How It Works */}
                    <div className="bg-dark-800 border border-gray-700 rounded-xl p-8 mb-12">
                        <h2 className="text-2xl font-serif text-white mb-6 text-center">How the Partnership Works</h2>
                        <div className="grid md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-blue-400 font-bold text-xl">1</span>
                                </div>
                                <h4 className="font-bold text-white mb-2">List Your Products</h4>
                                <p className="text-sm text-gray-400">Add your inventory with your cost prices. We handle the retail pricing.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-blue-400 font-bold text-xl">2</span>
                                </div>
                                <h4 className="font-bold text-white mb-2">We Drive Sales</h4>
                                <p className="text-sm text-gray-400">Our marketing brings customers to your products automatically.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-blue-400 font-bold text-xl">3</span>
                                </div>
                                <h4 className="font-bold text-white mb-2">Fulfill Orders</h4>
                                <p className="text-sm text-gray-400">When nearby customers order, you fulfill from your store.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <span className="text-blue-400 font-bold text-xl">4</span>
                                </div>
                                <h4 className="font-bold text-white mb-2">Get Paid</h4>
                                <p className="text-sm text-gray-400">Track earnings and receive payouts for completed orders.</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-gradient-to-r from-gold-500/10 to-gold-600/10 border border-gold-500/30 rounded-xl p-8 mb-12">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className="text-3xl md:text-4xl font-bold text-gold-500 mb-1">100+</div>
                                <div className="text-sm text-gray-400">Active Customers</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl md:text-4xl font-bold text-gold-500 mb-1">24/7</div>
                                <div className="text-sm text-gray-400">Online Storefront</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl md:text-4xl font-bold text-gold-500 mb-1">R49</div>
                                <div className="text-sm text-gray-400">Per Month*</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl md:text-4xl font-bold text-gold-500 mb-1">Same Day</div>
                                <div className="text-sm text-gray-400">Approval Process</div>
                            </div>
                        </div>
                        <p className="text-center text-xs text-gray-500 mt-6">
                            * R49/month platform fee covers advertising costs to bring you customers. We don't profit from this – it goes directly into marketing your products to our 100+ active buyers.
                        </p>
                    </div>

                    {/* Login/Register Form */}
                    <div className="bg-dark-800 border border-gold-500/30 rounded-xl p-8 max-w-md mx-auto">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-serif text-white">Get Started Today</h2>
                            <p className="text-gray-400 text-sm mt-2">Join our network of premium cigar distributors</p>
                        </div>

                        <div className="flex mb-6">
                            <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 text-center ${isLogin ? 'bg-gold-500 text-black' : 'bg-dark-900 text-gray-400'} rounded-l font-semibold`}>Login</button>
                            <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 text-center ${!isLogin ? 'bg-gold-500 text-black' : 'bg-dark-900 text-gray-400'} rounded-r font-semibold`}>Register</button>
                        </div>

                        {error && <div className={`p-3 rounded mb-4 text-sm ${error.includes('successful') ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{error}</div>}

                        <form onSubmit={handleAuth} className="space-y-4">
                            {!isLogin && (
                                <>
                                    <input type="text" placeholder="Store Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-dark-900 border border-gray-700 rounded px-4 py-2 text-white" required />
                                    <input type="text" placeholder="Owner Name" value={formData.owner_name} onChange={e => setFormData({ ...formData, owner_name: e.target.value })} className="w-full bg-dark-900 border border-gray-700 rounded px-4 py-2 text-white" required />
                                    <input type="tel" placeholder="Phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-dark-900 border border-gray-700 rounded px-4 py-2 text-white" required />
                                    <input type="text" placeholder="Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full bg-dark-900 border border-gray-700 rounded px-4 py-2 text-white" required />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input type="text" placeholder="City" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="bg-dark-900 border border-gray-700 rounded px-4 py-2 text-white" required />
                                        <input type="text" placeholder="Postal Code" value={formData.postal_code} onChange={e => setFormData({ ...formData, postal_code: e.target.value })} className="bg-dark-900 border border-gray-700 rounded px-4 py-2 text-white" />
                                    </div>
                                </>
                            )}
                            <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-dark-900 border border-gray-700 rounded px-4 py-2 text-white" required />
                            <input type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full bg-dark-900 border border-gray-700 rounded px-4 py-2 text-white" required />
                            <button type="submit" className="w-full bg-gold-500 text-black font-bold py-3 rounded hover:bg-gold-400 transition">{isLogin ? 'Login' : 'Register Store'}</button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    const pendingProducts = inventory.filter(p => !p.admin_approved);
    const approvedProducts = inventory.filter(p => p.admin_approved);

    const addToCart = (product) => {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            setCart(cart.map(item =>
                item.id === product.id ? { ...item, qty: item.qty + 1 } : item
            ));
        } else {
            setCart([...cart, { ...product, qty: 1 }]);
        }
    };

    return (
        <div className="min-h-screen bg-dark-900 p-4">
            {/* Floating Cart Widget */}
            {cart.length > 0 && (
                <div className="fixed bottom-6 right-6 bg-dark-800 border-2 border-gold-500 rounded-xl p-4 shadow-2xl z-50 min-w-[280px]">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="text-gold-500" size={20} />
                            <span className="text-white font-bold">Cart Total</span>
                        </div>
                        <span className="text-2xl font-bold text-gold-500">R{cartTotal.toFixed(0)}</span>
                    </div>

                    {cartTotal < discountThreshold && (
                        <>
                            <div className="mb-2">
                                <div className="w-full bg-dark-900 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-gold-500 to-green-500 h-full transition-all duration-300"
                                        style={{ width: `${progressToDiscount}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <Zap className="text-green-400" size={14} />
                                <span className="text-gray-300">
                                    <span className="text-green-400 font-bold">R{amountToDiscount.toFixed(0)}</span> away from <span className="text-gold-400 font-bold">20% bulk discount!</span>
                                </span>
                            </div>
                        </>
                    )}

                    {cartTotal >= discountThreshold && (
                        <div className="flex items-center gap-2 bg-green-900/30 text-green-400 px-3 py-2 rounded-lg text-sm font-bold">
                            <Zap size={16} />
                            20% Discount Applied! 🎉
                        </div>
                    )}

                    <div className="text-xs text-gray-500 mt-2 text-center">
                        {cart.length} item{cart.length !== 1 ? 's' : ''} in cart
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-serif text-white">{store.name}</h1>
                        <p className="text-gray-400">{store.address}, {store.city}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={fetchDashboardData} className="p-2 bg-dark-800 rounded hover:bg-dark-700 text-gold-500">
                            <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
                        </button>
                        <button onClick={handleLogout} className="p-2 bg-dark-800 rounded hover:bg-dark-700 text-red-400">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>

                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-dark-800 p-4 rounded-lg border border-gray-700">
                            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1"><Package size={16} /> Total Products</div>
                            <p className="text-2xl font-bold text-white">{inventory.length}</p>
                            <p className="text-xs text-gray-500">{approvedProducts.length} approved</p>
                        </div>
                        <div className="bg-dark-800 p-4 rounded-lg border border-gray-700">
                            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1"><DollarSign size={16} /> Pending Payout</div>
                            <p className="text-2xl font-bold text-gold-500">R {stats.pending_payout?.toLocaleString() || 0}</p>
                        </div>
                        <div className="bg-dark-800 p-4 rounded-lg border border-gray-700">
                            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1"><TrendingUp size={16} /> Total Earned</div>
                            <p className="text-2xl font-bold text-green-500">R {stats.total_earned?.toLocaleString() || 0}</p>
                            <p className="text-xs text-gray-500">{stats.items_sold || 0} items sold</p>
                        </div>
                        <div className="bg-dark-800 p-4 rounded-lg border border-gray-700">
                            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1"><Package size={16} /> Stock Value</div>
                            <p className="text-2xl font-bold text-white">R {stats.inventory_value?.toLocaleString() || 0}</p>
                            {approvedProducts.filter(p => p.stock_qty < 5).length > 0 && (
                                <p className="text-xs text-red-400 mt-1">⚠️ {approvedProducts.filter(p => p.stock_qty < 5).length} low stock</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="flex gap-2 border-b border-gray-700 pb-2">
                    <button onClick={() => setActiveTab('inventory')} className={`px-4 py-2 rounded-t ${activeTab === 'inventory' ? 'bg-gold-500 text-black' : 'bg-dark-800 text-gray-400'}`}>
                        My Products ({inventory.length})
                    </button>
                    <button onClick={() => setActiveTab('submit')} className={`px-4 py-2 rounded-t ${activeTab === 'submit' ? 'bg-gold-500 text-black' : 'bg-dark-800 text-gray-400'}`}>
                        Submit New Product
                    </button>
                </div>

                {/* Submit New Product Tab */}
                {activeTab === 'submit' && (
                    <div className="bg-dark-800 rounded-lg border border-gray-700 p-6">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Plus className="text-gold-500" /> {newProduct.id ? 'Edit Product' : 'Submit Product for Approval'}</h2>
                        <form onSubmit={handleSubmitProduct} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Product Name *</label>
                                    <input
                                        type="text"
                                        value={newProduct.product_name}
                                        onChange={e => setNewProduct({ ...newProduct, product_name: e.target.value })}
                                        className="w-full bg-dark-900 border border-gray-600 rounded px-4 py-2 text-white"
                                        required
                                        placeholder="e.g., Cohiba Robusto"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Category *</label>
                                    <select
                                        value={newProduct.category}
                                        onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                                        className="w-full bg-dark-900 border border-gray-600 rounded px-4 py-2 text-white"
                                    >
                                        <option value="Premium Cigars">Premium Cigars</option>
                                        <option value="Cubans">Cubans</option>
                                        <option value="Non-Cubans">Non-Cubans</option>
                                        <option value="Combos">Combos</option>
                                        <option value="Accessories">Accessories</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Description</label>
                                <textarea
                                    value={newProduct.description}
                                    onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                                    className="w-full bg-dark-900 border border-gray-600 rounded px-4 py-2 text-white"
                                    rows="3"
                                    placeholder="Describe your product..."
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Your Cost Price (R) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newProduct.store_cost_price}
                                        onChange={e => setNewProduct({ ...newProduct, store_cost_price: e.target.value })}
                                        className="w-full bg-dark-900 border border-gray-600 rounded px-4 py-2 text-white"
                                        required
                                        placeholder="450.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Stock Quantity *</label>
                                    <input
                                        type="number"
                                        value={newProduct.stock_qty}
                                        onChange={e => setNewProduct({ ...newProduct, stock_qty: e.target.value })}
                                        className="w-full bg-dark-900 border border-gray-600 rounded px-4 py-2 text-white"
                                        required
                                        placeholder="10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-2">Image URL (optional)</label>
                                    <input
                                        type="url"
                                        value={newProduct.image_url}
                                        onChange={e => setNewProduct({ ...newProduct, image_url: e.target.value })}
                                        className="w-full bg-dark-900 border border-gray-600 rounded px-4 py-2 text-white"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-gold-500 text-black font-bold py-3 rounded hover:bg-gold-400 transition">
                                {newProduct.id ? 'Update Product' : 'Submit for Approval'}
                            </button>
                        </form>
                    </div>
                )}

                {/* My Products Tab */}
                {activeTab === 'inventory' && (
                    <div className="space-y-6">
                        {/* Pending Products */}
                        {pendingProducts.length > 0 && (
                            <div className="bg-dark-800 rounded-lg border border-gray-700">
                                <div className="p-4 border-b border-gray-700 flex items-center gap-2">
                                    <AlertTriangle className="text-yellow-500" size={18} />
                                    <h3 className="text-lg font-bold text-white">Pending Approval ({pendingProducts.length})</h3>
                                </div>
                                <div className="divide-y divide-gray-700">
                                    {pendingProducts.map(item => (
                                        <div key={item.id} className="p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-white font-medium">{item.product_name}</p>
                                                    <p className="text-sm text-gray-400">{item.category} • Cost: R{item.store_cost_price} • Stock: {item.stock_qty}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setNewProduct({
                                                                id: item.id,
                                                                product_name: item.product_name,
                                                                description: item.description || '',
                                                                category: item.category,
                                                                image_url: item.image_url || '',
                                                                store_cost_price: item.store_cost_price,
                                                                stock_qty: item.stock_qty
                                                            });
                                                            setActiveTab('submit');
                                                        }}
                                                        className="text-blue-400 hover:text-blue-300 text-sm"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm('Delete this product submission?')) {
                                                                try {
                                                                    await axios.delete(`${API}/stores/${store.id}/inventory/${item.id}`);
                                                                    fetchDashboardData();
                                                                } catch (err) {
                                                                    alert('Failed to delete');
                                                                }
                                                            }
                                                        }}
                                                        className="text-red-400 hover:text-red-300 text-sm"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 rounded text-xs bg-yellow-900/30 text-yellow-400 inline-block mt-2">Awaiting Admin</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Approved Products */}
                        {approvedProducts.length > 0 && (
                            <div className="bg-dark-800 rounded-lg border border-gray-700">
                                <div className="p-4 border-b border-gray-700 flex items-center gap-2">
                                    <CheckCircle className="text-green-500" size={18} />
                                    <h3 className="text-lg font-bold text-white">Approved Products ({approvedProducts.length})</h3>
                                </div>
                                <div className="divide-y divide-gray-700">
                                    {approvedProducts.map(item => (
                                        <div key={item.id} className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="text-white font-medium">{item.product_name}</p>
                                                    <p className="text-sm text-gray-400">{item.category}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Your Cost: R{item.store_cost_price} • Retail: <span className="text-gold-500">R{item.admin_final_price}</span> • Margin: {item.admin_profit_margin}%
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <label className="text-xs text-gray-400 block mb-1">Stock Qty</label>
                                                    <input
                                                        type="number"
                                                        defaultValue={item.stock_qty}
                                                        onBlur={(e) => updateStockQty(item.id, e.target.value)}
                                                        className="w-20 bg-dark-900 border border-gray-600 rounded px-2 py-1 text-center text-white"
                                                    />
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 rounded text-xs bg-green-900/30 text-green-400">Live on Site</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {inventory.length === 0 && (
                            <div className="bg-dark-800 rounded-lg border border-gray-700 p-12 text-center">
                                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400 mb-4">No products yet. Start by submitting your first product!</p>
                                <button onClick={() => setActiveTab('submit')} className="bg-gold-500 text-black px-6 py-2 rounded font-bold hover:bg-gold-400">
                                    Submit Product
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StoreDashboard;
