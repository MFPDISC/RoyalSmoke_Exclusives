import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { Plus, Loader, ChevronLeft, ChevronRight, ChevronDown, Sparkles, Crown, Gift, Percent, Search, ShoppingBag, CreditCard, Truck, Package, Shield, Zap, Star, Clock, Users } from 'lucide-react';
import CountdownTimer from '../components/CountdownTimer';

// Local cigar images
import cigarNearMe from '../assets/cigars/cigar_near_me.jpg';
import royalsmokeExclusives from '../assets/cigars/royalsmoke-exclusives_cigars.jpeg';
import royalsmokeCigars from '../assets/cigars/royalsmoke_cigars.jpg.jpeg';

const Home = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isVip, setIsVip] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', tier: '' });
    const [openFaq, setOpenFaq] = useState(null);
    const { addToCart } = useCart();

    // Set next drop date (7 days from now, reset weekly)
    const getNextDropDate = () => {
        const nextMonday = new Date();
        nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7));
        nextMonday.setHours(18, 0, 0, 0); // 6 PM Monday
        return nextMonday;
    };

    const handleSelectMembership = (tier, name, price, description) => {
        // Find the real product from the seeded database
        const realProduct = products.find(p => p.category === 'Membership' && p.name.toLowerCase().includes(name.toLowerCase()));
        
        if (realProduct) {
            addToCart({
                ...realProduct,
                isSubscription: true,
                tier: tier
            });
        } else {
            // Fallback for safety (though seeds should exist)
            addToCart({
                id: `membership-${tier}`,
                name: `${name} Membership`,
                price_zar: price,
                image_url: royalsmokeExclusives,
                description: description,
                stock_qty: tier === 'founders-black' ? 200 : 999,
                isSubscription: true,
                tier: tier
            });
        }
        
        try { localStorage.setItem('royal_vip', tier); setIsVip(true); } catch { }
        setToast({ show: true, message: `${name} added to cart!`, tier });
        setTimeout(() => {
            setToast({ show: false, message: '', tier: '' });
            navigate('/cart');
        }, 1200);
    };

    const membershipFaqs = [
        {
            q: 'How do free monthly cigars work?',
            a: 'You get free cigars (1 for Reserve, 2 for Founders) every month. Choose from our best-sellers when you claim. Limit resets monthly.'
        },
        {
            q: 'Can I cancel anytime?',
            a: 'Yes. Cancel anytime in your account. Your benefits remain active until the end of your billing period.'
        },
        {
            q: 'Is Founders Black really limited?',
            a: 'Yes. We cap it at 200 members so concierge + priority stays real.'
        },
        {
            q: 'Do discounts stack with promos?',
            a: 'No stacking. You\'ll always get the best eligible price automatically.'
        }
    ];

    // Featured banner ads with premium copy
    const featuredSpecials = [
        {
            id: 'vip-membership',
            name: 'Join the Reserve Club',
            description: 'Get 1 free best-seller cigar every month + 15% off everything. Skip the lines with 48-hour early access.',
            finalPrice: 1199,
            savings: 'R1199/month',
            image: royalsmokeExclusives,
            badge: 'Limited Spots',
            isMembership: true,
            benefits: [
                { icon: 'gift', text: '1 Free Cigar Monthly' },
                { icon: 'percent', text: '15% Off Storewide' },
                { icon: 'crown', text: '48h Early Access' }
            ]
        },
        {
            id: 'special-1',
            name: 'Premium Cubans Delivered Fast',
            description: 'Authentic Cohibas, Montecristos & Romeo y Julietas. Same-day dispatch. Humidity-controlled packaging.',
            storeCost: 2400,
            margin: 70,
            finalPrice: 4079,
            savings: 'From R249/cigar',
            image: cigarNearMe,
            badge: 'Fast Shipping'
        },
        {
            id: 'special-2',
            name: 'The Executive Gift Set',
            description: '5 hand-selected premium cigars, crystal cutter & leather travel case. Perfect for clients or yourself.',
            storeCost: 1800,
            margin: 80,
            finalPrice: 3239,
            savings: 'Save R760',
            image: royalsmokeCigars,
            badge: 'Gift Ready'
        },
        {
            id: 'special-3',
            name: 'Aged 10-Year Reserve Collection',
            description: 'Ultra-rare, vintage cigars for true connoisseurs. Limited availability. Authenticated & certified.',
            storeCost: 3000,
            margin: 60,
            finalPrice: 4799,
            savings: 'Only 12 Left',
            image: royalsmokeExclusives,
            badge: 'Collector\'s Item'
        }
    ];

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

        // Auto-slide carousel
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % featuredSpecials.length);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const isTopSeller = (product) => {
        const name = (product?.name || '').toLowerCase();
        return (
            name.includes('cohiba') ||
            name.includes('montecristo') ||
            name.includes('romeo') ||
            name.includes('julieta') ||
            name.includes('partagas')
        );
    };

    const getVipPrice = (product) => {
        if (!isVip) return product.price_zar;
        if (!isTopSeller(product)) return product.price_zar;
        return Math.round(product.price_zar * 0.7 * 100) / 100;
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % featuredSpecials.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + featuredSpecials.length) % featuredSpecials.length);
    };

    if (loading) return <div className="flex justify-center p-20"><Loader className="animate-spin text-gold-500" /></div>;

    return (
        <div>
            {/* Toast Notification */}
            {toast.show && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-pulse">
                    <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${toast.tier === 'founders-black'
                        ? 'bg-gradient-to-r from-gold-500/90 to-gold-600/90 border-gold-400 text-black'
                        : toast.tier === 'reserve-club'
                            ? 'bg-gradient-to-r from-purple-600/90 to-purple-700/90 border-purple-400 text-white'
                            : 'bg-gradient-to-r from-gray-700/90 to-gray-800/90 border-gray-500 text-white'
                        }`}>
                        <Crown size={20} className={toast.tier === 'founders-black' ? 'text-black' : 'text-white'} />
                        <span className="font-bold text-base">{toast.message}</span>
                        <span className="text-sm opacity-80">Redirecting to checkout...</span>
                    </div>
                </div>
            )}

            {/* Apple-Style Hero Carousel */}
            <div className="relative w-full h-[55vh] md:h-[600px] mb-8 md:mb-16 overflow-hidden md:rounded-2xl">
                {featuredSpecials.map((special, index) => (
                    <div
                        key={special.id}
                        className={`absolute inset-0 transition-all duration-700 ease-in-out ${index === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
                            }`}
                        style={{
                            backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.8), rgba(0,0,0,0.3)), url(${special.image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    >
                        <div className="h-full flex items-center justify-start px-6 md:px-24">
                            <div className="max-w-2xl mt-0">
                                {/* Badge */}
                                <div className={`inline-flex items-center gap-2 backdrop-blur-sm border rounded-full px-3 py-1.5 mb-3 md:mb-6 ${special.isMembership
                                    ? 'bg-purple-500/20 border-purple-500/50'
                                    : 'bg-gold-500/20 border-gold-500/50'
                                    }`}>
                                    {special.isMembership ? (
                                        <Crown size={12} className="text-purple-400" />
                                    ) : (
                                        <Sparkles size={12} className="text-gold-400" />
                                    )}
                                    <span className={`font-semibold text-xs md:text-sm ${special.isMembership ? 'text-purple-400' : 'text-gold-400'}`}>
                                        {special.badge}
                                    </span>
                                </div>

                                {/* Title */}
                                <h1 className="text-3xl md:text-7xl font-serif font-bold text-white mb-2 md:mb-6 leading-tight">
                                    {special.name}
                                </h1>

                                {/* Description */}
                                <p className="text-sm md:text-2xl text-gray-200 mb-4 md:mb-8 leading-relaxed max-w-xs md:max-w-none line-clamp-2 md:line-clamp-none">
                                    {special.description}
                                </p>

                                {/* Membership Benefits */}
                                {special.isMembership && special.benefits && (
                                    <div className="flex flex-wrap gap-2 md:gap-4 mb-4 md:mb-8">
                                        {special.benefits.map((benefit, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 md:px-4 md:py-2">
                                                {benefit.icon === 'gift' && <Gift size={14} className="text-green-400" />}
                                                {benefit.icon === 'percent' && <Percent size={14} className="text-blue-400" />}
                                                {benefit.icon === 'crown' && <Crown size={14} className="text-purple-400" />}
                                                <span className="text-white text-xs md:text-sm font-medium">{benefit.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Price */}
                                <div className="flex items-baseline gap-3 md:gap-4 mb-6 md:mb-8">
                                    <span className="text-2xl md:text-5xl font-bold text-white">R {special.finalPrice.toLocaleString()}</span>
                                    <span className={`text-lg md:text-xl font-semibold ${special.isMembership ? 'text-purple-400' : 'text-green-400'}`}>
                                        {special.savings}
                                    </span>
                                </div>

                                {/* CTA Button */}
                                <button
                                    onClick={() => {
                                        if (special.isMembership) {
                                            try {
                                                localStorage.setItem('royal_vip', 'true');
                                                setIsVip(true);
                                            } catch {
                                                // ignore
                                            }
                                            addToCart({
                                                id: 'membership-monthly',
                                                name: 'RoyalSmoke Exclusive Membership',
                                                price_zar: 1199,
                                                image_url: special.image,
                                                description: 'Monthly membership: Free cigar + 25% off all orders',
                                                stock_qty: 999,
                                                isSubscription: true
                                            });
                                        } else {
                                            addToCart({
                                                id: special.id,
                                                name: special.name,
                                                price_zar: special.finalPrice,
                                                image_url: special.image,
                                                description: special.description,
                                                stock_qty: 10
                                            });
                                        }
                                    }}
                                    className={`group px-6 py-3 md:px-8 md:py-4 rounded-full font-semibold text-base md:text-lg transition-all duration-300 flex items-center gap-2 md:gap-3 shadow-2xl ${special.isMembership
                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                                        : 'bg-white text-black hover:bg-gold-500'
                                        }`}
                                >
                                    <span>{special.isMembership ? 'Join Now' : 'Order Now'}</span>
                                    {special.isMembership ? (
                                        <Crown size={16} className="group-hover:scale-110 transition-transform duration-300" />
                                    ) : (
                                        <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Navigation Arrows - Hidden on mobile */}
                <button
                    onClick={prevSlide}
                    className="hidden md:block absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white p-3 rounded-full transition-all duration-300"
                >
                    <ChevronLeft size={28} />
                </button>
                <button
                    onClick={nextSlide}
                    className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white p-3 rounded-full transition-all duration-300"
                >
                    <ChevronRight size={28} />
                </button>

                {/* Slide Indicators */}
                <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3 z-10">
                    {featuredSpecials.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`transition-all duration-300 rounded-full ${index === currentSlide
                                ? 'bg-white w-8 md:w-12 h-1.5 md:h-2'
                                : 'bg-white/40 w-1.5 md:w-2 h-1.5 md:h-2 hover:bg-white/60'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* RoyalSmoke Reserve Club - 3-Tier Membership */}
            <div className="mb-12 md:mb-16">
                <div className="text-center mb-8 md:mb-12">
                    <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-full px-4 py-2 mb-4">
                        <Crown size={16} className="text-purple-400" />
                        <span className="text-purple-300 font-extrabold text-xs md:text-sm tracking-wide">RESERVE CLUB</span>
                    </div>

                    {/* Countdown Timer */}
                    <div className="mb-4">
                        <CountdownTimer targetDate={getNextDropDate()} />
                    </div>

                    <h2 className="text-3xl md:text-5xl font-serif font-bold text-white mb-3 md:mb-4">Choose your level of access. Save more. Get priority. Never miss a drop.</h2>
                    <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto">Every tier includes our Freshness & Authenticity Guarantee on all orders.</p>
                    <div className="mt-4 inline-flex items-center gap-2 bg-dark-800 border border-gray-700 rounded-full px-4 py-2">
                        <Shield size={14} className="text-green-400" />
                        <span className="text-gray-300 text-xs md:text-sm">Freshness & Authenticity Guarantee on all orders</span>
                    </div>
                </div>

                {/* 3-Tier Grid */}
                <div className="grid md:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
                    {/* Tier 1: Status Access */}
                    <div className="bg-dark-800 border border-gray-700 rounded-2xl md:rounded-3xl p-5 md:p-6 flex flex-col hover:border-gray-600 transition-all duration-300">
                        <div className="mb-4">
                            <div className="text-gray-400 text-sm font-semibold mb-1">TIER 1</div>
                            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Member Access</h3>
                            <p className="text-gray-400 text-sm mb-2">Best for: casual buyers who want better pricing + early access.</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl md:text-4xl font-extrabold text-white">R299</span>
                                <span className="text-gray-400">/mo</span>
                            </div>
                        </div>

                        <div className="space-y-3 flex-1 mb-6">
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                    <Percent size={12} className="text-blue-400" />
                                </div>
                                <div>
                                    <div className="text-white text-sm font-medium">10% storewide discount</div>
                                    <div className="text-gray-500 text-xs">Up to R1,000 savings/month</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                    <Package size={12} className="text-green-400" />
                                </div>
                                <div>
                                    <div className="text-white text-sm font-medium">Box-price on 6+ singles</div>
                                    <div className="text-gray-500 text-xs">Wholesale-style pricing unlocked</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                    <Truck size={12} className="text-green-400" />
                                </div>
                                <div>
                                    <div className="text-white text-sm font-medium">R99 shipping credit</div>
                                    <div className="text-gray-500 text-xs">Use it or lose it monthly</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 bg-gold-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                    <Clock size={12} className="text-gold-400" />
                                </div>
                                <div>
                                    <div className="text-white text-sm font-medium">24-hour early access to new drops</div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => handleSelectMembership('member-access', 'Member Access', 299, 'Monthly: 10% storewide discount (up to R1,000/month) + box pricing on 6+ + R99 shipping credit + 24h early access')}
                            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-all duration-300"
                        >
                            Get Member Access
                        </button>

                        <div className="text-center mt-3">
                            <span className="text-gray-500 text-xs">Annual: R2,990/yr (2 months free)</span>
                        </div>
                    </div>

                    {/* Tier 2: Flagship Reserve+ */}
                    <div className="relative bg-gradient-to-b from-purple-900/50 to-dark-800 border-2 border-purple-500 rounded-2xl md:rounded-3xl p-5 md:p-6 flex flex-col shadow-2xl shadow-purple-500/20 scale-[1.02] md:scale-105">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <div className="bg-purple-500 text-white text-xs font-extrabold px-4 py-1 rounded-full flex items-center gap-1">
                                <Star size={12} /> MOST POPULAR
                            </div>
                        </div>

                        <div className="mb-4 mt-2">
                            <div className="text-purple-300 text-sm font-semibold mb-1">TIER 2</div>
                            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Reserve Club</h3>
                            <p className="text-gray-400 text-sm mb-2">Best for: regular buyers who want "auto-savings" + drop protection.</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl md:text-4xl font-extrabold text-white">R1199</span>
                                <span className="text-gray-400">/mo</span>
                            </div>
                        </div>

                        <div className="space-y-3 flex-1 mb-6">
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                    <Gift size={12} className="text-green-400" />
                                </div>
                                <div>
                                    <div className="text-white text-sm font-medium">1 free best-seller cigar/month</div>
                                    <div className="text-gray-500 text-xs">Curated monthly selection</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                    <Percent size={12} className="text-blue-400" />
                                </div>
                                <div>
                                    <div className="text-white text-sm font-medium">15% storewide discount</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                    <Truck size={12} className="text-green-400" />
                                </div>
                                <div>
                                    <div className="text-white text-sm font-medium">R99 shipping credit</div>
                                    <div className="text-gray-500 text-xs">Monthly</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 bg-gold-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                    <Clock size={12} className="text-gold-400" />
                                </div>
                                <div>
                                    <div className="text-white text-sm font-medium">48-hour early access to new drops</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                    <Crown size={12} className="text-purple-400" />
                                </div>
                                <div>
                                    <div className="text-white text-sm font-medium">Reserve Token</div>
                                    <div className="text-gray-500 text-xs">We'll hold your spot on limited drops for 24 hours</div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => handleSelectMembership('reserve-club', 'Reserve Club', 1199, 'Monthly: 1 free best-seller cigar + 15% off + R99 shipping credit + 48h early access + Reserve Token')}
                            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-extrabold py-3 rounded-xl transition-all duration-300 shadow-lg"
                        >
                            Join Reserve Club
                        </button>

                        <div className="text-center mt-3">
                            <span className="text-purple-300 text-xs">Annual: R11,990/yr (2 months free)</span>
                        </div>
                    </div>

                    {/* Tier 3: Founders Black */}
                    <div className="relative bg-gradient-to-b from-gray-900 to-dark-800 border border-gold-500/50 rounded-2xl md:rounded-3xl p-5 md:p-6 flex flex-col">
                        <div className="absolute -top-3 right-4">
                            <div className="bg-gold-500 text-black text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
                                <Shield size={12} /> LIMITED
                            </div>
                        </div>

                        <div className="mb-4 mt-2">
                            <div className="text-gold-400 text-sm font-semibold mb-1">TIER 3</div>
                            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Founders Black</h3>
                            <p className="text-gray-400 text-sm mb-2">Best for: collectors who want priority access, speed, and concierge sourcing.</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl md:text-4xl font-extrabold text-white">R3,499</span>
                                <span className="text-gray-400">/mo</span>
                            </div>
                        </div>


                        <div className="space-y-3 flex-1 mb-4">
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                    <Gift size={12} className="text-green-400" />
                                </div>
                                <div>
                                    <div className="text-white text-sm font-medium">2 free best-seller cigars/month</div>
                                    <div className="text-gray-500 text-xs">Premium monthly selection</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                    <Percent size={12} className="text-blue-400" />
                                </div>
                                <div>
                                    <div className="text-white text-sm font-medium">20% storewide discount</div>
                                    <div className="text-gray-500 text-xs">Best pricing tier</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                    <Truck size={12} className="text-green-400" />
                                </div>
                                <div>
                                    <div className="text-white text-sm font-medium">Free same-day dispatch priority</div>
                                    <div className="text-gray-500 text-xs">Weekdays before 2pm</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-5 h-5 bg-gold-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                    <Crown size={12} className="text-gold-400" />
                                </div>
                                <div>
                                    <div className="text-white text-sm font-medium">Concierge sourcing</div>
                                    <div className="text-gray-500 text-xs">1 request/month</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-5 h-5 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                <Sparkles size={12} className="text-purple-400" />
                            </div>
                            <div>
                                <div className="text-white text-sm font-medium">Founder-only drops + private tastings</div>
                                <div className="text-gray-500 text-xs">Quarterly</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-5 h-5 bg-gold-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                <Star size={12} className="text-gold-400" />
                            </div>
                            <div>
                                <div className="text-white text-sm font-medium">Founders Coin</div>
                                <div className="text-gray-500 text-xs">Status + perks</div>
                            </div>
                        </div>


                        <button
                            onClick={() => handleSelectMembership('founders-black', 'Founders Black', 3499, 'Monthly: 2 free best-seller cigars + 20% off + same-day dispatch + concierge sourcing + Founder-only drops + Founders Coin')}
                            className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-black font-extrabold py-3 rounded-xl transition-all duration-300 shadow-lg"
                        >
                            Claim a Founders Spot
                        </button>

                        <div className="text-center mt-3">
                            <span className="text-gold-400 text-xs">Annual: R34,990/yr (2 months free) + Founders gift</span>
                        </div>
                    </div>
                </div>

                <div className="mt-8 max-w-4xl mx-auto">
                    <div className="bg-dark-800 border border-gray-700 rounded-xl md:rounded-2xl overflow-hidden">
                        <div className="px-4 md:px-6 py-4 border-b border-gray-700">
                            <h4 className="text-white font-bold text-base md:text-lg">Membership FAQ</h4>
                            <p className="text-gray-400 text-sm">Quick answers before you join.</p>
                        </div>

                        <div className="divide-y divide-gray-700">
                            {membershipFaqs.map((item, idx) => {
                                const isOpen = openFaq === idx;
                                return (
                                    <button
                                        key={item.q}
                                        type="button"
                                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                                        className="w-full text-left px-4 md:px-6 py-4 hover:bg-white/5 transition"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="text-white font-semibold">{item.q}</div>
                                            <ChevronDown
                                                size={18}
                                                className={`shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                            />
                                        </div>
                                        {isOpen && (
                                            <div className="mt-2 text-sm text-gray-400 leading-relaxed">
                                                {item.a}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Guarantee Banner */}
                <div className="mt-8 max-w-4xl mx-auto">
                    <div className="bg-dark-800 border border-gray-700 rounded-xl md:rounded-2xl p-4 md:p-6">
                        <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
                                <Shield size={24} className="text-green-400" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-base md:text-lg mb-1">Freshness & Regulatory Guarantee</h4>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Cracked or unsmokable sticks replaced free. 18+ Adult use only. 
                                    <strong className="text-white font-bold"> ID must be presented upon delivery</strong> in accordance with South African regulatory guidelines.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Our Process Section */}
            <div className="mb-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-serif font-bold text-white mb-2">How It Works</h2>
                    <p className="text-gray-400">From selection to your door—seamless and secure</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center mb-3 shadow-lg">
                            <Search className="text-black" size={24} />
                        </div>
                        <h3 className="text-white font-semibold mb-1 text-sm md:text-base">Browse</h3>
                        <p className="text-gray-400 text-xs md:text-sm">Explore our curated collection</p>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center mb-3 shadow-lg">
                            <ShoppingBag className="text-black" size={24} />
                        </div>
                        <h3 className="text-white font-semibold mb-1 text-sm md:text-base">Select</h3>
                        <p className="text-gray-400 text-xs md:text-sm">Add your favorites to cart</p>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center mb-3 shadow-lg">
                            <CreditCard className="text-black" size={24} />
                        </div>
                        <h3 className="text-white font-semibold mb-1 text-sm md:text-base">Pay</h3>
                        <p className="text-gray-400 text-xs md:text-sm">Secure checkout</p>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center mb-3 shadow-lg">
                            <Package className="text-black" size={24} />
                        </div>
                        <h3 className="text-white font-semibold mb-1 text-sm md:text-base">Pack</h3>
                        <p className="text-gray-400 text-xs md:text-sm">Carefully prepared</p>
                    </div>

                    <div className="flex flex-col items-center text-center col-span-2 md:col-span-1">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center mb-3 shadow-lg">
                            <Truck className="text-black" size={24} />
                        </div>
                        <h3 className="text-white font-semibold mb-1 text-sm md:text-base">Deliver</h3>
                        <p className="text-gray-400 text-xs md:text-sm">Fast, tracked delivery</p>
                    </div>
                </div>
            </div>

            {/* Section Title */}
            <div className="mb-6 md:mb-8">
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2">Premium Collection</h2>
                <p className="text-gray-400 text-sm md:text-base">Handpicked cigars from the finest tobacco regions</p>
            </div>

            {/* Product Grid - Uber Eats Style */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                {products.map(product => (
                    <div key={product.id} className="bg-dark-800 rounded-xl overflow-hidden border border-gray-800 hover:border-gold-500/50 transition duration-300 flex flex-col shadow-lg">
                        <div className="relative aspect-square bg-gray-900 overflow-hidden">
                            {/* Product Image */}
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
                                className="w-full h-full object-cover hover:scale-105 transition duration-500"
                            />

                            {isVip && isTopSeller(product) && (
                                <div className="absolute top-2 left-2 bg-purple-600/90 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-purple-300/40">
                                    VIP SALE
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
                                <p className="text-gray-500 text-xs hidden md:block line-clamp-1">{product.category}</p>
                            </div>

                            <div className="flex justify-between items-center mt-3">
                                {isVip && isTopSeller(product) ? (
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

export default Home;
