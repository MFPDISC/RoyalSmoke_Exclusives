import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, DollarSign, CheckCircle, Clock, TrendingUp, Calculator, Upload } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const InventoryManagement = () => {
    const [pendingProducts, setPendingProducts] = useState([]);
    const [approvedProducts, setApprovedProducts] = useState([]);
    const [activeTab, setActiveTab] = useState('pending');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const [pendingRes, approvedRes] = await Promise.all([
                axios.get(`${API}/inventory/admin/products/pending`),
                axios.get(`${API}/inventory/admin/products/approved`)
            ]);
            setPendingProducts(pendingRes.data);
            setApprovedProducts(approvedRes.data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const approveProduct = async (productId, profitMargin) => {
        try {
            await axios.patch(`${API}/inventory/admin/products/${productId}/approve`, {
                profit_margin: profitMargin
            });
            fetchProducts();
        } catch (error) {
            alert('Failed to approve product');
        }
    };

    const updatePricing = async (productId, profitMargin) => {
        try {
            await axios.patch(`${API}/inventory/admin/products/${productId}/pricing`, {
                profit_margin: profitMargin
            });
            fetchProducts();
        } catch (error) {
            alert('Failed to update pricing');
        }
    };

    const PendingProductCard = ({ product }) => {
        const [margin, setMargin] = useState(product.suggested_margin);
        const [calculatedPrice, setCalculatedPrice] = useState(product.preview_price);

        const recalculate = (newMargin) => {
            setMargin(newMargin);
            const price = product.store_cost_price * (1 + newMargin / 100);
            const oddPrice = Math.round(price) % 2 === 0 ? Math.round(price) - 1 : Math.round(price);
            setCalculatedPrice(oddPrice);
        };

        return (
            <div className="bg-dark-800 p-6 rounded-lg border border-gray-700">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-white">{product.product_name}</h3>
                        <p className="text-sm text-gray-400">{product.store_name} - {product.store_city}</p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-900/30 text-yellow-400 rounded text-sm">
                        Pending Approval
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <p className="text-xs text-gray-500">Store Cost Price</p>
                        <p className="text-2xl font-bold text-white">R {product.store_cost_price.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Stock Available</p>
                        <p className="text-2xl font-bold text-gold-500">{product.stock_qty} units</p>
                    </div>
                </div>

                <div className="bg-dark-900 p-4 rounded mb-4">
                    <label className="block text-sm text-gray-400 mb-2">
                        <Calculator className="inline mr-2" size={14} />
                        Set Profit Margin (%)
                    </label>
                    <input
                        type="number"
                        value={margin}
                        onChange={(e) => recalculate(parseFloat(e.target.value))}
                        className="w-full bg-dark-800 border border-gray-600 rounded p-2 text-white"
                        min="0"
                        max="100"
                        step="5"
                    />
                    <div className="flex gap-2 mt-2">
                        <button onClick={() => recalculate(60)} className="px-2 py-1 bg-gray-700 rounded text-xs">60%</button>
                        <button onClick={() => recalculate(70)} className="px-2 py-1 bg-gray-700 rounded text-xs">70%</button>
                        <button onClick={() => recalculate(80)} className="px-2 py-1 bg-gray-700 rounded text-xs">80%</button>
                        <button onClick={() => recalculate(100)} className="px-2 py-1 bg-gold-700 rounded text-xs">100%</button>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-gold-900/20 to-gold-800/20 p-4 rounded mb-4 border border-gold-600/30">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-400">Customer Sees (Final Price)</p>
                            <p className="text-3xl font-bold text-gold-400">R {calculatedPrice}</p>
                            <p className="text-xs text-green-400 mt-1">
                                ✓ Odd number (better psychology)
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400">Your Profit</p>
                            <p className="text-xl font-bold text-green-400">
                                R {(calculatedPrice - product.store_cost_price).toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-400">
                                {((calculatedPrice - product.store_cost_price) / product.store_cost_price * 100).toFixed(1)}% margin
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => approveProduct(product.id, margin)}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded transition flex items-center justify-center gap-2"
                >
                    <CheckCircle size={18} />
                    Approve & Set Price at R {calculatedPrice}
                </button>
            </div>
        );
    };

    const ApprovedProductCard = ({ product }) => {
        const [editing, setEditing] = useState(false);
        const [newMargin, setNewMargin] = useState(product.admin_profit_margin);

        return (
            <div className="bg-dark-800 p-4 rounded-lg border border-green-700/30">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <h3 className="text-lg font-bold text-white">{product.product_name}</h3>
                        <p className="text-xs text-gray-400">{product.store_name}</p>
                    </div>
                    <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded text-xs">
                        ✓ Live
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                    <div>
                        <p className="text-xs text-gray-500">Cost</p>
                        <p className="font-bold text-white">R {product.store_cost_price}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Margin</p>
                        <p className="font-bold text-gold-400">{product.admin_profit_margin}%</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Customer Price</p>
                        <p className="font-bold text-green-400">R {product.admin_final_price}</p>
                    </div>
                </div>

                {editing ? (
                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={newMargin}
                            onChange={(e) => setNewMargin(parseFloat(e.target.value))}
                            className="flex-1 bg-dark-900 border border-gray-600 rounded p-2 text-white text-sm"
                        />
                        <button
                            onClick={() => {
                                updatePricing(product.id, newMargin);
                                setEditing(false);
                            }}
                            className="px-4 py-2 bg-gold-600 text-white rounded text-sm"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => setEditing(false)}
                            className="px-4 py-2 bg-gray-600 text-white rounded text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setEditing(true)}
                        className="text-xs text-gold-400 hover:text-gold-300"
                    >
                        Edit Pricing
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-serif text-white mb-2">Inventory Management</h1>
                <p className="text-gray-400">Approve store products and set profit margins</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-700">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-3 px-4 font-semibold transition ${
                        activeTab === 'pending'
                            ? 'text-gold-500 border-b-2 border-gold-500'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <Clock className="inline mr-2" size={18} />
                    Pending Approval ({pendingProducts.length})
                </button>
                <button
                    onClick={() => setActiveTab('approved')}
                    className={`pb-3 px-4 font-semibold transition ${
                        activeTab === 'approved'
                            ? 'text-gold-500 border-b-2 border-gold-500'
                            : 'text-gray-400 hover:text-white'
                    }`}
                >
                    <CheckCircle className="inline mr-2" size={18} />
                    Approved ({approvedProducts.length})
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-20 text-gray-400">Loading...</div>
            ) : activeTab === 'pending' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {pendingProducts.length === 0 ? (
                        <div className="col-span-2 text-center py-20 text-gray-400">
                            <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>No pending products</p>
                        </div>
                    ) : (
                        pendingProducts.map(product => (
                            <PendingProductCard key={product.id} product={product} />
                        ))
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {approvedProducts.length === 0 ? (
                        <div className="col-span-3 text-center py-20 text-gray-400">
                            <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>No approved products yet</p>
                        </div>
                    ) : (
                        approvedProducts.map(product => (
                            <ApprovedProductCard key={product.id} product={product} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default InventoryManagement;
