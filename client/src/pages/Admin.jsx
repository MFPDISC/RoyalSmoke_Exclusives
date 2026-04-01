import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { RefreshCw, Package, DollarSign, Store, CheckCircle, XCircle, MapPin, Users, Truck, TrendingUp, Lock, LogOut, ShoppingBag, CreditCard, Crown, Download, AlertTriangle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const ADMIN_PIN = 'royal2024'; // Change this to your secure PIN

const Admin = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState('');
    const [stats, setStats] = useState(null);
    const [products, setProducts] = useState([]);
    const [stores, setStores] = useState([]);
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [vipMembers, setVipMembers] = useState([]);
    const [vipStats, setVipStats] = useState(null);
    const [pendingProducts, setPendingProducts] = useState([]);
    const [approvedProducts, setApprovedProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [bulkMargin, setBulkMargin] = useState(60);
    const [activeTab, setActiveTab] = useState('overview');
    const [refreshing, setRefreshing] = useState(false);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [showAddCustomer, setShowAddCustomer] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', description: '', price_zar: '', stock_qty: '', category: 'Cubans', image_url: '' });
    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });

    useEffect(() => {
        const saved = sessionStorage.getItem('royalsmoke_admin');
        if (saved === 'true') setIsAuthenticated(true);
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        if (pin === ADMIN_PIN) {
            setIsAuthenticated(true);
            sessionStorage.setItem('royalsmoke_admin', 'true');
        } else {
            alert('Invalid PIN');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem('royalsmoke_admin');
    };

    const fetchData = async () => {
        setRefreshing(true);
        try {
            const [prodRes, finRes, storesRes, ordersRes, customersRes, vipRes, pendingRes, approvedRes] = await Promise.all([
                axios.get(`${API}/products`),
                axios.get(`${API}/financials`),
                axios.get(`${API}/stores`),
                axios.get(`${API}/orders`),
                axios.get(`${API}/customers`),
                axios.get(`${API}/vip/members`),
                axios.get(`${API}/inventory/admin/products/pending`),
                axios.get(`${API}/inventory/admin/products/approved`)
            ]);
            setProducts(prodRes.data);
            setStats(finRes.data);
            setStores(storesRes.data);
            setOrders(ordersRes.data || []);
            setCustomers(customersRes.data || []);
            setVipMembers(vipRes.data?.members || []);
            setVipStats(vipRes.data?.stats || null);
            setPendingProducts(pendingRes.data || []);
            setApprovedProducts(approvedRes.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setRefreshing(false);
        }
    };

    const refreshUberStatus = async (orderId) => {
        try {
            await axios.get(`${API}/orders/${orderId}/uber-status`);
            fetchData();
        } catch (error) {
            console.error('Failed to refresh Uber status:', error);
        }
    };

    const approveStore = async (storeId) => {
        try {
            await axios.patch(`${API}/stores/${storeId}/approve`);
            fetchData();
        } catch (error) {
            alert('Failed to approve store');
        }
    };

    const toggleStoreActive = async (storeId) => {
        try {
            await axios.patch(`${API}/stores/${storeId}/toggle-active`);
            fetchData();
        } catch (error) {
            alert('Failed to toggle store status');
        }
    };

    const updateOrderStatus = async (orderId, status) => {
        try {
            await axios.patch(`${API}/orders/${orderId}/status`, { status });
            fetchData();
        } catch (error) {
            alert('Failed to update order');
        }
    };

    useEffect(() => {
        if (isAuthenticated) fetchData();
    }, [isAuthenticated]);

    const updateStock = async (id, newStock) => {
        try {
            await axios.post(`${API}/products/${id}/stock`, { stock_qty: parseInt(newStock) });
            fetchData();
        } catch (error) {
            alert('Failed to update stock');
        }
    };

    const addProduct = async (e) => {
        e.preventDefault();
        if (!newProduct.name || !newProduct.price_zar || !newProduct.stock_qty) {
            alert('Please fill in name, price, and stock');
            return;
        }
        try {
            await axios.post(`${API}/products`, {
                ...newProduct,
                price_zar: parseFloat(newProduct.price_zar),
                stock_qty: parseInt(newProduct.stock_qty)
            });
            setNewProduct({ name: '', description: '', price_zar: '', stock_qty: '', category: 'Cubans', image_url: '' });
            setShowAddProduct(false);
            fetchData();
        } catch (error) {
            alert('Failed to add product');
        }
    };

    const addCustomer = async (e) => {
        e.preventDefault();
        if (!newCustomer.name || !newCustomer.phone) {
            alert('Name and Phone are required');
            return;
        }
        try {
            await axios.post(`${API}/customers`, newCustomer);
            setNewCustomer({ name: '', phone: '', email: '', address: '' });
            setShowAddCustomer(false);
            fetchData();
            alert('Customer added and synced to GHL!');
        } catch (error) {
            alert('Failed to add customer: ' + (error.response?.data?.error || error.message));
        }
    };

    const deleteProduct = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await axios.delete(`${API}/products/${id}`);
            fetchData();
        } catch (error) {
            alert('Failed to delete product');
        }
    };

    const handleBulkApprove = async () => {
        if (selectedProducts.length === 0) {
            alert('No products selected');
            return;
        }

        if (!confirm(`Approve ${selectedProducts.length} products with ${bulkMargin}% margin?`)) {
            return;
        }

        try {
            await Promise.all(
                selectedProducts.map(id =>
                    axios.patch(`${API}/inventory/admin/products/${id}/approve`, {
                        profit_margin: bulkMargin
                    })
                )
            );
            setSelectedProducts([]);
            fetchData();
            alert(`${selectedProducts.length} products approved!`);
        } catch (err) {
            alert('Failed to bulk approve: ' + err.message);
        }
    };

    const exportProductsCSV = () => {
        const csv = [
            ['Product', 'Store', 'Category', 'Cost Price', 'Margin %', 'Retail Price', 'Stock', 'Status'],
            ...approvedProducts.map(p => [
                p.product_name,
                p.store_name,
                p.category,
                p.store_cost_price,
                p.admin_profit_margin,
                p.admin_final_price,
                p.stock_qty,
                'Approved'
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `royalsmoke-products-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const exportStoresCSV = () => {
        const csv = [
            ['Store Name', 'Owner', 'Email', 'Phone', 'City', 'Status', 'Approved'],
            ...stores.map(s => [
                s.name,
                s.owner_name,
                s.email,
                s.phone,
                s.city,
                s.is_active ? 'Active' : 'Inactive',
                s.is_approved ? 'Yes' : 'Pending'
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `royalsmoke-stores-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // Calculate metrics
    const totalStock = products.reduce((sum, p) => sum + p.stock_qty, 0);
    const lowStockCount = products.filter(p => p.stock_qty < 5).length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const pendingStoresCount = stores.filter(s => !s.is_approved).length;
    const activeStores = stores.filter(s => s.is_active && s.is_approved).length;

    if (!isAuthenticated) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="bg-dark-800 border border-gold-500/30 rounded-xl p-8 w-full max-w-sm">
                    <div className="text-center mb-6">
                        <Lock className="w-12 h-12 text-gold-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-serif text-white">Super Admin</h1>
                        <p className="text-gray-400 text-sm">RoyalSmoke Owner Access</p>
                    </div>
                    <form onSubmit={handleLogin}>
                        <input
                            type="password"
                            value={pin}
                            onChange={e => setPin(e.target.value)}
                            placeholder="Enter Admin PIN"
                            className="w-full bg-dark-900 border border-gray-700 rounded p-3 text-white text-center mb-4 focus:border-gold-500 outline-none"
                        />
                        <button type="submit" className="w-full bg-gold-500 text-black font-bold py-3 rounded hover:bg-gold-400">
                            Access Dashboard
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-serif text-white">Super Admin Dashboard</h1>
                    <p className="text-gray-400 text-sm">RoyalSmoke Command Center</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchData} className="p-2 bg-dark-800 rounded hover:bg-dark-700 text-gold-500">
                        <RefreshCw className={refreshing ? 'animate-spin' : ''} size={20} />
                    </button>
                    <button onClick={handleLogout} className="p-2 bg-dark-800 rounded hover:bg-dark-700 text-red-400">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 border-b border-gray-700 pb-2">
                {['overview', 'product-approvals', 'orders', 'inventory', 'stores', 'customers', 'vip'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-t capitalize ${activeTab === tab ? 'bg-gold-500 text-black' : 'bg-dark-800 text-gray-400'} ${tab === 'vip' ? 'flex items-center gap-2' : ''}`}>
                        {tab === 'vip' && <Crown size={16} />}
                        {tab.replace('-', ' ')}
                        {tab === 'orders' && pendingOrders > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 rounded-full">{pendingOrders}</span>}
                        {tab === 'stores' && pendingStoresCount > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 rounded-full">{pendingStoresCount}</span>}
                        {tab === 'product-approvals' && pendingProducts.length > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 rounded-full">{pendingProducts.length}</span>}
                    </button>
                ))}
            </div>

            {/* Overview Dashboard */}
            {activeTab === 'overview' && (
                <>
                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-dark-800 p-4 rounded-lg border border-gray-700">
                            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1"><DollarSign size={16} /> Revenue</div>
                            <p className="text-2xl font-bold text-white">R {stats?.total_revenue?.toLocaleString() || 0}</p>
                        </div>
                        <div className="bg-dark-800 p-4 rounded-lg border border-gray-700">
                            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1"><ShoppingBag size={16} /> Orders</div>
                            <p className="text-2xl font-bold text-white">{orders.length}</p>
                            <p className="text-xs text-yellow-400">{pendingOrders} pending</p>
                        </div>
                        <div className="bg-dark-800 p-4 rounded-lg border border-gray-700">
                            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1"><Users size={16} /> Customers</div>
                            <p className="text-2xl font-bold text-white">{customers.length}</p>
                        </div>
                        <div className="bg-dark-800 p-4 rounded-lg border border-gray-700">
                            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1"><Store size={16} /> Partner Stores</div>
                            <p className="text-2xl font-bold text-white">{activeStores}</p>
                            <p className="text-xs text-gray-500">{stores.length} total</p>
                            {pendingStoresCount > 0 && <p className="text-xs text-yellow-500 font-bold mt-0.5">{pendingStoresCount} Approval Pending</p>}
                        </div>
                    </div>

                    {/* Financial Health */}
                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-dark-800 p-6 rounded-lg border border-gray-700">
                                <h3 className="text-gray-400 mb-2">Break-even Progress</h3>
                                <div className="relative pt-1">
                                    <div className="flex mb-2 items-center justify-between">
                                        <span className="text-xs font-semibold text-gold-500">
                                            {Math.min(100, (stats.total_revenue / stats.target) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="overflow-hidden h-3 rounded bg-dark-900">
                                        <div style={{ width: `${Math.min(100, (stats.total_revenue / stats.target) * 100)}%` }} className="h-full bg-gold-500 transition-all duration-500"></div>
                                    </div>
                                    <p className="text-sm text-gray-400 mt-2">Target: R {stats.target.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className={`p-6 rounded-lg border ${stats.net_profit >= 0 ? 'bg-green-900/20 border-green-700' : 'bg-red-900/20 border-red-700'}`}>
                                <h3 className="text-gray-400 mb-1">Net Profit</h3>
                                <p className={`text-3xl font-bold ${stats.net_profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    R {stats.net_profit.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">After R16k fixed costs</p>
                            </div>
                            <div className="bg-dark-800 p-6 rounded-lg border border-gray-700">
                                <h3 className="text-gray-400 mb-1 flex items-center gap-2"><Package size={16} /> Inventory</h3>
                                <p className="text-3xl font-bold text-white">{totalStock} units</p>
                                {lowStockCount > 0 && <p className="text-xs text-red-400 mt-1">{lowStockCount} products low stock</p>}
                            </div>
                        </div>
                    )}

                    {/* Recent Orders */}
                    <div className="bg-dark-800 rounded-lg border border-gray-700">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Truck size={18} className="text-gold-500" /> Recent Orders</h2>
                        </div>
                        <div className="divide-y divide-gray-700 max-h-64 overflow-y-auto">
                            {orders.slice(0, 5).map(order => (
                                <div key={order.id} className="p-4 flex justify-between items-center">
                                    <div>
                                        <p className="text-white font-medium">Order #{order.id}</p>
                                        <p className="text-sm text-gray-400">{order.customer_name || 'Guest'} • {order.customer_phone}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gold-500 font-bold">R {order.total_amount}</p>
                                        <span className={`text-xs px-2 py-1 rounded ${order.status === 'delivered' ? 'bg-green-900/30 text-green-400' : order.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {orders.length === 0 && <p className="p-4 text-gray-500 text-center">No orders yet</p>}
                        </div>
                    </div>
                </>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
                <div className="bg-dark-800 rounded-lg border border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-700">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Truck className="text-gold-500" /> All Orders</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-gray-300">
                            <thead className="bg-dark-900 text-gray-500 text-sm uppercase">
                                <tr>
                                    <th className="p-4">ID</th>
                                    <th className="p-4">Customer</th>
                                    <th className="p-4">Address</th>
                                    <th className="p-4">Total</th>
                                    <th className="p-4">Uber Delivery</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {orders.length === 0 ? (
                                    <tr><td colSpan="7" className="p-8 text-center text-gray-500">No orders yet</td></tr>
                                ) : orders.map(order => (
                                    <tr key={order.id} className="hover:bg-dark-900/50">
                                        <td className="p-4 font-medium text-white">#{order.id}</td>
                                        <td className="p-4">
                                            <div className="text-white">{order.customer_name || 'Guest'}</div>
                                            <div className="text-xs text-gray-500">{order.customer_phone}</div>
                                        </td>
                                        <td className="p-4 text-sm max-w-xs truncate">{order.customer_address}</td>
                                        <td className="p-4 text-gold-500 font-bold">R {order.total_amount}</td>
                                        <td className="p-4">
                                            {order.uber_request_id ? (
                                                <div className="text-xs">
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <Truck size={12} className="text-blue-400" />
                                                        <span className={`px-1.5 py-0.5 rounded ${order.uber_status === 'completed' ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                                            {order.uber_status || 'requested'}
                                                        </span>
                                                    </div>
                                                    {order.uber_driver_name && <div className="text-gray-400">{order.uber_driver_name}</div>}
                                                    {order.uber_eta && <div className="text-gray-500">ETA: {order.uber_eta}min</div>}
                                                    <button onClick={() => refreshUberStatus(order.id)} className="text-gold-500 hover:text-gold-400 mt-1">
                                                        <RefreshCw size={10} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-gray-500 text-xs">No Uber</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs ${order.status === 'delivered' ? 'bg-green-900/30 text-green-400' : order.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' : order.status === 'dispatched' ? 'bg-blue-900/30 text-blue-400' : 'bg-purple-900/30 text-purple-400'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <select
                                                value={order.status}
                                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                className="bg-dark-900 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="paid">Paid</option>
                                                <option value="packing">Packing</option>
                                                <option value="dispatched">Dispatched</option>
                                                <option value="delivered">Delivered</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Inventory Management */}
            {activeTab === 'inventory' && (
                <div className="bg-dark-800 rounded-lg border border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Package className="text-gold-500" />
                            <h2 className="text-xl font-bold text-white">Inventory</h2>
                        </div>
                        <button onClick={() => setShowAddProduct(!showAddProduct)} className="bg-gold-500 text-black px-4 py-2 rounded font-bold hover:bg-gold-400 transition">
                            {showAddProduct ? 'Cancel' : '+ Add Product'}
                        </button>
                    </div>

                    {showAddProduct && (
                        <form onSubmit={addProduct} className="p-4 border-b border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <input type="text" placeholder="Product Name *" value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="bg-dark-900 border border-gray-600 rounded px-3 py-2 text-white" required />
                            <input type="number" placeholder="Price (ZAR) *" value={newProduct.price_zar} onChange={e => setNewProduct({ ...newProduct, price_zar: e.target.value })} className="bg-dark-900 border border-gray-600 rounded px-3 py-2 text-white" required />
                            <input type="number" placeholder="Stock Qty *" value={newProduct.stock_qty} onChange={e => setNewProduct({ ...newProduct, stock_qty: e.target.value })} className="bg-dark-900 border border-gray-600 rounded px-3 py-2 text-white" required />
                            <select value={newProduct.category} onChange={e => setNewProduct({ ...newProduct, category: e.target.value })} className="bg-dark-900 border border-gray-600 rounded px-3 py-2 text-white">
                                <option value="Cubans">Cubans</option>
                                <option value="Non-Cubans">Non-Cubans</option>
                                <option value="Combos">Combos</option>
                                <option value="Accessories">Accessories</option>
                            </select>
                            <input type="text" placeholder="Image URL" value={newProduct.image_url} onChange={e => setNewProduct({ ...newProduct, image_url: e.target.value })} className="bg-dark-900 border border-gray-600 rounded px-3 py-2 text-white" />
                            <input type="text" placeholder="Description" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} className="bg-dark-900 border border-gray-600 rounded px-3 py-2 text-white" />
                            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-500 transition">Save Product</button>
                        </form>
                    )}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-gray-300">
                            <thead className="bg-dark-900 text-gray-500 text-sm uppercase">
                                <tr>
                                    <th className="p-4">Product</th>
                                    <th className="p-4">Category</th>
                                    <th className="p-4">Price</th>
                                    <th className="p-4">Stock</th>
                                    <th className="p-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {products.map(product => (
                                    <tr key={product.id} className="hover:bg-dark-900/50">
                                        <td className="p-4 font-medium text-white">{product.name}</td>
                                        <td className="p-4 text-sm">{product.category}</td>
                                        <td className="p-4">R {product.price_zar}</td>
                                        <td className="p-4">
                                            <input
                                                type="number"
                                                defaultValue={product.stock_qty}
                                                onBlur={(e) => updateStock(product.id, e.target.value)}
                                                className="bg-dark-900 border border-gray-600 rounded w-20 px-2 py-1 text-center text-white focus:border-gold-500 outline-none"
                                            />
                                        </td>
                                        <td className="p-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                {product.stock_qty < 5 ? <span className="text-red-500">Low Stock</span> : <span className="text-green-400">OK</span>}
                                                <button onClick={() => deleteProduct(product.id)} className="text-red-400 hover:text-red-300 ml-2" title="Delete">
                                                    <XCircle size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Partner Stores Management */}
            {activeTab === 'stores' && (
                <div className="bg-dark-800 rounded-lg border border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-700 flex items-center gap-2">
                        <Store className="text-gold-500" />
                        <h2 className="text-xl font-bold text-white">Partner Stores</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-gray-300">
                            <thead className="bg-dark-900 text-gray-500 text-sm uppercase">
                                <tr>
                                    <th className="p-4">Store</th>
                                    <th className="p-4">Owner</th>
                                    <th className="p-4">Location</th>
                                    <th className="p-4">Contact</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {stores.length === 0 ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-gray-500">No partner stores yet</td></tr>
                                ) : stores.map(store => (
                                    <tr key={store.id} className="hover:bg-dark-900/50">
                                        <td className="p-4 font-medium text-white">{store.name}</td>
                                        <td className="p-4 text-sm">{store.owner_name}</td>
                                        <td className="p-4 text-sm">
                                            <div className="flex items-center gap-1">
                                                <MapPin size={14} className="text-gold-500" />
                                                {store.city}
                                            </div>
                                            <span className="text-xs text-gray-500">{store.address}</span>
                                        </td>
                                        <td className="p-4 text-sm">
                                            <div>{store.email}</div>
                                            <div className="text-gray-500">{store.phone}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`px-2 py-1 rounded text-xs inline-block w-fit ${store.is_approved ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                                                    {store.is_approved ? 'Approved' : 'Pending'}
                                                </span>
                                                <span className={`px-2 py-1 rounded text-xs inline-block w-fit ${store.is_active ? 'bg-blue-900/30 text-blue-400' : 'bg-red-900/30 text-red-400'}`}>
                                                    {store.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                {!store.is_approved && (
                                                    <button onClick={() => approveStore(store.id)} className="p-2 bg-green-900/30 text-green-400 rounded hover:bg-green-900/50" title="Approve">
                                                        <CheckCircle size={16} />
                                                    </button>
                                                )}
                                                <button onClick={() => toggleStoreActive(store.id)} className={`p-2 rounded ${store.is_active ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'}`} title={store.is_active ? 'Deactivate' : 'Activate'}>
                                                    {store.is_active ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Customers Tab */}
            {activeTab === 'customers' && (
                <div className="bg-dark-800 rounded-lg border border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users className="text-gold-500" />
                            <h2 className="text-xl font-bold text-white">Customers ({customers.length})</h2>
                        </div>
                        <button onClick={() => setShowAddCustomer(!showAddCustomer)} className="bg-gold-500 text-black px-4 py-2 rounded font-bold hover:bg-gold-400 transition">
                            {showAddCustomer ? 'Cancel' : '+ Add Customer'}
                        </button>
                    </div>

                    {showAddCustomer && (
                        <form onSubmit={addCustomer} className="p-4 border-b border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <input type="text" placeholder="Name *" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} className="bg-dark-900 border border-gray-600 rounded px-3 py-2 text-white" required />
                            <input type="text" placeholder="Phone *" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} className="bg-dark-900 border border-gray-600 rounded px-3 py-2 text-white" required />
                            <input type="email" placeholder="Email" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} className="bg-dark-900 border border-gray-600 rounded px-3 py-2 text-white" />
                            <input type="text" placeholder="Address" value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} className="bg-dark-900 border border-gray-600 rounded px-3 py-2 text-white" />
                            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-500 transition col-span-1 md:col-span-2 lg:col-span-4">Save & Sync to GHL</button>
                        </form>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-gray-300">
                            {/* ... existing table ... */}
                            <thead className="bg-dark-900 text-gray-500 text-sm uppercase">
                                <tr>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Phone</th>
                                    <th className="p-4">Email</th>
                                    <th className="p-4">Address</th>
                                    <th className="p-4">Orders</th>
                                    <th className="p-4">Total Spent</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {customers.length === 0 ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-gray-500">No customers yet</td></tr>
                                ) : customers.map(customer => (
                                    <tr key={customer.id} className="hover:bg-dark-900/50">
                                        <td className="p-4 font-medium text-white">{customer.name}</td>
                                        <td className="p-4 text-sm">{customer.phone}</td>
                                        <td className="p-4 text-sm text-gray-400">{customer.email || '-'}</td>
                                        <td className="p-4 text-sm max-w-xs truncate">{customer.address}</td>
                                        <td className="p-4 text-center">
                                            <span className="bg-dark-900 px-2 py-1 rounded text-gold-500">{customer.order_count}</span>
                                        </td>
                                        <td className="p-4 text-green-400 font-bold">R {customer.total_spent?.toLocaleString() || 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Product Approvals Tab */}
            {activeTab === 'product-approvals' && (
                <div className="space-y-6">
                    {/* Pending Products for Approval */}
                    <div className="bg-dark-800 rounded-lg border border-gray-700">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <AlertTriangle size={18} className="text-yellow-500" />
                                    Pending Product Approvals ({pendingProducts.length})
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">Review store submissions and set profit margins</p>
                            </div>
                            {selectedProducts.length > 0 && (
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-400">{selectedProducts.length} selected</span>
                                    <input
                                        type="number"
                                        value={bulkMargin}
                                        onChange={e => setBulkMargin(parseInt(e.target.value))}
                                        className="w-20 bg-dark-900 border border-gray-600 rounded px-2 py-1 text-center text-white text-sm"
                                        placeholder="Margin %"
                                    />
                                    <button
                                        onClick={handleBulkApprove}
                                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500 text-sm font-semibold"
                                    >
                                        Approve Selected ({bulkMargin}%)
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-gray-300">
                                <thead className="bg-dark-900 text-gray-500 text-sm uppercase">
                                    <tr>
                                        <th className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedProducts.length === pendingProducts.length && pendingProducts.length > 0}
                                                onChange={e => setSelectedProducts(e.target.checked ? pendingProducts.map(p => p.id) : [])}
                                                className="w-4 h-4 bg-dark-800 border-gray-600 rounded"
                                            />
                                        </th>
                                        <th className="p-4">Product</th>
                                        <th className="p-4">Store</th>
                                        <th className="p-4">Cost Price</th>
                                        <th className="p-4">Suggested Margin</th>
                                        <th className="p-4">Set Margin %</th>
                                        <th className="p-4">Preview Price</th>
                                        <th className="p-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {pendingProducts.length === 0 ? (
                                        <tr><td colSpan="7" className="p-8 text-center text-gray-500">No pending products</td></tr>
                                    ) : pendingProducts.map(product => {
                                        const [margin, setMargin] = React.useState(product.suggested_margin || 50);
                                        const previewPrice = Math.round(product.store_cost_price * (1 + margin / 100)) - (Math.round(product.store_cost_price * (1 + margin / 100)) % 2 === 0 ? 1 : 0);

                                        return (
                                            <tr key={product.id} className="hover:bg-dark-900/50">
                                                <td className="p-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedProducts.includes(product.id)}
                                                        onChange={e => {
                                                            if (e.target.checked) {
                                                                setSelectedProducts([...selectedProducts, product.id]);
                                                            } else {
                                                                setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                                                            }
                                                        }}
                                                        className="w-4 h-4 bg-dark-800 border-gray-600 rounded"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-medium text-white">{product.product_name}</div>
                                                    <div className="text-xs text-gray-500">{product.category}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm">{product.store_name}</div>
                                                    <div className="text-xs text-gray-500">{product.store_city}</div>
                                                </td>
                                                <td className="p-4 text-gray-300">R {product.store_cost_price?.toFixed(2)}</td>
                                                <td className="p-4">
                                                    <span className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded text-sm">
                                                        {product.suggested_margin}%
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <input
                                                        type="number"
                                                        value={margin}
                                                        onChange={(e) => setMargin(parseInt(e.target.value) || 0)}
                                                        className="w-20 bg-dark-900 border border-gray-600 rounded px-2 py-1 text-center text-white"
                                                        min="0"
                                                        max="200"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-gold-500 font-bold">R {previewPrice}</div>
                                                    <div className="text-xs text-gray-500">
                                                        Profit: R{(previewPrice - product.store_cost_price).toFixed(0)}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await axios.patch(`${API}/inventory/admin/products/${product.id}/approve`, {
                                                                    profit_margin: margin
                                                                });
                                                                fetchData();
                                                                alert('Product approved!');
                                                            } catch (err) {
                                                                alert('Failed to approve: ' + (err.response?.data?.error || err.message));
                                                            }
                                                        }}
                                                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-500 text-sm font-semibold"
                                                    >
                                                        Approve
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Approved Products - Pricing Management */}
                    <div className="bg-dark-800 rounded-lg border border-gray-700">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <CheckCircle size={18} className="text-green-500" />
                                    Approved Products ({approvedProducts.length})
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">Manage pricing for live products</p>
                            </div>
                            <button
                                onClick={exportProductsCSV}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 text-sm font-semibold flex items-center gap-2"
                            >
                                <Download size={16} />
                                Export CSV
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-gray-300">
                                <thead className="bg-dark-900 text-gray-500 text-sm uppercase">
                                    <tr>
                                        <th className="p-4">Product</th>
                                        <th className="p-4">Store</th>
                                        <th className="p-4">Cost</th>
                                        <th className="p-4">Current Margin</th>
                                        <th className="p-4">Retail Price</th>
                                        <th className="p-4">Stock</th>
                                        <th className="p-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {approvedProducts.length === 0 ? (
                                        <tr><td colSpan="7" className="p-8 text-center text-gray-500">No approved products yet</td></tr>
                                    ) : approvedProducts.map(product => (
                                        <tr key={product.id} className="hover:bg-dark-900/50">
                                            <td className="p-4">
                                                <div className="font-medium text-white">{product.product_name}</div>
                                                <div className="text-xs text-gray-500">{product.category}</div>
                                            </td>
                                            <td className="p-4 text-sm">{product.store_name}</td>
                                            <td className="p-4 text-gray-300">R {product.store_cost_price?.toFixed(2)}</td>
                                            <td className="p-4">
                                                <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded text-sm">
                                                    {product.admin_profit_margin}%
                                                </span>
                                            </td>
                                            <td className="p-4 text-gold-500 font-bold">R {product.admin_final_price}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs ${product.stock_qty < 5 ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
                                                    {product.stock_qty} units
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => {
                                                        const newMargin = prompt(`Current margin: ${product.admin_profit_margin}%\nEnter new profit margin %:`, product.admin_profit_margin);
                                                        if (newMargin !== null) {
                                                            axios.patch(`${API}/inventory/admin/products/${product.id}/pricing`, {
                                                                profit_margin: parseFloat(newMargin)
                                                            }).then(() => {
                                                                fetchData();
                                                                alert('Pricing updated!');
                                                            }).catch(err => alert('Failed: ' + err.message));
                                                        }
                                                    }}
                                                    className="text-blue-400 hover:text-blue-300 text-sm"
                                                >
                                                    Adjust Price
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* VIP Members Tab */}
            {activeTab === 'vip' && (
                <div className="space-y-6">
                    {/* VIP Stats */}
                    {vipStats && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 p-6 rounded-lg">
                                <div className="flex items-center gap-2 text-purple-300 text-sm mb-1"><Crown size={16} /> Total VIPs</div>
                                <p className="text-3xl font-bold text-white">{vipStats.total_vips}</p>
                            </div>
                            <div className="bg-dark-800 p-6 rounded-lg border border-gray-700">
                                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1"><DollarSign size={16} /> Monthly Recurring</div>
                                <p className="text-3xl font-bold text-green-400">R {vipStats.monthly_recurring?.toLocaleString()}</p>
                                <p className="text-xs text-gray-500 mt-1">R799 × {vipStats.total_vips} members</p>
                            </div>
                            <div className="bg-dark-800 p-6 rounded-lg border border-gray-700">
                                <div className="flex items-center gap-2 text-gray-400 text-sm mb-1"><TrendingUp size={16} /> Total VIP Revenue</div>
                                <p className="text-3xl font-bold text-white">R {vipStats.total_revenue?.toLocaleString()}</p>
                            </div>
                        </div>
                    )}

                    {/* VIP Members List */}
                    <div className="bg-dark-800 rounded-lg border border-gray-700">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Crown size={18} className="text-purple-400" /> VIP Members</h2>
                            <button
                                onClick={() => {
                                    const csv = [
                                        ['Name', 'Phone', 'Email', 'Joined', 'Orders', 'Total Spent'].join(','),
                                        ...vipMembers.map(m => [
                                            m.name,
                                            m.phone,
                                            m.email || '',
                                            m.vip_joined_at || '',
                                            m.order_count,
                                            m.total_spent
                                        ].join(','))
                                    ].join('\n');
                                    const blob = new Blob([csv], { type: 'text/csv' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `vip-members-${new Date().toISOString().slice(0, 10)}.csv`;
                                    a.click();
                                }}
                                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500 transition text-sm font-semibold"
                            >
                                <Download size={16} />
                                Export CSV
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-gray-300">
                                <thead className="bg-dark-900 text-gray-500 text-sm uppercase">
                                    <tr>
                                        <th className="p-4">Name</th>
                                        <th className="p-4">Phone</th>
                                        <th className="p-4">Email</th>
                                        <th className="p-4">Joined</th>
                                        <th className="p-4">Orders</th>
                                        <th className="p-4">Total Spent</th>
                                        <th className="p-4">Last Order</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {vipMembers.length === 0 ? (
                                        <tr><td colSpan="7" className="p-8 text-center text-gray-500">No VIP members yet</td></tr>
                                    ) : vipMembers.map(member => (
                                        <tr key={member.id} className="hover:bg-dark-900/50">
                                            <td className="p-4 font-medium text-white flex items-center gap-2">
                                                <Crown size={14} className="text-purple-400" />
                                                {member.name}
                                            </td>
                                            <td className="p-4 text-sm">{member.phone}</td>
                                            <td className="p-4 text-sm text-gray-400">{member.email || '-'}</td>
                                            <td className="p-4 text-sm text-gray-400">{member.vip_joined_at ? new Date(member.vip_joined_at).toLocaleDateString() : '-'}</td>
                                            <td className="p-4 text-center">
                                                <span className="bg-dark-900 px-2 py-1 rounded text-gold-500">{member.order_count}</span>
                                            </td>
                                            <td className="p-4 text-green-400 font-bold">R {member.total_spent?.toLocaleString() || 0}</td>
                                            <td className="p-4 text-sm text-gray-400">{member.last_order_date ? new Date(member.last_order_date).toLocaleDateString() : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
