import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { Plus, Loader } from 'lucide-react';

const Cigars = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isVip, setIsVip] = useState(false);
    const { addToCart } = useCart();

    const MOCK_COLLECTION = [
        { id: 'cig1', name: 'Cohiba Siglo II', category: 'Cigars', price_zar: 850, stock_qty: 12, description: 'Medium-bodied, offering a complex blend of wood, spice, and cocoa flavors.', image_url: 'https://images.unsplash.com/photo-1541690161474-061093f4ca6b?auto=format&fit=crop&q=80&w=800' },
        { id: 'cig2', name: 'Montecristo No. 4', category: 'Cigars', price_zar: 450, stock_qty: 24, description: ' Earthy, nutty, and slightly spicy with a hint of dark chocolate.', image_url: 'https://images.unsplash.com/photo-1629731671239-01c0ca48e244?auto=format&fit=crop&q=80&w=800' },
        { id: 'cig3', name: 'Romeo y Julieta Wide Churchill', category: 'Cigars', price_zar: 690, stock_qty: 8, description: 'Smooth, creamy, and nutty with a hint of vanilla and caramel.', image_url: 'https://images.unsplash.com/photo-1606136630453-6ec219213fb3?auto=format&fit=crop&q=80&w=800' },
        { id: 'nic1', name: 'VELO Freeze', category: 'Nicotine', price_zar: 110, stock_qty: 100, description: 'Extra strong nicotine pouches with a cooling mint sensation.', image_url: 'https://images.unsplash.com/photo-1603531086036-7c0a96fcdf2b?auto=format&fit=crop&q=80&w=800' },
        { id: 'nic2', name: 'ZYN Cool Mint 6mg', category: 'Nicotine', price_zar: 140, stock_qty: 50, description: 'Premium tobacco-free nicotine pouches. Discrete and clean.', image_url: 'https://images.unsplash.com/photo-1621252179027-94459d278660?auto=format&fit=crop&q=80&w=800' },
        { id: 'cig4', name: 'Partagas Serie D No. 4', category: 'Cigars', price_zar: 580, stock_qty: 15, description: 'Full-bodied and spicy with a complex flavor profile of leather and coffee.', image_url: 'https://images.unsplash.com/photo-1589182397057-b163ce4dd703?auto=format&fit=crop&q=80&w=800' },
        { id: 'nic3', name: 'VELO Polar Mint', category: 'Nicotine', price_zar: 110, stock_qty: 75, description: 'Smooth and refreshing classic mint nicotine pouches.', image_url: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?auto=format&fit=crop&q=80&w=800' }
    ];

    useEffect(() => {
        // Static Site: Instantly load mock collection
        setProducts(MOCK_COLLECTION);
        setLoading(false);

        const tier = localStorage.getItem('royal_vip');
        setIsVip(!!tier && tier !== 'false');
    }, []);

    const getVipPrice = (product) => {
        if (!isVip) return product.price_zar;
        // VIPs get ~25% off everything (Box Price logic)
        return Math.round(product.price_zar * 0.75 * 100) / 100;
    };

    if (loading) return <div className="flex justify-center p-20"><Loader className="animate-spin text-gold-500" /></div>;

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-0">
            {/* Header */}
            <div className="mb-12 text-center md:text-left space-y-4">
                <div className="inline-block bg-gold-500/10 text-gold-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-gold-500/20 shadow-xl shadow-gold-500/5">Royal Collection.</div>
                <h1 className="text-5xl md:text-7xl font-serif font-black text-white tracking-tighter leading-none mb-4 uppercase">
                    Exclusives <br/><span className="text-gold-500">& Essentials.</span>
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">Handpicked premium cigars and curated nicotine essentials for the discerning enthusiast.</p>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                {products.map(product => (
                    <div key={product.id} className="group bg-dark-800 rounded-3xl overflow-hidden border border-white/5 hover:border-gold-500/40 transition-all duration-500 hover:translate-y-[-8px] shadow-2xl flex flex-col relative">
                        <div className="relative aspect-[4/5] bg-dark-900 overflow-hidden">
                            <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition duration-1000 opacity-80 group-hover:opacity-100"
                            />

                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                <span className="bg-black/60 backdrop-blur-md text-gold-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border border-gold-500/20 w-fit">
                                    {product.category}
                                </span>
                                {isVip && (
                                    <div className="bg-purple-600/90 backdrop-blur-md text-white text-[9px] font-black px-3 py-1 rounded-lg border border-purple-300/40 uppercase tracking-[0.1em] shadow-lg">
                                        VIP BOX PRICE
                                    </div>
                                )}
                            </div>

                            {/* Stock Badge */}
                            {product.stock_qty > 0 && product.stock_qty <= 15 && (
                                <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl text-center border border-white/10">
                                    <span className="text-[10px] text-white font-black uppercase tracking-widest">
                                        Limited Reserve • {product.stock_qty} Left
                                    </span>
                                </div>
                            )}

                            {product.stock_qty <= 0 && (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-8 text-center">
                                    <div className="border-2 border-red-500/50 p-4 rounded-2xl rotate-[-12deg]">
                                        <span className="text-red-500 font-serif text-3xl font-black italic uppercase tracking-tighter">Sold Out</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                            <div className="space-y-2">
                                <h3 className="text-white font-serif text-2xl group-hover:text-gold-500 transition-colors uppercase tracking-tight leading-none">{product.name}</h3>
                                <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">{product.description}</p>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                <div className="flex flex-col">
                                    <span className="text-2xl font-black text-white tracking-tighter">R {getVipPrice(product).toFixed(0)}</span>
                                    {isVip && <span className="text-[10px] text-gray-500 line-through">R {product.price_zar}</span>}
                                </div>

                                <button
                                    onClick={() => {
                                        const price = getVipPrice(product);
                                        addToCart({
                                            ...product,
                                            price_zar: price,
                                            original_price_zar: product.price_zar
                                        });
                                    }}
                                    disabled={product.stock_qty <= 0}
                                    className={`p-4 rounded-2xl transition-all transform active:scale-90 shadow-xl group/btn ${product.stock_qty > 0
                                        ? 'bg-white text-black hover:bg-gold-500 hover:text-black'
                                        : 'bg-dark-900 text-gray-600 cursor-not-allowed border border-white/5'
                                        }`}
                                >
                                    <Plus size={20} className="group-active/btn:rotate-90 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quality Disclaimer */}
            <div className="mt-24 p-12 bg-dark-800 border border-white/5 rounded-[40px] text-center relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/5 blur-[100px] -mr-32 -mt-32"></div>
                <div className="relative space-y-4">
                    <h4 className="text-white font-serif text-3xl">Purity & Authentication.</h4>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                        Every cigar and nicotine pouch in our collection is strictly sourced through certified importers. 
                        We guarantee provenance, humidity control, and authenticity for every single item.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Cigars;
