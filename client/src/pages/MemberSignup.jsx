import React, { useState } from 'react';
import { Crown, ArrowRight, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '/api';

export default function MemberSignup() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    delivery_address: '',
    id_number: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API}/members/signup`, form);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-6">
          <CheckCircle size={64} className="text-gold-400 mx-auto" />
          <h1 className="text-4xl font-serif text-white">Welcome to the Club</h1>
          <p className="text-gray-400 leading-relaxed">
            Your membership application has been received. We'll be in touch shortly.
          </p>
          <a
            href="/"
            className="inline-block bg-gold-500 text-black font-black px-8 py-4 rounded-xl hover:bg-gold-400 transition-all"
          >
            Back to RoyalSmoke
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full">
        <div className="text-center mb-10">
          <Crown size={48} className="text-gold-400 mx-auto mb-4" />
          <h1 className="text-4xl font-serif text-white mb-2">Become a Member</h1>
          <p className="text-gray-500">
            Join the RoyalSmoke Exclusives club. Premium cigars, priority delivery, member pricing.
          </p>
        </div>

        <div className="bg-dark-800 border border-white/5 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">
                Full Name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full bg-dark-900 border border-white/5 rounded-xl p-4 text-white focus:border-gold-500 outline-none transition-all"
                placeholder="e.g. John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">
                Phone Number
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full bg-dark-900 border border-white/5 rounded-xl p-4 text-white focus:border-gold-500 outline-none transition-all"
                placeholder="e.g. 072 123 4567"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full bg-dark-900 border border-white/5 rounded-xl p-4 text-white focus:border-gold-500 outline-none transition-all"
                placeholder="e.g. john@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">
                Preferred Delivery Address
              </label>
              <textarea
                name="delivery_address"
                value={form.delivery_address}
                onChange={handleChange}
                rows={3}
                className="w-full bg-dark-900 border border-white/5 rounded-xl p-4 text-white focus:border-gold-500 outline-none transition-all resize-none"
                placeholder="Street, Suburb, City, Postal Code"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">
                ID Number <span className="text-gray-600 normal-case font-normal">(for age verification — 18+ only)</span>
              </label>
              <input
                name="id_number"
                value={form.id_number}
                onChange={handleChange}
                className="w-full bg-dark-900 border border-white/5 rounded-xl p-4 text-white focus:border-gold-500 outline-none transition-all"
                placeholder="13-digit SA ID number"
                maxLength={13}
                required
              />
            </div>

            <div className="p-4 bg-gold-500/5 border border-gold-500/15 rounded-2xl text-xs text-gray-400 leading-relaxed">
              By submitting this form you confirm you are 18 years or older and agree to receive
              communications from RoyalSmoke Exclusives. Your information is kept private and secure.
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold-500 text-black font-black py-4 rounded-xl hover:bg-gold-400 transition-all shadow-xl flex items-center justify-center gap-2 text-lg"
            >
              {loading ? 'Submitting...' : 'Join the Club'}
              <ArrowRight size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
