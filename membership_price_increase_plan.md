# Implementation Plan: Membership Price Increase

The user wants to increase membership prices. Currently, prices are inconsistent between the frontend and backend. This plan outlines the steps to harmonize the pricing and apply the requested increase.

## Current Prices (Frontend/Seed) vs Backend Config

| Tier | Current (Frontend) | Current (Backend Config) |
| :--- | :--- | :--- |
| **Member Access** | R149/mo (R1,490/yr) | R299/mo |
| **Reserve Club** | R749/mo (R7,490/yr) | R1,499/mo |
| **Founders Black** | R1,499/mo (R14,990/yr) | R2,499/mo |

## Proposed "Premium" Pricing Structure

| Tier | New Monthly Price | New Annual Price (2 Months Free) |
| :--- | :--- | :--- |
| **Member Access** | R249 | R2,490 |
| **Reserve Club** | R999 | R9,990 |
| **Founders Black** | R1,999 | R19,990 |

---

## Action Steps

### 1. Update Frontend Component
Modify `client/src/components/PricingComparisonModal.jsx` to reflect the new prices.

### 2. Update Backend Seed Script
Modify `server/seed_memberships.js` with the new prices and descriptions.

### 3. Update Backend VIP Logic
Modify `server/routes/vip.js` to match the new monthly prices and tier names.

### 4. Execute Update
1. Run the seed script: `node server/seed_memberships.js`
   - This will update the local SQLite database.
   - This will trigger a sync to GoHighLevel (updating products and creating new price IDs).

### 5. Verification
- Verify the frontend display.
- Verify the database values.
- Verify GHL sync status in logs.
