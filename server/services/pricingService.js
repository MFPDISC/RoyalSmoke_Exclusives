/**
 * Pricing Service - Smart Profit Margin & Odd Number Rounding
 * 
 * Flow:
 * 1. Store uploads product with cost price (e.g., R450)
 * 2. Admin sets profit margin (e.g., 40%)
 * 3. System calculates: R450 + 40% = R630
 * 4. Rounds to odd number: R629 or R631
 * 5. Customer sees final price: R629
 */

/**
 * Calculate final price with profit margin
 */
const calculateFinalPrice = (costPrice, profitMarginPercent) => {
    const margin = costPrice * (profitMarginPercent / 100);
    const priceWithMargin = costPrice + margin;
    return priceWithMargin;
};

/**
 * Round to nearest odd number
 * Examples:
 * - 630 → 629
 * - 631 → 631 (already odd)
 * - 632 → 631
 * - 635 → 635 (already odd)
 */
const roundToOddNumber = (price) => {
    const rounded = Math.round(price);
    
    // If already odd, return as is
    if (rounded % 2 !== 0) {
        return rounded;
    }
    
    // If even, subtract 1 to make odd
    return rounded - 1;
};

/**
 * Calculate final customer price
 * Includes profit margin and rounds to odd number
 */
const calculateCustomerPrice = (storeCostPrice, profitMarginPercent) => {
    const priceWithMargin = calculateFinalPrice(storeCostPrice, profitMarginPercent);
    const oddPrice = roundToOddNumber(priceWithMargin);
    return oddPrice;
};

/**
 * Calculate profit breakdown
 */
const getProfitBreakdown = (storeCostPrice, profitMarginPercent) => {
    const priceWithMargin = calculateFinalPrice(storeCostPrice, profitMarginPercent);
    const finalPrice = roundToOddNumber(priceWithMargin);
    const actualProfit = finalPrice - storeCostPrice;
    const actualMarginPercent = (actualProfit / storeCostPrice) * 100;
    
    return {
        store_cost: storeCostPrice,
        profit_margin_percent: profitMarginPercent,
        calculated_price: priceWithMargin,
        final_price: finalPrice,
        actual_profit: actualProfit,
        actual_margin_percent: actualMarginPercent.toFixed(2),
        rounding_adjustment: finalPrice - priceWithMargin
    };
};

/**
 * Suggest optimal profit margin
 * PREMIUM SERVICE - High margins for luxury positioning
 */
const suggestProfitMargin = (costPrice) => {
    if (costPrice < 200) return 100; // Budget items: 100% markup (double price)
    if (costPrice < 500) return 80; // Mid-range: 80% margin
    if (costPrice < 1000) return 70; // Premium: 70% margin
    return 60; // Ultra-luxury: 60% margin (still substantial)
};

/**
 * Batch calculate prices for multiple products
 */
const batchCalculatePrices = (products, defaultMargin = 70) => {
    return products.map(product => {
        const margin = product.profit_margin || defaultMargin;
        const finalPrice = calculateCustomerPrice(product.store_cost_price, margin);
        const breakdown = getProfitBreakdown(product.store_cost_price, margin);
        
        return {
            ...product,
            suggested_margin: suggestProfitMargin(product.store_cost_price),
            final_price: finalPrice,
            breakdown
        };
    });
};

module.exports = {
    calculateFinalPrice,
    roundToOddNumber,
    calculateCustomerPrice,
    getProfitBreakdown,
    suggestProfitMargin,
    batchCalculatePrices
};
