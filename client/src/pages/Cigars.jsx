import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { Plus, Loader } from 'lucide-react';

const Cigars = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isVip, setIsVip] = useState(false);
    const { addToCart } = useCart();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/products`);
                setProducts(response.data);
            } catch (error) {
                console.error('Error loading products', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();

        try {
            setIsVip(localStorage.getItem('royal_vip') === 'true');
        } catch {
            setIsVip(false);
        }
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
            <div className="mb-8 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">Our Cigar Collection</h1>
                <p className="text-gray-400">Handpicked premium cigars from the world's finest regions.</p>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {products.map(product => (
                    <div key={product.id} className="bg-dark-800 rounded-xl overflow-hidden border border-gray-800 hover:border-gold-500/50 transition duration-300 flex flex-col shadow-lg">
                        <div className="relative aspect-square bg-gray-900 overflow-hidden">
                            {/* Product Image Placeholder */}
                            <img
                                src={product.image_url}
                                alt={product.name}
                                loading="lazy"
                                decoding="async"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = 'https://source.unsplash.com/9tRTJwxSoKI/800x600';
                                }}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            />

                            {isVip && (
                                <div className="absolute top-2 left-2 bg-purple-600/90 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-purple-300/40">
                                    VIP BOX PRICE
                                </div>
                            )}
                            {/* Low Stock Badge */}
                            {product.stock_qty > 0 && product.stock_qty <= 10 && (
                                <div className={`absolute top-2 right-2 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${product.stock_qty <= 3
                                        ? 'bg-red-600/90 text-white border-red-300/40'
                                        : 'bg-orange-600/90 text-white border-orange-300/40'
                                    }`}>
                                    Only {product.stock_qty} left!
                                </div>
                            )}
                            {product.stock_qty <= 0 && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                    <span className="text-red-500 font-bold border-2 border-red-500 px-2 py-1 rotate-[-15deg] text-xs">SOLD OUT</span>
                                </div>
                            )}
                        </div>

                        <div className="p-3 flex-1 flex flex-col justify-between">
                            <div>
                                <h3 className="text-sm md:text-base font-bold text-gray-100 line-clamp-2 leading-tight mb-1">{product.name}</h3>
                                <span className="bg-dark-900 text-gold-400 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider border border-gray-700 inline-block">{product.category}</span>
                            </div>

                            <div className="flex justify-between items-center mt-3">
                                {isVip ? (
                                    <div className="flex flex-col leading-tight">
                                        <span className="text-sm md:text-lg font-bold text-white">R {getVipPrice(product).toFixed(0)}</span>
                                    </div>
                                ) : (
                                    <span className="text-sm md:text-lg font-bold text-white">R {product.price_zar.toFixed(0)}</span>
                                )}

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
                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition ${product.stock_qty > 0
                                        ? 'bg-gray-200 text-black hover:bg-gold-500'
                                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    <Plus size={18} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Cigars;
