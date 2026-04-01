import React, { } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, LogIn, User, Gift, Zap, Clock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const LeadMagnetPopup = ({ onClose }) => {
    const [formData, setFormData] = useState({ phone: '', email: '' });
    const [loading, setLoading] = useState(false);
    const [code, setCode] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const staticCode = 'ROYAL150';
        try {
            await axios.post(`${API}/leads`, {
                phone: formData.phone,
                email: formData.email,
                name: formData.email.split('@')[0]
            });
            setCode(staticCode);
            localStorage.setItem('royal_lead_captured', 'true');
        } catch (err) {
            console.error('Lead capture failed, providing static code:', err);
            // Even if API fails, give them the code as requested
            setCode(staticCode);
            localStorage.setItem('royal_lead_captured', 'true');
        } finally {
            setLoading(false);
        }
    };

    if (code) {
        return (
            <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4">
                <div className="bg-dark-800 border-2 border-gold-500 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                    <Gift className="w-16 h-16 text-gold-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-serif text-gold-500 mb-4">Your R150 Code!</h2>
                    <div className="bg-dark-900 border border-gold-500 rounded-lg p-4 mb-6">
                        <div className="text-4xl font-bold text-gold-500 mb-2">{code}</div>
                        <div className="text-sm text-gray-400">Use at checkout before midnight</div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full bg-gold-500 hover:bg-gold-400 text-black font-bold py-3 rounded-lg transition"
                    >
                        Start Shopping 👑
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4">
            <div className="bg-dark-800 border-2 border-gold-500 rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    <X size={24} />
                </button>

                <Gift className="w-16 h-16 text-gold-500 mx-auto mb-4" />
                <h2 className="text-3xl font-serif text-white text-center mb-2">Unlock R150 Off</h2>
                <p className="text-gray-400 text-center mb-6">Your first premium cigar order</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="tel"
                        placeholder="WhatsApp Number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-dark-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-dark-900 border border-gray-700 rounded-lg px-4 py-3 text-white"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gold-500 hover:bg-gold-400 text-black font-bold py-3 rounded-lg transition disabled:opacity-50"
                    >
                        {loading ? 'Generating...' : 'Get My Code 🎁'}
                    </button>
                </form>

                <p className="text-xs text-gray-500 text-center mt-4">
                    Code expires at midnight. One use per customer.
                </p>
            </div>
        </div>
    );
};

export default LeadMagnetPopup;
