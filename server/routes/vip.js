const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database/royalsmoke.db');
const db = new Database(dbPath);

// Tier configuration
const TIER_CONFIG = {
    'status': { price: 299, discount: 0.10, cigarsPerMonth: 0, name: 'Status Access' },
    'reserve-club': { price: 1199, discount: 0.15, cigarsPerMonth: 2, name: 'Reserve Club' },
    'founders-black': { price: 3499, discount: 0.20, cigarsPerMonth: 3, name: 'Founders Black' }
};

/**
 * Activate membership for a user with specific tier
 */
router.post('/activate', (req, res) => {
    const { user_id, tier } = req.body;

    if (!user_id) {
        return res.status(400).json({ error: 'User ID required' });
    }

    const validTier = tier && TIER_CONFIG[tier] ? tier : 'flagship';

    try {
        const result = db.prepare(`
            UPDATE users 
            SET is_vip = 1, vip_tier = ?, vip_joined_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `).run(validTier, user_id);

        if (result.changes > 0) {
            res.json({ 
                success: true, 
                message: `${TIER_CONFIG[validTier].name} activated`,
                tier: validTier,
                config: TIER_CONFIG[validTier]
            });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('[VIP] Activation error:', error);
        res.status(500).json({ error: 'Failed to activate membership' });
    }
});

/**
 * Get tier configuration
 */
router.get('/tiers', (req, res) => {
    res.json({ tiers: TIER_CONFIG });
});

/**
 * Get all VIP members (admin)
 */
router.get('/members', (req, res) => {
    try {
        const members = db.prepare(`
            SELECT 
                u.id, u.name, u.phone, u.email, u.vip_joined_at, u.vip_tier,
                COUNT(o.id) as order_count,
                COALESCE(SUM(o.total_amount), 0) as total_spent,
                MAX(o.created_at) as last_order_date
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id
            WHERE u.is_vip = 1
            GROUP BY u.id
            ORDER BY u.vip_joined_at DESC
        `).all();

        // Calculate MRR based on actual tiers
        const monthlyRecurring = members.reduce((sum, m) => {
            const tier = m.vip_tier || 'flagship';
            return sum + (TIER_CONFIG[tier]?.price || 699);
        }, 0);

        const tierBreakdown = {
            'status': members.filter(m => m.vip_tier === 'status').length,
            'flagship': members.filter(m => !m.vip_tier || m.vip_tier === 'flagship').length,
            'luxury': members.filter(m => m.vip_tier === 'luxury').length
        };

        const stats = {
            total_members: members.length,
            monthly_recurring: monthlyRecurring,
            total_revenue: members.reduce((sum, m) => sum + m.total_spent, 0),
            tier_breakdown: tierBreakdown
        };

        res.json({ members, stats });
    } catch (error) {
        console.error('[VIP] Get members error:', error);
        res.status(500).json({ error: 'Failed to fetch VIP members' });
    }
});

/**
 * Check if user can claim free monthly cigar(s) based on tier
 */
router.get('/check-free-cigar/:userId', (req, res) => {
    try {
        const user = db.prepare('SELECT is_vip, vip_tier, last_free_cigar_month, cigars_claimed_this_month FROM users WHERE id = ?').get(req.params.userId);

        if (!user || !user.is_vip) {
            return res.json({ eligible: false, cigarsAllowed: 0 });
        }

        const tier = user.vip_tier || 'flagship';
        const cigarsAllowed = TIER_CONFIG[tier]?.cigarsPerMonth || 0;
        
        if (cigarsAllowed === 0) {
            return res.json({ eligible: false, cigarsAllowed: 0, tier });
        }

        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const claimedThisMonth = user.last_free_cigar_month === currentMonth ? (user.cigars_claimed_this_month || 0) : 0;
        const remaining = cigarsAllowed - claimedThisMonth;
        const eligible = remaining > 0;

        res.json({ 
            eligible, 
            currentMonth, 
            tier,
            cigarsAllowed,
            cigarsClaimed: claimedThisMonth,
            cigarsRemaining: remaining
        });
    } catch (error) {
        console.error('[VIP] Check free cigar error:', error);
        res.status(500).json({ error: 'Failed to check eligibility' });
    }
});

/**
 * Mark free cigar as claimed (supports multiple cigars per month for higher tiers)
 */
router.post('/claim-free-cigar', (req, res) => {
    const { user_id } = req.body;

    try {
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        // Get current user state
        const user = db.prepare('SELECT vip_tier, last_free_cigar_month, cigars_claimed_this_month FROM users WHERE id = ? AND is_vip = 1').get(user_id);
        
        if (!user) {
            return res.status(404).json({ error: 'VIP user not found' });
        }

        const tier = user.vip_tier || 'reserve-club';
        const cigarsAllowed = TIER_CONFIG[tier]?.cigarsPerMonth || 0;
        
        // Check if this is a new month or same month
        const isNewMonth = user.last_free_cigar_month !== currentMonth;
        const currentClaimed = isNewMonth ? 0 : (user.cigars_claimed_this_month || 0);
        
        if (currentClaimed >= cigarsAllowed) {
            return res.status(400).json({ error: 'Monthly cigar limit reached', claimed: currentClaimed, allowed: cigarsAllowed });
        }

        // Increment claim count
        db.prepare(`
            UPDATE users 
            SET last_free_cigar_month = ?, cigars_claimed_this_month = ? 
            WHERE id = ? AND is_vip = 1
        `).run(currentMonth, currentClaimed + 1, user_id);

        res.json({ 
            success: true, 
            cigarsClaimed: currentClaimed + 1,
            cigarsRemaining: cigarsAllowed - (currentClaimed + 1)
        });
    } catch (error) {
        console.error('[VIP] Claim free cigar error:', error);
        res.status(500).json({ error: 'Failed to claim free cigar' });
    }
});

module.exports = router;
