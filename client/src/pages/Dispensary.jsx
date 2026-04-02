import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { Leaf, Plus, Search, ShieldCheck, Zap, Star, LayoutGrid, List, Filter, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dispensary = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const [activeEffect, setActiveEffect] = useState('All');
    const [customer, setCustomer] = useState(null);
    const { addToCart } = useCart();
    const navigate = useNavigate();

    const MOCK_CANNABIS = [
        { id: 'c1', name: 'Greendoor Indica', category: 'Flower', type: 'Indica', thc: '18%', price_zar: 55, unit: 'per g', effects: ['Relaxed', 'Smooth'], description: 'Premium local indoor-grown Indica. Relaxing, smooth, and perfect for evening use.' },
        { id: 'c2', name: 'Primo Haze', category: 'Flower', type: 'Sativa', thc: '23%', price_zar: 120, unit: 'per g', effects: ['Energetic', 'Creative'], description: 'Top-shelf export quality Sativa. Energetic, potent, and crystal-rich.' },
        { id: 'c3', name: 'Royal Gold Distillate', category: 'Vapes', type: 'Sativa', thc: '95%', price_zar: 500, unit: '1g Cart', effects: ['Focused', 'Uplifted'], description: '95% Pure THC Distillate with organic terpenes. Discrete and powerful.' },
        { id: 'c4', name: 'Greendoor Pre-Roll', category: 'PreRolls', type: 'Indica', thc: '18%', price_zar: 50, unit: 'Single PR', effects: ['Smooth', 'Mellow'], description: 'Hand-rolled Greendoor flower. Smooth, consistent, and convenient.' },
        { id: 'c7', name: 'Greendoor Bulk PR', category: 'PreRolls', type: 'Indica', thc: '18%', price_zar: 240, unit: 'Pack of 5', effects: ['Social', 'Balanced'], description: 'Excellent value daily-driver pack of our famous Greendoor flower.' },
        { id: 'c8', name: 'Blue Dream Reserve', category: 'Flower', type: 'Hybrid', thc: '22%', price_zar: 140, unit: 'per g', effects: ['Balanced', 'Creative'], description: 'The connoisseur choice. Sweet berry aroma with a smooth finish.' }
    ];

    useEffect(() => {
        const saved = localStorage.getItem('royal_customer');
        if (saved) {
            setCustomer(JSON.parse(saved));
        }
        
        // Static Site: Always use the boutique vault catalog
        setProducts(MOCK_CANNABIS);
        setLoading(false);
    }, []);

    if (!customer) {
        return (
            <div className="max-w-xl mx-auto py-20 px-6 text-center">
                <div className="bg-green-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/20 shadow-2xl shadow-green-500/10 animate-pulse">
                    <Leaf className="text-green-500" size={48} />
                </div>
                <div className="bg-dark-800 border border-white/5 rounded-3xl p-10 shadow-2xl">
                    <h2 className="text-3xl font-serif text-white mb-4">The Boutique Dispensary</h2>
                    <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                        Access to our curated cannabis selection is strictly for verified members aged 21 and over. 
                        Join the RoyalSmoke community to browse our boutique menu.
                    </p>
                    <div className="grid gap-4">
                        <button 
                            onClick={() => navigate('/account?redirect=/dispensary')}
                            className="bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-xl transition shadow-xl transform active:scale-95"
                        >
                            Get Exclusive Access
                        </button>
                        <button 
                            onClick={() => navigate('/account?redirect=/dispensary')}
                            className="text-white/40 hover:text-white text-xs font-bold uppercase tracking-[0.2em] transition"
                        >
                            Return to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const categories = ['All', 'Flower', 'Vapes', 'PreRolls'];
    const effects = ['All', 'Relaxed', 'Energetic', 'Focused', 'Happy', 'Euphoric'];

    const filtered = products.filter(p => {
        const matchesCategory = activeTab === 'All' || p.category === activeTab;
        const matchesEffect = activeEffect === 'All' || (p.effects && p.effects.includes(activeEffect));
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             p.type?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesEffect && matchesSearch;
    });

    return (
        <div className="max-w-7xl mx-auto py-8 lg:py-16 px-4 md:px-6">
            {/* Dispensary Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                            <Leaf className="text-green-500" size={18} />
                        </div>
                        <span className="text-green-500 font-black uppercase tracking-[0.3em] text-[10px]">Private Reserve</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-serif text-white tracking-tight leading-none">
                        The Green <span className="text-green-500">Vault.</span>
                    </h1>
                    <p className="text-gray-500 text-lg max-w-xl">Curated genetics for the discerning enthusiast. Lab-tested, organic, and exclusive to our members.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative group min-w-[280px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-500 transition-colors" size={18} />
                        <input 
                            type="text"
                            placeholder="Search strain or effect..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-dark-800 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-green-500 outline-none transition-all placeholder:text-gray-600"
                        />
                    </div>
                    <div className="flex bg-dark-800 p-1 rounded-2xl border border-white/5">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-3 rounded-xl transition ${viewMode === 'grid' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            <LayoutGrid size={20} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-3 rounded-xl transition ${viewMode === 'list' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                        >
                            <List size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Premium Filters Section */}
            <div className="mb-12 space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-gray-400 mr-2">
                        <Filter size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">Store</span>
                    </div>
                    {categories.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all border ${
                                activeTab === tab 
                                ? 'bg-green-600 text-white border-green-500 shadow-xl shadow-green-600/20 scale-105' 
                                : 'bg-dark-800 text-gray-500 border-white/5 hover:border-green-600/30'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-gray-400 mr-2">
                        <Zap size={16} />
                        <span className="text-xs font-black uppercase tracking-widest">Effect</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {effects.map(effect => (
                            <button
                                key={effect}
                                onClick={() => setActiveEffect(effect)}
                                className={`px-4 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all border ${
                                    activeEffect === effect 
                                    ? 'bg-white text-black border-white scale-105' 
                                    : 'bg-dark-900/50 text-gray-600 border-white/5 hover:border-white/20'
                                }`}
                            >
                                {effect}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Menu Layout */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
                    <span className="text-xs font-black uppercase tracking-widest text-gray-500">Decrypting Vault...</span>
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-20 text-center animate-fade-in">
                    <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                        <Search className="text-gray-500" size={32} />
                    </div>
                    <h3 className="text-2xl font-serif text-white mb-2">No strains found in the vault.</h3>
                    <p className="text-gray-500 max-w-xs mx-auto text-sm">Try adjusting your filters or search query to find your perfect match.</p>
                    <button 
                        onClick={() => { setActiveTab('All'); setActiveEffect('All'); setSearchQuery(''); }}
                        className="mt-8 text-green-500 font-black uppercase tracking-widest text-[10px] border-b border-green-500/50 hover:border-green-500 transition-all pb-1"
                    >
                        Reset All Filters
                    </button>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {filtered.map(p => (
                        <div key={p.id} className="group bg-dark-800 border border-white/5 rounded-3xl overflow-hidden hover:border-green-600/40 transition-all duration-500 hover:translate-y-[-8px] shadow-2xl relative">
                            {/* Product Image Area */}
                            <div className="aspect-[4/5] bg-dark-900 relative overflow-hidden">
                                <Leaf className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5 w-40 h-40 rotate-[-15deg] group-hover:scale-125 transition-transform duration-1000" />
                                {p.image_url ? (
                                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                        <div className="w-full h-full bg-gradient-to-br from-green-600/20 to-transparent"></div>
                                    </div>
                                )}
                                
                                {/* Top Labels */}
                                <div className="absolute top-4 left-4 flex flex-col gap-2">
                                    <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-[9px] font-black text-white border border-white/10 uppercase tracking-[0.2em] w-fit">
                                        {p.type || 'Hybrid'}
                                    </div>
                                    <div className="bg-green-500 text-black px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] w-fit shadow-lg">
                                        THC {p.thc || '20%'}
                                    </div>
                                </div>

                                {/* Quick Look View */}
                                <div className="absolute bottom-4 left-4 right-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                                    <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-2xl">
                                        <div className="text-[10px] font-black text-black uppercase mb-1 tracking-widest">Dominant Effects</div>
                                        <div className="flex flex-wrap gap-1">
                                            {(p.effects || ['Relaxed', 'Happy']).map(e => (
                                                <span key={e} className="bg-dark-900 text-white text-[8px] px-2 py-0.5 rounded-md font-bold uppercase">{e}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-white font-serif text-2xl leading-none group-hover:text-green-500 transition-colors uppercase tracking-tight">{p.name}</h3>
                                    <div className="flex items-center text-gold-500">
                                        <Star size={10} className="fill-gold-500" />
                                        <span className="text-[9px] font-black ml-1">TOP SHELF</span>
                                    </div>
                                </div>
                                <p className="text-gray-500 text-xs mb-6 line-clamp-2 h-8">{p.description}</p>
                                
                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex flex-col">
                                        <span className="text-2xl font-black text-white tracking-tighter">R {p.price_zar}</span>
                                        <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{p.unit || 'per gram'}</span>
                                    </div>
                                    <button 
                                        onClick={() => addToCart({...p, quantity: 1})}
                                        className="bg-white text-black p-4 rounded-2xl hover:bg-green-600 hover:text-white transition-all transform active:scale-90 shadow-xl group/btn"
                                    >
                                        <Plus size={20} className="group-active/btn:rotate-90 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map(p => (
                        <div key={p.id} className="bg-dark-800 border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-8 hover:border-green-600/30 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rotate-45 translate-x-12 -translate-y-12"></div>
                            
                            <div className="w-32 h-32 bg-dark-900 rounded-3xl flex items-center justify-center shrink-0 border border-white/5 relative overflow-hidden group-hover:border-green-600/40">
                                <Leaf className="text-green-600/10 absolute inset-0 w-full h-full p-4" />
                                {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-full object-cover relative z-10 opacity-80" />}
                            </div>

                            <div className="flex-1 space-y-3">
                                <div className="flex flex-wrap items-center gap-3">
                                    <h3 className="text-white font-serif text-3xl uppercase tracking-tighter">{p.name}</h3>
                                    <span className="text-[10px] px-3 py-1 bg-green-500/10 text-green-500 rounded-lg font-black uppercase tracking-widest border border-green-500/20">{p.category}</span>
                                    <span className="text-[10px] px-3 py-1 bg-white/5 text-gray-400 rounded-lg font-black uppercase tracking-widest border border-white/5">{p.type}</span>
                                </div>
                                <p className="text-gray-400 text-sm max-w-2xl">{p.description}</p>
                                <div className="flex gap-2">
                                    {(p.effects || []).map(e => (
                                        <span key={e} className="text-[9px] font-black text-gray-600 uppercase border border-white/5 px-2 py-0.5 rounded">{e}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-10 shrink-0">
                                <div className="text-center">
                                    <div className="text-[10px] text-green-500 font-black uppercase tracking-widest mb-1">THC Content</div>
                                    <div className="text-2xl font-black text-white">{p.thc || '20%'}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-black text-white">R {p.price_zar}</div>
                                    <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{p.unit}</div>
                                </div>
                                <button 
                                    onClick={() => addToCart({...p, quantity: 1})}
                                    className="bg-white text-black p-5 rounded-2xl hover:bg-green-600 hover:text-white transition-all active:scale-95 shadow-2xl"
                                >
                                    <Plus size={24} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Premium Compliance Area */}
            <div className="mt-24 relative">
                <div className="absolute inset-0 bg-green-600/5 blur-[120px] rounded-full"></div>
                <div className="relative bg-dark-800/80 backdrop-blur-xl border border-white/5 rounded-[40px] p-10 md:p-16 flex flex-col lg:flex-row items-center gap-12 overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 blur-[100px] -mr-32 -mt-32"></div>
                    
                    <div className="w-24 h-24 bg-green-500/10 rounded-3xl flex items-center justify-center shrink-0 border border-green-500/20 rotate-3">
                        <ShieldCheck className="text-green-500" size={48} />
                    </div>
                    
                    <div className="flex-1 space-y-4">
                        <h4 className="text-white font-serif text-3xl">Purity & Compliance.</h4>
                        <p className="text-gray-400 text-lg leading-relaxed max-w-2xl">
                            All products are strictly for personal use within a private membership context in accordance with South African law. 
                            <span className="text-white block mt-4 font-bold">Age verification (21+) is mandatory upon delivery. High-fidelity original ID must be presented.</span>
                        </p>
                    </div>

                    <div className="shrink-0 space-y-3">
                        <div className="flex items-center gap-3 text-green-500/60 text-sm font-black uppercase tracking-widest">
                            <Zap size={16} /> Fast Dispatch
                        </div>
                        <div className="flex items-center gap-3 text-green-500/60 text-sm font-black uppercase tracking-widest">
                            <Star size={16} /> Lab Tested
                        </div>
                        <div className="flex items-center gap-3 text-green-500/60 text-sm font-black uppercase tracking-widest">
                            <ShieldCheck size={16} /> Discret Packaging
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dispensary;
