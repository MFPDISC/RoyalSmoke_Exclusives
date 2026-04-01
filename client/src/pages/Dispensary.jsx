import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { Leaf, Plus, Info, ShieldCheck, Zap, Star, LayoutGrid, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dispensary = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [customer, setCustomer] = useState(null);
    const { addToCart } = useCart();
    const navigate = useNavigate();

    const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

    useEffect(() => {
        const saved = localStorage.getItem('royal_customer');
        if (saved) {
            setCustomer(JSON.parse(saved));
        }
        
        const fetchCannabisProducts = async () => {
            try {
                const res = await axios.get(`${API}/products`);
                // Filter for cannabis category
                const cannabis = res.data.filter(p => p.category === 'Cannabis' || p.category === 'Flower' || p.category === 'Vapes' || p.category === 'PreRolls');
                
                if (cannabis.length === 0) {
                    // Fallback to manual list if not seeded yet
                    setProducts([
                        { id: 'c1', name: 'Greendoor Indica', category: 'Flower', price_zar: 55, unit: 'per g', description: 'Premium local indoor-grown Indica. Relaxing & smooth.' },
                        { id: 'c2', name: 'Primo Haze', category: 'Flower', price_zar: 120, unit: 'per g', description: 'Top-shelf export quality Sativa. Energetic & potent.' },
                        { id: 'c3', name: 'Royal Vapes - Gold 1g', category: 'Vapes', price_zar: 500, unit: 'each', description: '95% Pure THC Distillate with organic terpenes.' },
                        { id: 'c4', name: 'King Size PreRoll', category: 'PreRolls', price_zar: 80, unit: 'each', description: 'Pure flower, no trim. Hand-rolled with premium papers.' }
                    ]);
                } else {
                    setProducts(cannabis);
                }
            } catch (err) {
                console.error('Fetch failed', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCannabisProducts();
    }, []);

    if (!customer) {
        return (
            <div className="max-w-xl mx-auto py-20 px-6 text-center">
                <div className="bg-green-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                    <Leaf className="text-green-500" size={40} />
                </div>
                <div className="bg-dark-800 border border-white/5 rounded-3xl p-8 mb-8">
                    <h2 className="text-xl font-bold text-white mb-2">Age Verification Required (18+)</h2>
                    <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                        In accordance with South African regulatory guidelines, the Exotic Dispensary is strictly for adults aged 18 and older. 
                        <strong className="text-green-500 block mt-2">A valid ID must be presented to the courier upon delivery. No exceptions.</strong>
                    </p>
                    <div className="grid gap-4">
                        <button 
                            onClick={() => navigate('/account')}
                            className="bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-xl transition shadow-xl"
                        >
                            Sign Up / Register for Access
                        </button>
                        <button 
                            onClick={() => navigate('/account')}
                            className="text-gray-500 hover:text-white text-sm font-bold uppercase tracking-widest"
                        >
                            Already a member? Sign In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const categories = ['All', 'Flower', 'Vapes', 'PreRolls'];
    const [activeTab, setActiveTab] = useState('All');

    const filtered = activeTab === 'All' 
        ? products 
        : products.filter(p => p.category === activeTab);

    return (
        <div className="max-w-6xl mx-auto py-8 lg:py-12 px-4 md:px-6">
            {/* Dispensary Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Leaf className="text-green-500" size={24} />
                        <span className="text-green-500 font-black uppercase tracking-[0.2em] text-xs">Exotic Dispensary</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-serif text-white mb-2">The Leaf Collection.</h1>
                    <p className="text-gray-500 font-medium">Premium cannabis products for registered members.</p>
                </div>
                
                <div className="flex bg-dark-800 p-1 rounded-xl border border-white/5">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                    >
                        <List size={20} />
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex overflow-x-auto gap-2 mb-8 pb-2 no-scrollbar">
                {categories.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                            activeTab === tab 
                            ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' 
                            : 'bg-dark-800 text-gray-500 border border-white/5 hover:border-green-600/30'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Product Layout */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                    {filtered.map(p => (
                        <div key={p.id} className="group bg-dark-800 border border-white/5 rounded-3xl overflow-hidden hover:border-green-600/40 transition-all duration-500 hover:translate-y-[-4px] shadow-2xl">
                            <div className="aspect-[4/5] bg-dark-900 relative overflow-hidden">
                                <Leaf className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5 w-32 h-32 rotate-[-15deg]" />
                                {p.image_url && (
                                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                                )}
                                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white border border-white/10 uppercase tracking-widest">
                                    {p.category}
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-white font-bold mb-1 text-lg leading-tight">{p.name}</h3>
                                <p className="text-gray-500 text-xs mb-4 line-clamp-2">{p.description}</p>
                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                    <div className="flex flex-col">
                                        <span className="text-xl font-black text-white">R {p.price_zar}</span>
                                        <span className="text-[10px] text-gray-500 uppercase font-bold">{p.unit || 'per item'}</span>
                                    </div>
                                    <button 
                                        onClick={() => addToCart({...p, quantity: 1})}
                                        className="bg-white text-black p-3 rounded-2xl hover:bg-green-500 hover:text-white transition-all transform active:scale-90 shadow-xl"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(p => (
                        <div key={p.id} className="bg-dark-800 border border-white/5 rounded-2xl p-4 md:p-6 flex items-center gap-6 hover:border-green-600/30 transition-all group">
                            <div className="w-16 h-16 md:w-20 md:h-20 bg-dark-900 rounded-xl flex items-center justify-center shrink-0 border border-white/5 group-hover:border-green-600/20">
                                <Leaf className="text-green-600/20 group-hover:text-green-600/40 transition-colors" size={32} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-white font-bold text-lg">{p.name}</h3>
                                    <span className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-500 rounded-md font-black uppercase">{p.category}</span>
                                </div>
                                <p className="text-gray-500 text-sm line-clamp-1">{p.description}</p>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="text-xl font-black text-white">R {p.price_zar}</div>
                                    <div className="text-[10px] text-gray-500 uppercase font-bold">{p.unit || 'unit'}</div>
                                </div>
                                <button 
                                    onClick={() => addToCart({...p, quantity: 1})}
                                    className="bg-white text-black p-3 rounded-xl hover:bg-green-500 hover:text-white transition-all active:scale-95"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Compliance Note */}
            <div className="mt-16 bg-green-500/5 border border-green-500/20 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center shrink-0">
                    <ShieldCheck className="text-green-500" size={32} />
                </div>
                <div>
                    <h4 className="text-white font-bold text-lg mb-1">Safe & Compliant Access</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        In accordance with South African law and regulatory guidelines, these products are provided within a private membership context for personal use only. 
                        Access is strictly restricted to adults aged 18 and over. 
                        <strong className="text-green-500"> A valid original ID must be presented to the courier upon delivery to verify age.</strong> No underage sales will occur.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Dispensary;
