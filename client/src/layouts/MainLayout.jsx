import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShoppingCart, LogIn, Menu, X, Zap, Leaf } from 'lucide-react';
import { useCart } from '../context/CartContext';
import LeadMagnetPopup from '../components/LeadMagnetPopup';

const MainLayout = () => {
    const { cartCount } = useCart();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAgeVerified, setIsAgeVerified] = useState(false);
    const [installPromptEvent, setInstallPromptEvent] = useState(null);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [isIos, setIsIos] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showLeadMagnet, setShowLeadMagnet] = useState(false);

    useEffect(() => {
        const verified = localStorage.getItem('royal_age_verified');
        if (verified) setIsAgeVerified(true);
    }, []);

    // Lead Magnet Popup Triggers
    useEffect(() => {
        const captured = localStorage.getItem('royal_lead_captured');
        if (captured) return;

        // Trigger 1: After 30 seconds
        const timer = setTimeout(() => {
            setShowLeadMagnet(true);
        }, 30000);

        // Trigger 2: Exit intent
        const handleMouseLeave = (e) => {
            if (e.clientY <= 0 && !captured) {
                setShowLeadMagnet(true);
            }
        };

        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);



    useEffect(() => {
        const ua = navigator.userAgent || '';
        const ios = /iphone|ipad|ipod/i.test(ua);
        setIsIos(ios);

        const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone;
        setIsStandalone(!!standalone);

        const dismissed = localStorage.getItem('royal_install_dismissed');

        const onBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setInstallPromptEvent(e);
            if (!dismissed && !standalone) setShowInstallPrompt(true);
        };

        const onAppInstalled = () => {
            setShowInstallPrompt(false);
            setInstallPromptEvent(null);
            setIsStandalone(true);
        };

        window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
        window.addEventListener('appinstalled', onAppInstalled);

        if (ios && !dismissed && !standalone) {
            setShowInstallPrompt(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
            window.removeEventListener('appinstalled', onAppInstalled);
        };
    }, []);

    const handleAgeVerify = (over18) => {
        if (over18) {
            localStorage.setItem('royal_age_verified', 'true');
            setIsAgeVerified(true);
        } else {
            window.location.href = 'https://google.com';
        }
    };

    if (!isAgeVerified) {
        return (
            <div className="fixed inset-0 bg-black z-50 flex items-center justify-center p-4">
                <div className="bg-dark-800 border-2 border-gold-500 p-8 rounded-lg max-w-md w-full text-center">
                    <h1 className="text-3xl font-serif text-gold-500 mb-4">RoyalSmoke Exclusives</h1>
                    <p className="text-gray-300 mb-8">Are you over the age of 21?</p>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => handleAgeVerify(true)}
                            className="bg-gold-500 text-black font-bold py-2 px-6 rounded hover:bg-gold-400 transition"
                        >
                            YES
                        </button>
                        <button
                            onClick={() => handleAgeVerify(false)}
                            className="border border-gray-500 text-gray-300 py-2 px-6 rounded hover:bg-dark-900 transition"
                        >
                            NO
                        </button>
                    </div>
                </div>
            </div>
        );
    }



    return (
        <div className="min-h-screen bg-dark-900 text-gray-100 font-sans">
            {/* Sticky Top Banner - Free Delivery */}
            <div className="sticky top-0 z-50 bg-gradient-to-r from-gold-500 to-gold-600 text-black py-2 px-4 text-center shadow-lg">
                <div className="flex items-center justify-center gap-2 text-sm md:text-base font-bold">
                    <Zap size={16} />
                    <span>🔥 Free same-day delivery on orders R1,000+ (order before 2pm)</span>
                </div>
            </div>

            {/* Lead Magnet Popup */}
            {showLeadMagnet && <LeadMagnetPopup onClose={() => setShowLeadMagnet(false)} />}

            {showInstallPrompt && !isStandalone && (
                <div className="fixed bottom-4 left-4 right-4 z-50">
                    <div className="max-w-xl mx-auto bg-dark-800 border border-gold-600/30 rounded-xl p-4 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-white font-bold">Add RoyalSmoke to your Home Screen</div>
                                {isIos ? (
                                    <div className="text-gray-400 text-sm mt-1">Tap Share, then Add to Home Screen.</div>
                                ) : (
                                    <div className="text-gray-400 text-sm mt-1">Install for quick access and a full-screen app experience.</div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    localStorage.setItem('royal_install_dismissed', '1');
                                    setShowInstallPrompt(false);
                                }}
                                className="text-gray-400 hover:text-white transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {!isIos && installPromptEvent && (
                            <div className="mt-3">
                                <button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            await installPromptEvent.prompt();
                                            await installPromptEvent.userChoice;
                                        } catch {
                                        } finally {
                                            setShowInstallPrompt(false);
                                            setInstallPromptEvent(null);
                                        }
                                    }}
                                    className="w-full bg-gold-500 text-black font-extrabold py-3 rounded-lg hover:bg-gold-400 transition"
                                >
                                    Install
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Navbar */}
            <nav className="bg-dark-800 border-b border-gold-600/30 sticky top-0 z-40">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/" className="text-2xl font-serif text-gold-500 font-bold tracking-wider">
                            ROYAL<span className="text-white">SMOKE</span>
                        </Link>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-8">
                            <Link to="/" className="hover:text-gold-400 transition">Home</Link>
                            <Link to="/cigars" className="hover:text-gold-400 transition">Collection</Link>
                            <Link to="/about" className="hover:text-gold-400 transition">About</Link>
                            <Link to="/dispensary" className="hover:text-green-500 transition-all flex items-center gap-2 group">
                                <Leaf className="w-5 h-5 group-hover:fill-green-500/20" />
                                <span>Dispensary</span>
                            </Link>
                            <Link to="/account" className="hover:text-gold-400 transition flex items-center gap-2">
                                <LogIn className="w-5 h-5" />
                                <span>My Account</span>
                            </Link>
                            <Link to="/cart" className="relative hover:text-gold-400 transition">
                                <ShoppingCart className="w-6 h-6" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-gold-500 text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gold-500">
                                {isMenuOpen ? <X /> : <Menu />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-dark-800 px-4 py-2 border-t border-gray-700">
                        <Link to="/" className="block py-2 hover:text-gold-400" onClick={() => setIsMenuOpen(false)}>Home</Link>
                        <Link to="/cigars" className="block py-2 hover:text-gold-400" onClick={() => setIsMenuOpen(false)}>Collection</Link>
                        <Link to="/about" className="block py-2 hover:text-gold-400" onClick={() => setIsMenuOpen(false)}>About</Link>
                        <Link to="/dispensary" className="block py-2 text-green-500 font-bold flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                            <Leaf size={18} />
                            Dispensary
                        </Link>
                        <Link to="/account" className="block py-2 hover:text-gold-400" onClick={() => setIsMenuOpen(false)}>My Account</Link>
                        <Link to="/cart" className="block py-2 hover:text-gold-400" onClick={() => setIsMenuOpen(false)}>Cart ({cartCount})</Link>
                    </div>
                )}
            </nav>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-dark-800 py-8 border-t border-gray-800 mt-auto">
                <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-4">
                        <Link className="hover:text-gray-300" to="/about">About</Link>
                        <Link className="hover:text-gray-300" to="/shipping">Shipping</Link>
                        <Link className="hover:text-gray-300" to="/returns">Returns</Link>
                        <Link className="hover:text-gray-300" to="/faq">FAQ</Link>
                        <Link className="hover:text-gray-300" to="/contact">Contact</Link>
                    </div>
                    <p>&copy; {new Date().getFullYear()} RoyalSmoke Exclusives. 21+ Only.</p>
                </div>
            </footer>
        </div>
    );
};

export default MainLayout;
