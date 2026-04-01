import React from 'react';
import { X, Check, Crown, Gift, Zap } from 'lucide-react';

const PricingComparisonModal = ({ onClose, currentCartTotal = 0 }) => {
    const tiers = [
        {
            id: 'member-access',
            name: 'Member Access',
            monthlyPrice: 149,
            annualPrice: 1490,
            color: 'gray',
            benefits: [
                '10% off everything (up to R1,000/month)',
                'Box pricing on 6+ singles (25% off)',
                'R99 monthly shipping credit',
                '24hr early access to drops'
            ]
        },
        {
            id: 'reserve-club',
            name: 'Reserve Club',
            monthlyPrice: 749,
            annualPrice: 7490,
            color: 'purple',
            popular: true,
            benefits: [
                '1 free best-seller cigar/month',
                '15% off everything',
                'R99 monthly shipping credit',
                '48hr early access to drops',
                'Reserve Token (hold items)'
            ]
        },
        {
            id: 'founders-black',
            name: 'Founders Black',
            monthlyPrice: 1499,
            annualPrice: 14990,
            color: 'gold',
            benefits: [
                '2 free best-seller cigars/month',
                '20% off everything',
                'FREE same-day dispatch priority',
                'Concierge sourcing',
                'Founder-only drops',
                'Founders Coin'
            ]
        }
    ];

    const getSavingsOnCart = (discount) => {
        return (currentCartTotal * discount).toFixed(0);
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-dark-800 border-2 border-gold-500/30 rounded-2xl max-w-6xl w-full my-8 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
                >
                    <X size={24} />
                </button>

                <div className="p-8">
                    <h2 className="text-3xl font-serif text-white text-center mb-2">Compare Plans</h2>
                    <p className="text-gray-400 text-center mb-8">Choose the membership that fits your cigar lifestyle</p>

                    <div className="grid md:grid-cols-3 gap-6">
                        {tiers.map((tier) => (
                            <div
                                key={tier.id}
                                className={`bg-dark-900 border-2 rounded-xl p-6 relative ${tier.popular
                                        ? 'border-purple-500 shadow-lg shadow-purple-500/20'
                                        : 'border-gray-700'
                                    }`}
                            >
                                {tier.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                        MOST POPULAR
                                    </div>
                                )}

                                <div className="text-center mb-6">
                                    <Crown className={`w-12 h-12 mx-auto mb-3 text-${tier.color}-500`} />
                                    <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-3xl font-bold text-white">R{tier.monthlyPrice}</span>
                                        <span className="text-gray-400">/mo</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">or R{tier.annualPrice}/yr (2 months free)</div>
                                </div>

                                {currentCartTotal > 0 && (
                                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 mb-4">
                                        <div className="text-xs text-green-400 text-center">
                                            Save R{getSavingsOnCart(tier.id === 'member-access' ? 0.10 : tier.id === 'reserve-club' ? 0.15 : 0.20)} on your current cart
                                        </div>
                                    </div>
                                )}

                                <ul className="space-y-3 mb-6">
                                    {tier.benefits.map((benefit, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                                            <Check className="text-green-400 flex-shrink-0 mt-0.5" size={16} />
                                            <span>{benefit}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => {
                                        localStorage.setItem('royal_vip', tier.id);
                                        window.location.href = '/';
                                    }}
                                    className={`w-full py-3 rounded-lg font-bold transition ${tier.popular
                                            ? 'bg-purple-500 hover:bg-purple-600 text-white'
                                            : tier.color === 'gold'
                                                ? 'bg-gold-500 hover:bg-gold-600 text-black'
                                                : 'bg-gray-700 hover:bg-gray-600 text-white'
                                        }`}
                                >
                                    Select Plan
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 text-center">
                        <div className="inline-flex items-center gap-2 bg-dark-900 border border-gray-700 rounded-full px-4 py-2 text-sm text-gray-400">
                            <Zap className="text-gold-500" size={14} />
                            <span>Non-members get 20% off orders R2,500+</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingComparisonModal;
