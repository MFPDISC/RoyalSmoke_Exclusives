import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
    Clock,
    Package,
    Truck,
    CheckCircle2,
    MapPin,
    ExternalLink,
    ChevronLeft,
    Loader2,
    Check
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const OrderTracking = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await axios.get(`${API}/orders/${orderId}/public`);
                setOrder(res.data);
            } catch (err) {
                console.error('Fetch error:', err);
                setError(err.response?.data?.error || 'Order not found');
            } finally {
                setLoading(false);
            }
        };

        if (orderId) fetchOrder();

        // Refresh every 60 seconds if not delivered
        const timer = setInterval(() => {
            if (order && order.status !== 'delivered') fetchOrder();
        }, 60000);

        return () => clearInterval(timer);
    }, [orderId, order?.status]);

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center p-6 text-center">
                <Loader2 className="w-12 h-12 text-gold-500 animate-spin mb-4" />
                <h2 className="text-xl font-serif text-white uppercase tracking-widest">Locating Order...</h2>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl max-w-md">
                    <h2 className="text-2xl font-serif text-white mb-4">Tracking Link Invalid</h2>
                    <p className="text-gray-400 mb-8">We couldn't find an order with that ID. Please check your link or contact support.</p>
                    <Link to="/" className="inline-block bg-gold-500 text-black px-8 py-3 rounded-lg font-bold hover:bg-gold-400 transition">
                        Back to Shop
                    </Link>
                </div>
            </div>
        );
    }

    const steps = [
        { key: 'pending', label: 'Order Placed', icon: Clock },
        { key: 'paid', label: 'Payment Verified', icon: CheckCircle2 },
        { key: 'packing', label: 'Preparing Items', icon: Package },
        { key: 'dispatched', label: 'Out for Delivery', icon: Truck },
        { key: 'delivered', label: 'Delivered', icon: Check }
    ];

    const getStatusIndex = (currentStatus) => {
        const idx = steps.findIndex(s => s.key === currentStatus);
        return idx === -1 ? 0 : idx;
    };

    const currentIdx = getStatusIndex(order.status);

    return (
        <div className="min-h-screen bg-dark-900 pb-20">
            {/* Minimal Header */}
            <div className="bg-dark-800 border-b border-white/5 py-4 px-6 md:px-12 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-gold-500 transition">
                    <ChevronLeft size={20} />
                    <span className="text-sm font-bold uppercase tracking-widest">Shop</span>
                </Link>
                <div className="text-gold-500 font-serif text-xl tracking-tighter">RoyalSmoke</div>
                <div className="w-10"></div>
            </div>

            <div className="max-w-xl mx-auto px-6 py-12">
                <div className="mb-12 text-center">
                    <h1 className="text-3xl md:text-4xl font-serif text-white mb-2">Track Your Smoke 👑</h1>
                    <p className="text-gray-400">Order #{order.id}</p>
                </div>

                {/* Status Timeline */}
                <div className="bg-dark-800 border border-white/5 rounded-3xl p-8 mb-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 blur-[80px] rounded-full -mr-16 -mt-16"></div>

                    <div className="space-y-12">
                        {steps.map((step, idx) => {
                            const isPast = idx < currentIdx;
                            const isCurrent = idx === currentIdx;
                            const Icon = step.icon;

                            return (
                                <div key={step.key} className="relative flex items-start gap-6 group">
                                    {/* Line Container */}
                                    {idx < steps.length - 1 && (
                                        <div className="absolute left-[19px] top-[46px] w-[2px] h-[calc(100%+8px)] bg-gray-800">
                                            <div
                                                className={`w-full h-full bg-gold-500/40 transition-all duration-1000 origin-top ${isPast ? 'scale-y-100' : 'scale-y-0'}`}
                                            ></div>
                                        </div>
                                    )}

                                    {/* Icon Circle */}
                                    <div className={`
                                        relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 shrink-0
                                        ${isPast ? 'bg-gold-500/20 text-gold-500 border border-gold-500/30 shadow-[0_0_20px_rgba(212,175,55,0.15)]' :
                                            isCurrent ? 'bg-gold-500 text-black shadow-[0_0_30px_rgba(212,175,55,0.3)] animate-pulse' :
                                                'bg-dark-900 text-gray-700 border border-gray-800'}
                                    `}>
                                        <Icon size={isCurrent ? 20 : 18} />
                                    </div>

                                    {/* Text */}
                                    <div className="flex-1 pt-1">
                                        <div className={`font-bold transition-colors duration-500 ${isCurrent ? 'text-white text-lg' : isPast ? 'text-gray-300' : 'text-gray-600'}`}>
                                            {step.label}
                                        </div>
                                        {isCurrent && (
                                            <div className="text-gold-500/80 text-sm mt-1 font-medium animate-fadeIn">
                                                {step.key === 'pending' && "Waiting for confirmation..."}
                                                {step.key === 'paid' && "Looking good! Payment received."}
                                                {step.key === 'packing' && "Securing and sealing your products."}
                                                {step.key === 'dispatched' && "Hot on the road. Driver is nearby."}
                                                {step.key === 'delivered' && "Excellent choice. Enjoy your smoke."}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Delivery Info Box */}
                {(order.uber_tracking_url || order.uber_driver_name) && (
                    <div className="bg-white text-black p-6 rounded-3xl shadow-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Truck size={20} className="text-black" />
                                <span className="font-extrabold uppercase tracking-widest text-xs">Live Delivery</span>
                            </div>
                            {order.uber_eta && (
                                <div className="bg-black text-white px-3 py-1 rounded-full text-[10px] font-black tracking-tighter">
                                    ETA: {order.uber_eta}
                                </div>
                            )}
                        </div>

                        {order.uber_driver_name && (
                            <div className="flex items-center gap-4 py-2 border-y border-gray-100">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                    <span className="font-bold text-lg">{order.uber_driver_name[0]}</span>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase font-bold tracking-widest">Your Private courier</div>
                                    <div className="text-lg font-black tracking-tight">{order.uber_driver_name}</div>
                                </div>
                            </div>
                        )}

                        {order.uber_tracking_url && (
                            <a
                                href={order.uber_tracking_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition shadow-lg"
                            >
                                <MapPin size={18} />
                                View Live Map
                                <ExternalLink size={14} className="opacity-50" />
                            </a>
                        )}
                    </div>
                )}

                {/* Customer Details Minimal */}
                <div className="mt-8 px-8 flex justify-between items-center text-gray-500 text-xs font-bold uppercase tracking-widest">
                    <div>User: {order.customer_name}</div>
                    <div>Value: R {order.total_amount?.toFixed(2)}</div>
                </div>
            </div>
        </div>
    );
};

export default OrderTracking;
