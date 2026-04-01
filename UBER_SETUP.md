# Uber Delivery Integration Setup Guide

## Overview
RoyalSmoke uses Uber Rides API to automatically dispatch deliveries from partner stores to customers.

## Setup Instructions

### 1. Create Uber Developer Account
1. Go to https://developer.uber.com
2. Sign up for a developer account
3. Create a new app in the dashboard

### 2. Get Your Server Token
1. In your Uber app dashboard, navigate to **Settings** → **Auth**
2. Copy your **Server Token**
3. Add to your `.env` file:
   ```
   UBER_SERVER_TOKEN=your_token_here
   UBER_SANDBOX=true
   ```

### 3. Testing in Sandbox Mode
- Set `UBER_SANDBOX=true` in `.env` for testing
- Sandbox mode allows testing without real rides
- Use test coordinates provided in Uber docs

### 4. Production Setup
- Set `UBER_SANDBOX=false` when ready for production
- Ensure your Uber app is approved for production use
- Set up billing in your Uber developer account

## How It Works

### Automatic Delivery Flow
1. Customer places order with delivery address
2. System finds nearest partner store with stock
3. **Uber ride automatically requested:**
   - **Pickup:** Partner store location
   - **Dropoff:** Customer address
   - **Notes:** Order ID + "18+ ID check required"
4. Order updated with:
   - Uber request ID
   - Driver info (name, phone, vehicle)
   - ETA
   - Live tracking status

### Delivery Fee Configuration
The delivery fee in the checkout is configurable:
- **Zone-based pricing** (currently in Cart.jsx)
- **Optional override:** You can set a flat delivery fee
- **Uber cost:** Actual Uber ride cost is separate (billed to your Uber account)

### Tracking Order Delivery
- **Admin Dashboard:** View Uber status for each order
- **API Endpoint:** `GET /api/orders/:orderId/uber-status`
- **Auto-updates:** Order status syncs with Uber ride status

## API Endpoints

### Get Uber Status
```bash
GET /api/orders/:orderId/uber-status
```
Returns current driver location, ETA, and status.

### Get Price Estimate
```bash
POST /api/orders/uber-estimate
{
  "start_lat": -25.7479,
  "start_lng": 28.2293,
  "end_lat": -25.7545,
  "end_lng": 28.2405
}
```
Returns estimated Uber prices for the route.

## Database Fields

Orders table includes:
- `uber_request_id` - Uber ride request ID
- `uber_status` - Current ride status
- `uber_driver_name` - Driver name
- `uber_driver_phone` - Driver contact
- `uber_vehicle_info` - Vehicle details
- `uber_eta` - Estimated arrival time
- `uber_tracking_url` - Live tracking link

## Uber Ride Statuses

- `processing` - Ride request being processed
- `accepted` - Driver accepted
- `arriving` - Driver en route to pickup
- `in_progress` - Delivery in progress
- `completed` - Delivery completed
- `canceled` - Ride canceled

## Cost Structure

**Your Costs:**
- Uber ride fare (charged to your Uber account)
- Varies by distance, time, and demand

**Customer Pays:**
- Your delivery fee (set in Cart.jsx)
- This is separate from Uber cost

**Profit Model:**
- Set delivery fee higher than average Uber cost
- Or absorb Uber cost and charge flat fee

## Troubleshooting

### Uber API Not Working
1. Check `UBER_SERVER_TOKEN` is set correctly
2. Verify token hasn't expired
3. Check console logs for `[UBER]` messages
4. Ensure store has latitude/longitude set

### No Uber Products Available
- Store location may be outside Uber service area
- Check coordinates are valid
- Try different Uber product types

### Delivery Not Requested
- Verify both store AND customer have coordinates
- Check Uber API credentials
- Review server logs for errors

## Support
- Uber Developer Docs: https://developer.uber.com/docs
- Uber Support: https://developer.uber.com/support
