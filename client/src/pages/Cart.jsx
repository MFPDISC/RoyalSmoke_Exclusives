import React, { useState, useEffect, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { Trash2, AlertCircle, ShoppingBag, MapPin, Loader, ArrowLeft, ArrowRight, CreditCard, Crown, Gift, Percent, MessageCircle, Shield, Star, Zap, Truck, Package, Clock, Users } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import vipBanner from '../assets/cigars/royalsmoke-exclusives_cigars.jpeg';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const Cart = () => {
    const {
        cartItems,
        removeFromCart,
        updateQuantity,
        addToCart,
        bulkDiscountApplies,
        bulkDiscountAmount,
        bulkDiscountThreshold
    } = useCart();
    const [step, setStep] = useState(1);
    const [fieldStep, setFieldStep] = useState(0);
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        phone: '',
        email: '',
        dob: '',
        address: '',
        postalCode: '',
        latitude: null,
        longitude: null
    });
    const [isOrdering, setIsOrdering] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const addressInputRef = useRef(null);
    const autocompleteRef = useRef(null);
    const [checkoutAuth, setCheckoutAuth] = useState({
        show: false,
        pin: '',
        password: '',
        confirm: '',
        message: '',
        loading: false
    });

    const navigate = useNavigate();

    const usdtAddress = import.meta.env.VITE_USDT_ADDRESS || '';
    const usdtNetwork = import.meta.env.VITE_USDT_NETWORK || 'TRC20';
    const payshapRecipient = import.meta.env.VITE_PAYSHAP_RECIPIENT || '';

    const whatsappNumber = '27727346573';

    // Check for any membership tier in cart
    const membershipInCart = cartItems.find((i) => String(i.id).startsWith('membership-') || i.category === 'Membership');
    const hasVipMembership = !!membershipInCart;
    const [vipTier, setVipTier] = useState(null); // 'status', 'reserve-club', 'founders-black'

    useEffect(() => {
        try {
            const tier = localStorage.getItem('royal_vip');
            if (tier && tier !== 'true') {
                setVipTier(tier);
            } else if (tier === 'true') {
                setVipTier('reserve-club'); // Legacy support
            }
        } catch {
            setVipTier(null);
        }
    }, []);

    // Determine active tier from cart or localStorage
    const getActiveTier = () => {
        if (membershipInCart?.tier) return membershipInCart.tier;
        return vipTier;
    };

    const activeTier = getActiveTier();
    const isVipActive = !!activeTier;

    // Tier-based discount rates
    const getTierDiscount = (tier) => {
        switch (tier) {
            case 'status': return 0.10; // 10% off
            case 'reserve-club': return 0.15; // 15% off
            case 'founders-black': return 0.20; // 20% off
            default: return 0;
        }
    };

    // Tier pricing
    const tierPrices = {
        'status': 299,
        'reserve-club': 1499,
        'founders-black': 2499
    };

    const roundMoney = (n) => Math.round(Number(n) * 100) / 100;

    const getOriginalUnitPrice = (item) => {
        if (String(item?.id).startsWith('membership-') || item?.category === 'Membership') return Number(item.price_zar);
        return Number(item.original_price_zar ?? item.price_zar);
    };

    const getEffectiveUnitPrice = (item, quantity) => {
        if (String(item?.id).startsWith('membership-') || item?.category === 'Membership') return Number(item.price_zar);

        const original = getOriginalUnitPrice(item);
        const current = Number(item.price_zar);

        // Tier-based discounts
        if (activeTier) {
            const discount = getTierDiscount(activeTier);
            // Box-price on 6+ singles for all tiers
            if (quantity >= 6) {
                return roundMoney(original * 0.75); // 25% off (box price)
            }
            return roundMoney(original * (1 - discount));
        }

        // Non-member Volume Discounts
        if (quantity >= 10) return roundMoney(original * 0.80); // 20% off for 10+
        if (quantity >= 5) return roundMoney(original * 0.90);  // 10% off for 5+

        return current;
    };

    // Calculate potential savings with Reserve Club (middle tier)
    const getReserveClubPrice = (original) => roundMoney(Number(original) * 0.85);

    const cartLines = cartItems.map((item) => {
        const qty = Number(item.quantity || 1);
        const originalUnit = getOriginalUnitPrice(item);
        const effectiveUnit = getEffectiveUnitPrice(item, qty);
        const savings = roundMoney(Math.max(0, originalUnit - effectiveUnit) * qty);

        // Calculate next tier for upsell
        let nextTierMsg = null;
        if (!isVipActive && !String(item.id).includes('membership')) {
            if (qty < 5) nextTierMsg = `Buy ${5 - qty} more for 10% off`;
            else if (qty < 10) nextTierMsg = `Buy ${10 - qty} more for 20% off`;
        }

        return {
            item,
            qty,
            originalUnit,
            effectiveUnit,
            lineTotal: roundMoney(effectiveUnit * qty),
            savings,
            isDiscounted: effectiveUnit < originalUnit,
            isMembership: String(item.id).startsWith('membership-') || item.category === 'Membership',
            nextTierMsg
        };
    });


    useEffect(() => {
        const saved = localStorage.getItem('royal_customer');
        if (!saved) return;
        try {
            const c = JSON.parse(saved);
            setCustomerInfo(prev => ({
                ...prev,
                name: prev.name || c.name || '',
                phone: prev.phone || c.phone || '',
                email: prev.email || c.email || '',
                dob: prev.dob || c.date_of_birth || '',
                address: prev.address || c.address || '',
                postalCode: prev.postalCode || c.postal_code || ''
            }));
        } catch {
            localStorage.removeItem('royal_customer');
        }
    }, []);

    const updateField = (field, value) => {
        setCustomerInfo(prev => ({ ...prev, [field]: value }));
    };

    const requestCheckoutPin = async () => {
        if (!customerInfo.phone) {
            alert('Please enter your phone number first');
            return;
        }
        setCheckoutAuth(prev => ({ ...prev, loading: true, message: '' }));
        try {
            await axios.post(`${API}/auth/request-pin`, {
                name: customerInfo.name,
                phone: customerInfo.phone,
                email: customerInfo.email
            });
            setCheckoutAuth(prev => ({ ...prev, loading: false, message: 'PIN sent to your phone.' }));
        } catch (err) {
            setCheckoutAuth(prev => ({ ...prev, loading: false }));
            alert(err.response?.data?.error || 'Could not send PIN');
        }
    };

    const setCheckoutPassword = async () => {
        if (!customerInfo.phone) {
            alert('Please enter your phone number first');
            return;
        }
        if (!checkoutAuth.pin || !checkoutAuth.password) {
            alert('Please enter your PIN and password');
            return;
        }
        if (checkoutAuth.password !== checkoutAuth.confirm) {
            alert('Passwords do not match');
            return;
        }

        setCheckoutAuth(prev => ({ ...prev, loading: true, message: '' }));
        try {
            const res = await axios.post(`${API}/auth/set-password`, {
                phone: customerInfo.phone,
                pin: checkoutAuth.pin,
                password: checkoutAuth.password
            });
            if (res.data?.customer) {
                localStorage.setItem('royal_customer', JSON.stringify(res.data.customer));
            }
            setCheckoutAuth({ show: false, pin: '', password: '', confirm: '', message: 'Password saved. You can log in anytime.', loading: false });
        } catch (err) {
            setCheckoutAuth(prev => ({ ...prev, loading: false }));
            alert(err.response?.data?.error || 'Failed to set password');
        }
    };

    useEffect(() => {
        const inputEl = addressInputRef.current;
        if (!inputEl) return;
        if (!window.google) return;
        if (autocompleteRef.current) return;

        const autocomplete = new window.google.maps.places.Autocomplete(inputEl, {
            types: ['address'],
            componentRestrictions: { country: 'za' },
            fields: ['address_components', 'formatted_address', 'geometry']
        });

        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (!place.geometry) return;

            let postalCode = '';
            const fullAddress = place.formatted_address;

            place.address_components?.forEach(component => {
                if (component.types.includes('postal_code')) {
                    postalCode = component.long_name;
                }
            });

            setCustomerInfo(prev => ({
                ...prev,
                address: fullAddress,
                postalCode: postalCode,
                latitude: place.geometry.location.lat(),
                longitude: place.geometry.location.lng()
            }));
        });

        autocompleteRef.current = autocomplete;
    }, [step]);

    const addMembership = (tier) => {
        if (hasVipMembership) {
            // Remove existing membership first
            const existingMembership = cartItems.find((i) => String(i.id).startsWith('membership-') || i.category === 'Membership');
            if (existingMembership) removeFromCart(existingMembership.id);
        }

        const tierConfig = {
            'status': {
                id: 'membership-status',
                name: 'Status Access Membership',
                price_zar: 299,
                description: 'Monthly: 10-15% storewide + early access + shipping credit if ordered'
            },
            'reserve-club': {
                id: 'membership-reserve-club',
                name: 'Reserve Club Membership',
                price_zar: 1499,
                description: 'Monthly: 2 curated premiums + 15-20% off + free shipping'
            },
            'founders-black': {
                id: 'membership-founders-black',
                name: 'Founders Black Membership',
                price_zar: 2499,
                description: 'Monthly: 3 curated premiums + 20% off + same-day dispatch + concierge sourcing'
            }
        };

        const config = tierConfig[tier];
        if (!config) return;

        try {
            localStorage.setItem('royal_vip', tier);
            setVipTier(tier);
        } catch {
            // ignore
        }

        addToCart({
            ...config,
            image_url: vipBanner,
            stock_qty: tier === 'founders-black' ? 200 : 999,
            isSubscription: true,
            tier: tier
        });
    };

    const handleManualPayment = async (method) => {
        if (cartItems.length === 0) return;
        if (!validateStep()) return;
        if (!customerInfo.address) {
            alert('Please fill in your delivery address');
            return;
        }

        if (method === 'usdt' && !usdtAddress) {
            alert('USDT address not configured yet. Set VITE_USDT_ADDRESS first.');
            return;
        }
        if (method === 'payshap' && !payshapRecipient) {
            alert('PayShap recipient not configured yet. Set VITE_PAYSHAP_RECIPIENT first.');
            return;
        }

        setIsOrdering(true);

        try {
            const orderData = {
                customer: {
                    name: customerInfo.name,
                    phone: customerInfo.phone,
                    email: customerInfo.email || null,
                    dob: customerInfo.dob,
                    address: customerInfo.address,
                    postal_code: customerInfo.postalCode || null,
                    latitude: customerInfo.latitude,
                    longitude: customerInfo.longitude
                },
                total_amount: total,
                delivery_fee: deliveryFee,
                items: cartLines.map(l => ({
                    product_id: l.item.id,
                    quantity: l.qty,
                    price: l.effectiveUnit
                })),
                latitude: customerInfo.latitude,
                longitude: customerInfo.longitude
            };

            const res = await axios.post(`${API}/orders`, orderData);
            const orderId = res.data?.orderId;

            if (!orderId) {
                throw new Error('Order not created');
            }

            navigate(`/payment-instructions?method=${encodeURIComponent(method)}&orderId=${encodeURIComponent(orderId)}&amount=${encodeURIComponent(total)}`);
        } catch (error) {
            console.error('Checkout failed', error);
            alert('Checkout failed: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsOrdering(false);
        }
    };

    const getLocation = async () => {
        if (!navigator.geolocation) {
            alert('Geolocation not supported by your browser');
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                try {
                    // Use Google Maps Geocoder
                    if (!window.google || !window.google.maps) {
                        throw new Error('Google Maps not loaded');
                    }

                    const geocoder = new window.google.maps.Geocoder();
                    const response = await geocoder.geocode({ location: { lat, lng } });

                    if (response.results && response.results[0]) {
                        const result = response.results[0];
                        const fullAddress = result.formatted_address;
                        let postalCode = '';

                        result.address_components?.forEach(component => {
                            if (component.types.includes('postal_code')) {
                                postalCode = component.long_name;
                            }
                        });

                        setCustomerInfo(prev => ({
                            ...prev,
                            address: fullAddress,
                            postalCode: postalCode || prev.postalCode,
                            latitude: lat,
                            longitude: lng
                        }));
                    }
                } catch (error) {
                    console.log('Could not fetch address, location saved');
                    // Still save coordinates even if address lookup fails
                    setCustomerInfo(prev => ({
                        ...prev,
                        latitude: lat,
                        longitude: lng
                    }));
                }

                setIsLocating(false);
            },
            (err) => {
                console.error(err);
                alert('Could not get your location. Please enable location services.');
                setIsLocating(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    // Zone Logic
    const getDeliveryFee = () => {
        if (customerInfo.latitude && customerInfo.longitude) {
            const lat = Number(customerInfo.latitude);
            const lng = Number(customerInfo.longitude);
            const isPretoriaCentral =
                lat >= -25.80 && lat <= -25.70 &&
                lng >= 28.15 && lng <= 28.30;

            return isPretoriaCentral ? 175 : 350;
        }
        const code = parseInt(customerInfo.postalCode);
        if (code) {
            if (code >= 1 && code <= 186) return 175;
            return 350;
        }
        if (customerInfo.address) return 350;
        return 0;
    };

    const deliveryFee = getDeliveryFee();

    const cartSubtotalEffective = cartLines.reduce((acc, l) => acc + l.lineTotal, 0);
    const total = roundMoney(cartSubtotalEffective + (cartItems.length > 0 ? deliveryFee : 0));

    // Membership comparison (for upsell)
    const itemsLinesNoMembership = cartLines.filter((l) => !l.isMembership);
    const itemsSubtotalNoVip = roundMoney(itemsLinesNoMembership.reduce((acc, l) => acc + (l.originalUnit * l.qty), 0));
    const itemsSubtotalReserveClub = roundMoney(itemsLinesNoMembership.reduce((acc, l) => acc + (getReserveClubPrice(l.originalUnit) * l.qty), 0));
    const reserveClubSavingsOnItems = roundMoney(Math.max(0, itemsSubtotalNoVip - itemsSubtotalReserveClub));

    const standardTotal = roundMoney(itemsSubtotalNoVip + (cartItems.length > 0 ? deliveryFee : 0));
    const reserveClubTotalIfAdded = roundMoney(itemsSubtotalReserveClub + (cartItems.length > 0 ? deliveryFee : 0) + tierPrices['reserve-club']);

    const buildPayfastFormAndSubmit = (paymentUrl, paymentData) => {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = paymentUrl;
        Object.entries(paymentData).forEach(([key, value]) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = String(value);
            form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
    };

    const validateStep = () => {
        if (step === 1) {
            if (!customerInfo.name || !customerInfo.phone) {
                alert('Please fill in your name and mobile number');
                return false;
            }
        }
        if (step === 2) {
            const addr = String(customerInfo.address || '').trim();
            const hasLetter = /[a-zA-Z]/.test(addr);
            if (!addr || addr.length < 6 || !hasLetter) {
                alert('Please fill in your delivery address');
                return false;
            }
        }
        return true;
    };

    const buildWhatsappMessage = () => {
        const itemsText = cartLines
            .map((l) => {
                const line = `${l.qty} x ${l.item.name} @ R ${l.effectiveUnit.toFixed(2)} = R ${l.lineTotal.toFixed(2)}`;
                if (String(l.item.id) === 'membership-monthly') return `${line} (VIP Membership)`;
                return line;
            })
            .join('\n');

        const coords = customerInfo.latitude && customerInfo.longitude
            ? `${customerInfo.latitude}, ${customerInfo.longitude}`
            : 'Not provided';

        return [
            'RoyalSmoke Order (WhatsApp Checkout)',
            '',
            `Name: ${customerInfo.name}`,
            `Phone: ${customerInfo.phone}`,
            customerInfo.email ? `Email: ${customerInfo.email}` : null,
            '',
            `Address: ${customerInfo.address}`,
            `Location: ${coords}`,
            '',
            'Items:',
            itemsText,
            '',
            `Items Total: R ${cartSubtotalEffective.toFixed(2)}`,
            `Delivery: R ${deliveryFee.toFixed(2)}`,
            `Grand Total: R ${total.toFixed(2)}`,
            '',
            isVipActive ? 'VIP: Active (Box Price applied)' : 'VIP: Not active'
        ]
            .filter(Boolean)
            .join('\n');
    };

    const handleWhatsappCheckout = () => {
        if (cartItems.length === 0) return;
        if (!validateStep()) return;
        if (!customerInfo.address) {
            alert('Please fill in your delivery address');
            return;
        }

        const message = buildWhatsappMessage();
        const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const nextStep = () => {
        if (!validateStep()) return;
        setStep(prev => Math.min(3, prev + 1));
        setFieldStep(0);
    };

    const prevStep = () => {
        setStep(prev => Math.max(1, prev - 1));
        setFieldStep(0);
    };

    const nextField = () => {
        if (step === 1 && fieldStep === 0 && !customerInfo.name) {
            alert('Please enter your name');
            return;
        }
        if (step === 1 && fieldStep === 1 && !customerInfo.phone) {
            alert('Please enter your phone number');
            return;
        }
        if (step === 1 && fieldStep === 2 && !customerInfo.dob) {
            alert('Please select your date of birth');
            return;
        }
        if (step === 2 && fieldStep === 0 && !customerInfo.address) {
            alert('Please enter your address');
            return;
        }

        const maxFields = step === 1 ? 3 : step === 2 ? 0 : 0;
        if (fieldStep < maxFields) {
            setFieldStep(prev => prev + 1);
        } else {
            nextStep();
        }
    };

    const prevField = () => {
        if (fieldStep > 0) {
            setFieldStep(prev => prev - 1);
        } else if (step > 1) {
            prevStep();
            setFieldStep(step === 2 ? 2 : 1);
        }
    };

    const handlePayNow = async () => {
        if (cartItems.length === 0) return;
        if (!validateStep()) return;
        if (!customerInfo.address) {
            alert('Please fill in your delivery address');
            return;
        }

        setIsOrdering(true);

        try {
            const orderData = {
                customer: {
                    name: customerInfo.name,
                    phone: customerInfo.phone,
                    email: customerInfo.email || null,
                    address: customerInfo.address,
                    postal_code: customerInfo.postalCode || null,
                    latitude: customerInfo.latitude,
                    longitude: customerInfo.longitude
                },
                total_amount: total,
                delivery_fee: deliveryFee,
                items: cartLines.map((l) => ({
                    product_id: l.item.id,
                    quantity: l.qty,
                    price: l.effectiveUnit
                })),
                latitude: customerInfo.latitude,
                longitude: customerInfo.longitude
            };

            const res = await axios.post(`${API}/orders`, orderData);
            const orderId = res.data?.orderId;

            if (!orderId) {
                throw new Error('Order not created');
            }

            const paymentRes = await axios.post(`${API}/payfast/create-payment`, {
                orderId,
                amount: total,
                customerName: customerInfo.name,
                customerEmail: customerInfo.email,
                customerPhone: customerInfo.phone,
                items: cartLines.map(l => ({ name: l.item.name, quantity: l.qty }))
            });

            if (!paymentRes.data?.success) {
                throw new Error(paymentRes.data?.error || 'PayFast not available');
            }

            buildPayfastFormAndSubmit(paymentRes.data.paymentUrl, paymentRes.data.paymentData);
        } catch (error) {
            console.error('Checkout failed', error);
            alert('Checkout failed: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsOrdering(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="text-center py-20 text-gray-400">
                <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h2 className="text-2xl font-serif mb-4">Your cart is empty</h2>
                <p>Go find some premium smokes.</p>
            </div>
        );
    }

    // Full-screen checkout mode (steps 1-3)
    if (step >= 1 && step <= 3) {
        return (
            <div className="fixed inset-0 bg-dark-900 z-50 overflow-y-auto">
                <div className="min-h-screen flex flex-col">
                    {/* Header */}
                    <div className="bg-dark-800 border-b border-gray-800 px-4 py-3 md:px-6 md:py-4">
                        <div className="max-w-4xl mx-auto flex items-center justify-between">
                            <div className="text-lg md:text-xl font-serif text-gold-400">RoyalSmoke Checkout</div>
                            <div className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest border border-gray-700 px-2 py-1 rounded-md">ID Required (21+)</div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-dark-800 px-4 py-3 md:px-6 border-b border-gray-800">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex items-center gap-2">
                                {[1, 2, 3].map(s => (
                                    <div key={s} className="flex-1">
                                        <div className={`h-1 rounded-full transition-all duration-300 ${s < step ? 'bg-green-500' : s === step ? 'bg-gold-500' : 'bg-gray-700'
                                            }`} />
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                                <span className={step === 1 ? 'text-white font-semibold' : ''}>Details</span>
                                <span className={step === 2 ? 'text-white font-semibold' : ''}>Delivery</span>
                                <span className={step === 3 ? 'text-white font-semibold' : ''}>Payment</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex items-center justify-center px-6 py-12">
                        <div className="max-w-2xl w-full">
                            {/* Step 1: Details (name, phone, email) */}
                            {step === 1 && (
                                <div className="space-y-6 md:space-y-8">
                                    {fieldStep === 0 && (
                                        <div className="space-y-4 md:space-y-6">
                                            <div>
                                                <h2 className="text-2xl md:text-3xl font-serif text-white mb-2">What's your name?</h2>
                                                <p className="text-sm md:text-base text-gray-400">We'll use this for your order confirmation</p>
                                            </div>
                                            <input
                                                type="text"
                                                autoComplete="name"
                                                value={customerInfo.name}
                                                onChange={e => updateField('name', e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && nextField()}
                                                autoFocus
                                                className="w-full bg-dark-800 border-2 border-gray-700 rounded-xl p-4 md:p-6 text-white text-lg md:text-2xl focus:border-gold-500 outline-none transition"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                    )}

                                    {fieldStep === 1 && (
                                        <div className="space-y-4 md:space-y-6">
                                            <div>
                                                <h2 className="text-2xl md:text-3xl font-serif text-white mb-2">Mobile number</h2>
                                                <p className="text-sm md:text-base text-gray-400">This will be your login ID for future orders</p>
                                            </div>
                                            <input
                                                type="tel"
                                                autoComplete="tel"
                                                value={customerInfo.phone}
                                                onChange={e => updateField('phone', e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && nextField()}
                                                autoFocus
                                                className="w-full bg-dark-800 border-2 border-gray-700 rounded-xl p-4 md:p-6 text-white text-lg md:text-2xl focus:border-gold-500 outline-none transition"
                                                placeholder="+27 82 123 4567"
                                            />
                                        </div>
                                    )}

                                    {fieldStep === 2 && (
                                        <div className="space-y-4 md:space-y-6">
                                            <div>
                                                <p className="text-sm md:text-base text-gray-400">Strictly for age verification (21+). <strong className="text-gold-500">A valid original ID must be presented upon delivery</strong> in accordance with regulatory guidelines.</p>
                                            </div>
                                            <input
                                                type="date"
                                                value={customerInfo.dob}
                                                max={new Date().toISOString().split('T')[0]}
                                                onChange={e => updateField('dob', e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && nextField()}
                                                autoFocus
                                                className="w-full bg-dark-800 border-2 border-gray-700 rounded-xl p-4 md:p-6 text-white text-lg md:text-2xl focus:border-gold-500 outline-none transition [color-scheme:dark]"
                                            />
                                        </div>
                                    )}

                                    {fieldStep === 3 && (
                                        <div className="space-y-4 md:space-y-6">
                                            <div>
                                                <h2 className="text-2xl md:text-3xl font-serif text-white mb-2">Email (optional)</h2>
                                                <p className="text-sm md:text-base text-gray-400">For order updates and receipts</p>
                                            </div>
                                            <input
                                                type="email"
                                                autoComplete="email"
                                                value={customerInfo.email}
                                                onChange={e => updateField('email', e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && nextField()}
                                                autoFocus
                                                className="w-full bg-dark-800 border-2 border-gray-700 rounded-xl p-4 md:p-6 text-white text-lg md:text-2xl focus:border-gold-500 outline-none transition"
                                                placeholder="you@email.com"
                                            />

                                            <div className="bg-dark-800 border border-gray-700 rounded-xl p-4 md:p-5">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <div className="text-white font-bold">Secure your account (optional)</div>
                                                        <div className="text-gray-400 text-sm">Set a password now so your dashboard is ready after checkout.</div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCheckoutAuth(prev => ({ ...prev, show: !prev.show, message: '' }))}
                                                        className="text-xs font-bold bg-white text-black px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                                                    >
                                                        {checkoutAuth.show ? 'Hide' : 'Set password'}
                                                    </button>
                                                </div>

                                                {checkoutAuth.message && (
                                                    <div className="mt-3 text-xs text-green-300">{checkoutAuth.message}</div>
                                                )}

                                                {checkoutAuth.show && (
                                                    <div className="mt-4 space-y-3">
                                                        <button
                                                            type="button"
                                                            onClick={requestCheckoutPin}
                                                            disabled={checkoutAuth.loading}
                                                            className="w-full bg-dark-900 border border-gray-700 text-white font-semibold py-2 rounded-lg hover:border-gray-500 transition"
                                                        >
                                                            {checkoutAuth.loading ? 'Sending...' : 'Send PIN to my phone'}
                                                        </button>
                                                        <input
                                                            value={checkoutAuth.pin}
                                                            onChange={(e) => setCheckoutAuth(prev => ({ ...prev, pin: e.target.value }))}
                                                            className="w-full bg-dark-900 border border-gray-700 rounded-lg p-3 text-white focus:border-gold-500 outline-none"
                                                            placeholder="Enter PIN"
                                                        />
                                                        <input
                                                            type="password"
                                                            value={checkoutAuth.password}
                                                            onChange={(e) => setCheckoutAuth(prev => ({ ...prev, password: e.target.value }))}
                                                            autoComplete="new-password"
                                                            className="w-full bg-dark-900 border border-gray-700 rounded-lg p-3 text-white focus:border-gold-500 outline-none"
                                                            placeholder="Create password"
                                                        />
                                                        <input
                                                            type="password"
                                                            value={checkoutAuth.confirm}
                                                            onChange={(e) => setCheckoutAuth(prev => ({ ...prev, confirm: e.target.value }))}
                                                            autoComplete="new-password"
                                                            className="w-full bg-dark-900 border border-gray-700 rounded-lg p-3 text-white focus:border-gold-500 outline-none"
                                                            placeholder="Confirm password"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={setCheckoutPassword}
                                                            disabled={checkoutAuth.loading}
                                                            className="w-full bg-white text-black font-extrabold py-3 rounded-lg hover:bg-gray-100 transition"
                                                        >
                                                            Save password
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 2: Delivery */}
                            {step === 2 && (
                                <div className="space-y-6 md:space-y-8">
                                    {fieldStep === 0 && (
                                        <div className="space-y-4 md:space-y-6">
                                            <div>
                                                <h2 className="text-2xl md:text-3xl font-serif text-white mb-2">Delivery address</h2>
                                                <p className="text-sm md:text-base text-gray-400">Start typing and select from suggestions</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={getLocation}
                                                disabled={isLocating}
                                                className="w-full mb-2 md:mb-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold py-3 md:py-4 rounded-xl hover:from-blue-500 hover:to-blue-400 transition flex justify-center items-center gap-2 md:gap-3 shadow-lg text-sm md:text-base"
                                            >
                                                {isLocating ? (
                                                    <><Loader className="animate-spin" size={18} /><span>Getting your location...</span></>
                                                ) : customerInfo.latitude ? (
                                                    <><MapPin size={18} className="text-green-300" /><span>✓ Location Captured</span></>
                                                ) : (
                                                    <><MapPin size={18} /><span>📍 Use My Current Location</span></>
                                                )}
                                            </button>
                                            <input
                                                ref={addressInputRef}
                                                type="text"
                                                autoComplete="off"
                                                value={customerInfo.address}
                                                onChange={(e) => {
                                                    const v = e.target.value;
                                                    setCustomerInfo(prev => ({
                                                        ...prev,
                                                        address: v,
                                                        postalCode: '',
                                                        latitude: null,
                                                        longitude: null
                                                    }));
                                                }}
                                                autoFocus={!isLocating}
                                                className="w-full bg-dark-800 border-2 border-gray-700 rounded-xl p-4 md:p-6 text-white text-lg md:text-xl focus:border-gold-500 outline-none transition"
                                                placeholder="Start typing your address..."
                                            />
                                            {customerInfo.latitude && customerInfo.longitude && (
                                                <div className="bg-dark-800 border border-gray-700 rounded-xl p-4">
                                                    <div className="text-sm text-gray-400">Delivery Zone</div>
                                                    <div className="text-white font-bold">{deliveryFee === 175 ? 'Pretoria Central' : 'National / Outer Ring'}</div>
                                                    <div className="text-gold-400 font-semibold mt-1">R {deliveryFee.toFixed(2)}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>
                            )}

                            {/* Step 3: Membership Upsell + Payment */}
                            {step === 3 && (
                                <div className="space-y-6 md:space-y-8">
                                    {fieldStep === 0 && !hasVipMembership && (
                                        <div className="space-y-6">
                                            <div className="text-center mb-4 md:mb-6">
                                                <Crown size={40} className="mx-auto text-purple-400 mb-3 md:mb-4 md:w-12 md:h-12" />
                                                <h2 className="text-2xl md:text-3xl font-serif text-white mb-2">Join the Reserve Club?</h2>
                                                <p className="text-sm md:text-base text-gray-300 mb-3">Unlock exclusive pricing & premium perks</p>
                                                <div className="inline-flex items-center gap-2 bg-dark-800 border border-gray-700 rounded-full px-3 py-1.5">
                                                    <Shield size={12} className="text-green-400" />
                                                    <span className="text-gray-400 text-xs">Freshness & Authenticity Guarantee</span>
                                                </div>
                                            </div>

                                            {/* 3-Tier Compact Grid */}
                                            <div className="space-y-3">
                                                {/* Tier 1: VIP Access */}
                                                <div className="bg-dark-800 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-all">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-gray-400 text-xs font-semibold">TIER 1</span>
                                                                <span className="text-green-400 text-xs">R219 value</span>
                                                            </div>
                                                            <h3 className="text-white font-bold">VIP Access</h3>
                                                            <p className="text-gray-400 text-xs">10% off + R99 shipping credit + early access</p>
                                                        </div>
                                                        <div className="text-right ml-4">
                                                            <div className="text-white font-extrabold text-xl">R149</div>
                                                            <div className="text-gray-500 text-xs">/mo</div>
                                                        </div>
                                                        <button
                                                            onClick={() => { addMembership('vip-access'); setFieldStep(1); }}
                                                            className="ml-4 bg-gray-700 hover:bg-gray-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition"
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Tier 2: Reserve Club - RECOMMENDED */}
                                                <div className="relative bg-gradient-to-r from-purple-900/50 to-dark-800 border-2 border-purple-500 rounded-xl p-4 shadow-lg">
                                                    <div className="absolute -top-2.5 left-4">
                                                        <span className="bg-purple-500 text-white text-xs font-extrabold px-3 py-0.5 rounded-full flex items-center gap-1">
                                                            <Star size={10} /> RECOMMENDED
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-purple-300 text-xs font-semibold">TIER 2</span>
                                                                <span className="text-green-400 text-xs">R999 value</span>
                                                            </div>
                                                            <h3 className="text-white font-bold">Reserve Club</h3>
                                                            <p className="text-gray-400 text-xs">1 premium cigar/mo + 15% off + shipping credit</p>
                                                        </div>
                                                        <div className="text-right ml-4">
                                                            <div className="text-white font-extrabold text-xl">R399</div>
                                                            <div className="text-gray-500 text-xs">/mo</div>
                                                        </div>
                                                        <button
                                                            onClick={() => { addMembership('reserve-club'); setFieldStep(1); }}
                                                            className="ml-4 bg-purple-500 hover:bg-purple-600 text-white font-bold px-4 py-2 rounded-lg text-sm transition"
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                    {reserveClubSavingsOnItems > 0 && (
                                                        <div className="mt-3 pt-3 border-t border-purple-500/30">
                                                            <span className="text-green-400 text-xs font-semibold">Save R{reserveClubSavingsOnItems.toFixed(0)} on this order with 15% off</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Tier 3: Founders Black */}
                                                <div className="bg-gradient-to-r from-gray-900 to-dark-800 border border-gold-500/50 rounded-xl p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-gold-400 text-xs font-semibold">TIER 3</span>
                                                                <span className="text-green-400 text-xs">R2,049 value</span>
                                                                <span className="bg-gold-500/20 text-gold-400 text-xs px-2 py-0.5 rounded-full">200 spots</span>
                                                            </div>
                                                            <h3 className="text-white font-bold">Founders Black</h3>
                                                            <p className="text-gray-400 text-xs">2 premiums/mo + 20% off + concierge sourcing</p>
                                                        </div>
                                                        <div className="text-right ml-4">
                                                            <div className="text-white font-extrabold text-xl">R999</div>
                                                            <div className="text-gray-500 text-xs">/mo</div>
                                                        </div>
                                                        <button
                                                            onClick={() => { addMembership('founders-black'); setFieldStep(1); }}
                                                            className="ml-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-black font-bold px-4 py-2 rounded-lg text-sm transition"
                                                        >
                                                            Add
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setFieldStep(1)}
                                                className="w-full border-2 border-gray-700 text-white font-semibold py-3 md:py-4 rounded-xl hover:bg-dark-800 transition text-base md:text-lg"
                                            >
                                                Continue without membership
                                            </button>
                                            <p className="text-xs text-center text-gray-500">All customers receive premium service and fast delivery</p>
                                        </div>
                                    )}

                                    {(fieldStep === 1 || hasVipMembership) && (
                                        <div className="space-y-6">
                                            <div className="text-center mb-6 md:mb-8">
                                                <CreditCard size={40} className="mx-auto text-gold-400 mb-3 md:mb-4 md:w-12 md:h-12" />
                                                <h2 className="text-2xl md:text-3xl font-serif text-white mb-2">Choose payment method</h2>
                                            </div>

                                            {/* Order Summary */}
                                            <div className="bg-dark-800 border border-gray-800 rounded-xl md:rounded-2xl p-4 md:p-6 mb-4 md:mb-6">
                                                {!hasVipMembership && (
                                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                                        <div className="bg-black/20 border border-white/5 rounded-xl p-3">
                                                            <div className="text-xs text-gray-400">Standard</div>
                                                            <div className="text-white font-bold text-base md:text-lg">R {standardTotal.toFixed(2)}</div>
                                                        </div>
                                                        <div className="bg-purple-600/10 border border-purple-400/20 rounded-xl p-3">
                                                            <div className="text-xs text-purple-200">With Reserve Club</div>
                                                            <div className="text-white font-bold text-base md:text-lg">R {reserveClubTotalIfAdded.toFixed(2)}</div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between text-gray-300">
                                                        <span>Items</span>
                                                        <span>R {cartSubtotalEffective.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between text-gray-300">
                                                        <span>Delivery</span>
                                                        <span>R {deliveryFee.toFixed(2)}</span>
                                                    </div>
                                                    {cartLines.some(l => l.savings > 0) && (
                                                        <div className="flex justify-between text-green-300">
                                                            <span>Savings</span>
                                                            <span>- R {roundMoney(cartLines.reduce((a, l) => a + l.savings, 0)).toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between text-lg md:text-xl font-extrabold text-white pt-3 border-t border-gray-700">
                                                        <span>Total</span>
                                                        <span>R {total.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bulk Discount Progress */}
                                            {!isVipActive && itemsLinesNoMembership.length > 0 && (
                                                <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-xl md:rounded-2xl p-4 md:p-5 mb-4 md:mb-6">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Percent size={18} className="text-purple-400" />
                                                        <div className="text-white font-bold text-sm md:text-base">Bulk Discount Progress</div>
                                                    </div>

                                                    {(() => {
                                                        const totalQty = itemsLinesNoMembership.reduce((acc, l) => acc + l.qty, 0);
                                                        const currentTier = totalQty >= 10 ? 20 : totalQty >= 5 ? 10 : 0;
                                                        const nextTier = currentTier === 0 ? 5 : currentTier === 10 ? 10 : 10;
                                                        const nextDiscount = currentTier === 0 ? 10 : currentTier === 10 ? 20 : 20;
                                                        const qtyToNext = currentTier === 0 ? 5 - totalQty : currentTier === 10 ? 10 - totalQty : 0;
                                                        const progress = currentTier === 0 ? (totalQty / 5) * 100 : currentTier === 10 ? ((totalQty - 5) / 5) * 100 : 100;

                                                        return (
                                                            <>
                                                                {currentTier > 0 && (
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-1.5">
                                                                            <Zap size={14} className="text-green-400" />
                                                                            <span className="text-green-300 font-bold text-xs md:text-sm">{currentTier}% OFF Active!</span>
                                                                        </div>
                                                                        <span className="text-gray-400 text-xs">({totalQty} items)</span>
                                                                    </div>
                                                                )}

                                                                {qtyToNext > 0 && (
                                                                    <>
                                                                        <div className="mb-2">
                                                                            <div className="flex justify-between text-xs md:text-sm mb-1.5">
                                                                                <span className="text-gray-300">
                                                                                    {currentTier === 0 ? 'Add' : 'Add'} <span className="text-white font-bold">{qtyToNext} more</span> for {nextDiscount}% off
                                                                                </span>
                                                                                <span className="text-purple-300 font-bold">{Math.min(100, Math.round(progress))}%</span>
                                                                            </div>
                                                                            <div className="h-2 bg-dark-900 rounded-full overflow-hidden">
                                                                                <div
                                                                                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 rounded-full"
                                                                                    style={{ width: `${Math.min(100, progress)}%` }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-xs text-gray-400 mt-2">
                                                                            💡 Bulk discounts apply automatically at checkout
                                                                        </div>
                                                                    </>
                                                                )}

                                                                {currentTier === 20 && (
                                                                    <div className="flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 rounded-lg px-3 py-2">
                                                                        <Crown size={16} className="text-gold-400" />
                                                                        <span className="text-gold-300 font-bold text-sm">Maximum discount unlocked!</span>
                                                                    </div>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            )}

                                            {/* Payment Methods */}
                                            <div className="space-y-4 md:space-y-5">
                                                <button
                                                    onClick={handleWhatsappCheckout}
                                                    disabled={isOrdering}
                                                    className="group relative w-full bg-green-500 text-black font-extrabold py-4 md:py-6 rounded-xl md:rounded-2xl hover:bg-green-400 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                                                >
                                                    <div className="relative flex items-center justify-between px-4 md:px-6">
                                                        <div className="flex items-center gap-3">
                                                            <MessageCircle size={24} />
                                                            <span className="text-xl">Checkout via WhatsApp</span>
                                                        </div>
                                                        <div className="text-xs font-bold bg-black/10 px-3 py-1.5 rounded-md">TEMP</div>
                                                    </div>
                                                </button>

                                                {/* Primary: PayFast */}
                                                <button
                                                    onClick={handlePayNow}
                                                    disabled={isOrdering}
                                                    className="group relative w-full bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 text-black font-extrabold py-4 md:py-6 rounded-xl md:rounded-2xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden"
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                                    {isOrdering ? (
                                                        <div className="flex items-center justify-center gap-3">
                                                            <Loader className="animate-spin" size={24} />
                                                            <span className="text-lg md:text-xl">Processing...</span>
                                                        </div>
                                                    ) : (
                                                        <div className="relative flex items-center justify-between px-4 md:px-6">
                                                            <div className="flex items-center gap-3">
                                                                <CreditCard size={24} />
                                                                <span className="text-xl">Pay Now (PayFast)</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="bg-white text-black text-xs font-extrabold px-3 py-1.5 rounded-md shadow-sm">VISA</span>
                                                                <span className="bg-white text-black text-xs font-extrabold px-3 py-1.5 rounded-md shadow-sm">MASTERCARD</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </button>

                                                <div className="relative">
                                                    <div className="absolute inset-0 flex items-center">
                                                        <div className="w-full border-t border-gray-700"></div>
                                                    </div>
                                                    <div className="relative flex justify-center text-xs">
                                                        <span className="bg-dark-900 px-3 text-gray-500">or pay with</span>
                                                    </div>
                                                </div>

                                                {/* Alternative Methods */}
                                                <button
                                                    onClick={() => handleManualPayment('payshap')}
                                                    disabled={isOrdering}
                                                    className="w-full bg-dark-800 border-2 border-gray-700 text-white font-semibold py-5 rounded-xl hover:border-gray-600 hover:bg-dark-700 transition-all text-lg"
                                                >
                                                    Pay with PayShap
                                                </button>

                                                <button
                                                    onClick={() => handleManualPayment('usdt')}
                                                    disabled={isOrdering}
                                                    className="w-full bg-dark-800 border-2 border-gray-700 text-white font-semibold py-5 rounded-xl hover:border-gray-600 hover:bg-dark-700 transition-all text-lg"
                                                >
                                                    Pay with USDT (Binance / VALR)
                                                </button>

                                                <div className="text-xs text-gray-500 text-center">
                                                    USDT network: <span className="text-gray-300 font-semibold">{usdtNetwork}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-2 text-xs text-gray-500 bg-dark-800 p-3 rounded-xl border border-gray-800">
                                                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                                <p>By proceeding, you confirm you are over 18. ID check required on delivery.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Navigation */}
                            <div className="flex items-center gap-4 mt-12">
                                <button
                                    onClick={step === 3 && fieldStep === 0 ? prevStep : prevField}
                                    disabled={step === 1 && fieldStep === 0}
                                    className="flex-1 border-2 border-gray-700 text-gray-200 font-bold py-4 rounded-xl hover:bg-dark-800 transition disabled:opacity-30 flex justify-center items-center gap-2 text-lg"
                                >
                                    <ArrowLeft size={20} />
                                    Back
                                </button>
                                {(step < 3 || (step === 3 && fieldStep === 0)) && (
                                    <button
                                        onClick={nextField}
                                        className="flex-1 bg-white text-black font-extrabold py-4 rounded-xl hover:bg-gray-100 transition flex justify-center items-center gap-2 text-lg"
                                    >
                                        Continue
                                        <ArrowRight size={20} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const [promoInput, setPromoInput] = useState('');
    const { applyPromoCode, promoCode, promoDiscount } = useCart();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
                <h1 className="text-3xl font-serif text-white mb-6">Your Selection</h1>
                <div className="space-y-4">
                    {cartLines.map(({ item, qty, originalUnit, effectiveUnit, isDiscounted, savings, nextTierMsg }) => (
                        <div key={item.id} className="bg-dark-800 p-4 rounded-xl flex items-center justify-between border border-gray-800/80 hover:border-gray-700 transition">
                            <div className="flex items-center gap-4">
                                <img
                                    src={item.image_url}
                                    alt={item.name}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-16 h-16 object-cover rounded bg-gray-900"
                                />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-white">{item.name}</h3>
                                        {String(item.id).startsWith('membership-') && (
                                            <span className={`text-[10px] font-extrabold px-2 py-1 rounded-full border ${item.tier === 'founders-black'
                                                ? 'bg-gold-500/80 text-black border-gold-300/30'
                                                : item.tier === 'reserve-club'
                                                    ? 'bg-purple-600/80 text-white border-purple-300/30'
                                                    : 'bg-gray-600/80 text-white border-gray-300/30'
                                                }`}>
                                                {item.tier === 'reserve-club' ? 'RESERVE' : item.tier === 'founders-black' ? 'FOUNDERS' : 'VIP'}
                                            </span>
                                        )}
                                        {isVipActive && !String(item.id).startsWith('membership-') && (
                                            <span className="text-[10px] font-extrabold px-2 py-1 rounded-full bg-purple-600/30 text-purple-100 border border-purple-300/20">
                                                {activeTier === 'founders-black' ? '20% OFF' : activeTier === 'reserve-club' ? '15% OFF' : '10% OFF'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-gold-400 font-semibold">R {effectiveUnit.toFixed(2)}</p>
                                        {isDiscounted && (
                                            <p className="text-xs text-gray-500 line-through">R {originalUnit.toFixed(2)}</p>
                                        )}
                                    </div>
                                    {String(item.id).startsWith('membership-') && (
                                        <p className="text-xs text-gray-400">
                                            {item.tier === 'founders-black' ? 'Subscription • 3 cigars/mo + 20% off'
                                                : item.tier === 'reserve-club' ? 'Subscription • 2 cigars/mo + 15% off'
                                                    : 'Subscription • 10% off + shipping credit'}
                                        </p>
                                    )}
                                    {isDiscounted && (
                                        <p className="text-xs text-green-400">You save R {savings.toFixed(2)} on this item</p>
                                    )}
                                    {nextTierMsg && (
                                        <p className="text-xs text-gold-400 font-semibold mt-1">{nextTierMsg}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-dark-900 rounded px-2">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="text-gray-400 hover:text-white px-2">-</button>
                                    <span className="text-white w-4 text-center">{qty}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)} className="text-gray-400 hover:text-white px-2">+</button>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-400"><Trash2 size={20} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Checkout Summary */}
            <div className="bg-gradient-to-b from-dark-800 to-dark-900 p-6 rounded-2xl h-fit border border-gray-800/80 sticky top-24 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-serif text-gold-400">Order Summary</h2>
                    <div className="text-xs text-gray-400">Secure</div>
                </div>

                <div className="space-y-4">
                    <div className="bg-dark-900/60 border border-gray-800 rounded-xl p-4 text-sm space-y-2">
                        <div className="flex justify-between text-gray-300">
                            <span>Items ({cartItems.length})</span>
                            <span>R {cartSubtotalEffective.toFixed(2)}</span>
                        </div>
                        {cartLines.some(l => l.savings > 0) && (
                            <div className="flex justify-between text-green-300">
                                <span>VIP Savings</span>
                                <span>- R {roundMoney(cartLines.reduce((a, l) => a + l.savings, 0)).toFixed(2)}</span>
                            </div>
                        )}
                        {promoDiscount > 0 && (
                            <div className="flex justify-between text-gold-400 font-bold border-t border-gray-800 pt-2 mt-2">
                                <span>Discount ({promoCode})</span>
                                <span>- R {promoDiscount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xl font-extrabold text-white pt-3 border-t border-gray-700">
                            <span>Subtotal</span>
                            <span>R {Math.max(0, cartSubtotalEffective - promoDiscount).toFixed(2)}</span>
                        </div>
                    </div>

                    {!promoCode ? (
                        <div className="flex gap-2">
                            <input
                                placeholder="Discount Code"
                                value={promoInput}
                                onChange={(e) => setPromoInput(e.target.value)}
                                className="flex-1 bg-dark-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-gold-500"
                            />
                            <button
                                onClick={() => {
                                    if (applyPromoCode(promoInput)) {
                                        setPromoInput('');
                                    } else {
                                        alert('Invalid discount code');
                                    }
                                }}
                                className="bg-dark-800 border border-gray-700 text-gold-500 px-4 py-2 rounded-lg text-sm font-bold hover:bg-dark-700 transition"
                            >
                                Apply
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between bg-gold-500/10 border border-gold-500/20 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                                <Gift size={14} className="text-gold-500" />
                                <span className="text-gold-500 text-xs font-bold">{promoCode} Applied</span>
                            </div>
                            <span className="text-gold-500 text-xs font-bold">-R {promoDiscount}</span>
                        </div>
                    )}

                    <button
                        onClick={() => setStep(1)}
                        className="w-full bg-gold-500 text-black font-extrabold py-4 rounded-xl hover:bg-gold-400 transition flex justify-center items-center gap-2 text-lg shadow-lg"
                    >
                        <span>Start Checkout</span>
                        <ArrowRight size={20} />
                    </button>

                    <div className="flex flex-col gap-3 text-xs text-gray-500 bg-dark-900 p-4 rounded-xl border border-white/5">
                        <div className="flex items-start gap-2">
                            <Shield className="text-green-500 mt-0.5 shrink-0" size={14} />
                            <p className="text-gray-300 font-bold">21+ Age Verification Required</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <AlertCircle size={14} className="mt-0.5 shrink-0" />
                            <p>Valid original ID must be presented to the courier upon delivery. No underage sales will occur under any circumstances.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
