# PayFast Integration - Complete Setup Guide

## What I Need From You

Go to your PayFast dashboard and get these credentials:

### Step 1: Get Your Credentials
1. In PayFast dashboard, click **Settings** (left sidebar)
2. Click **Developer Settings**
3. Copy these values:

```
PAYFAST_MERCHANT_ID=__________ (10-digit number)
PAYFAST_MERCHANT_KEY=__________ (long alphanumeric string)
PAYFAST_PASSPHRASE=__________ (if you set one - recommended)
```

### Step 2: Check Your Mode
Are you in:
- [ ] **Sandbox mode** (testing) - Set `PAYFAST_SANDBOX=true`
- [ ] **Live mode** (production) - Set `PAYFAST_SANDBOX=false`

### Step 3: Add to .env File
Create or update `/server/.env`:
```bash
# PayFast
PAYFAST_MERCHANT_ID=your_merchant_id_here
PAYFAST_MERCHANT_KEY=your_merchant_key_here
PAYFAST_PASSPHRASE=your_passphrase_here
PAYFAST_SANDBOX=true

# URLs (important for PayFast callbacks)
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5001
```

---

## How It Works

### Customer Flow
```
1. Customer adds cigars to cart
   ↓
2. Enters phone number
   ↓
3. New customer? → Receives 3-digit PIN via SMS
   Returning? → Enters PIN to login
   ↓
4. Enters delivery address
   ↓
5. Clicks "Pay with PayFast"
   ↓
6. Redirected to PayFast payment page
   ↓
7. Chooses payment method:
   - Credit/Debit Card
   - Apple Pay (automatic on iPhone/Mac Safari)
   - EFT
   - SnapScan
   - Zapper
   ↓
8. Completes payment
   ↓
9. PayFast notifies our server (IPN webhook)
   ↓
10. Order marked as "paid"
    ↓
11. SMS sent: "Order confirmed!"
    ↓
12. Uber delivery automatically requested
    ↓
13. SMS sent: "Driver on the way!"
```

---

## Apple Pay Support

**Good News:** Apple Pay works automatically through PayFast!

**Requirements:**
- Customer uses Safari browser (iPhone, iPad, or Mac)
- Customer has Apple Pay set up
- Your PayFast account is verified (not sandbox)

**How it appears:**
- Customer clicks "Pay with PayFast"
- PayFast detects Apple Pay capability
- Shows Apple Pay button
- Customer pays with Face ID/Touch ID
- Done in seconds!

**No extra setup needed** - PayFast handles it all.

---

## What I've Built

### 1. PayFast Service (`server/services/payfastService.js`)
- Payment creation with signature generation
- IPN (webhook) validation
- Security checks (signature verification)
- Return URL handling

### 2. PayFast Routes (`server/routes/payfast.js`)
- `POST /api/payfast/create-payment` - Create payment session
- `POST /api/payfast/notify` - IPN webhook (PayFast calls this)
- `GET /api/payfast/success` - Payment success redirect
- `GET /api/payfast/cancel` - Payment cancelled redirect

### 3. Customer Login System (`server/routes/auth.js`)
- `POST /api/auth/login` - Login with phone + PIN
- `POST /api/auth/check-customer` - Check if customer exists
- `GET /api/auth/orders/:customerId` - Get order history

### 4. Automatic Flow
When payment succeeds:
- ✅ Order status → "paid"
- ✅ SMS confirmation sent
- ✅ Uber delivery requested
- ✅ Customer notified of driver

---

## PayFast IPN Webhook Setup

**Important:** PayFast needs to call your server when payment completes.

### For Testing (Local Development)
Use **ngrok** to expose localhost:
```bash
ngrok http 5001
```

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)

### Configure in PayFast Dashboard
1. Go to PayFast dashboard
2. Settings → Integration
3. Set **Notify URL:** `https://your-domain.com/api/payfast/notify`
   - For testing: `https://abc123.ngrok.io/api/payfast/notify`
4. Save

### For Production
Use your real domain:
```
https://royalsmoke.co.za/api/payfast/notify
```

---

## Testing Checklist

### Sandbox Mode Testing
1. [ ] Add PayFast sandbox credentials to `.env`
2. [ ] Set `PAYFAST_SANDBOX=true`
3. [ ] Use ngrok for IPN webhook
4. [ ] Create test order
5. [ ] Click "Pay with PayFast"
6. [ ] Use PayFast test card: `4000 0000 0000 0002`
7. [ ] Verify order marked as "paid"
8. [ ] Check SMS sent
9. [ ] Verify Uber delivery requested

### PayFast Test Cards
```
Success: 4000 0000 0000 0002
Decline: 4000 0000 0000 0010
```

---

## Production Checklist

- [ ] Get PayFast live credentials
- [ ] Update `.env` with live credentials
- [ ] Set `PAYFAST_SANDBOX=false`
- [ ] Configure IPN webhook with real domain
- [ ] Test with small real payment (R10)
- [ ] Verify IPN webhook receives notifications
- [ ] Check order flow end-to-end
- [ ] Test Apple Pay on iPhone
- [ ] Monitor PayFast transaction logs

---

## Security Features

✅ **Signature Verification** - All PayFast requests validated
✅ **Passphrase Protection** - Extra security layer
✅ **Server Validation** - Double-check with PayFast servers
✅ **Amount Verification** - Ensure payment matches order
✅ **Status Checks** - Only process "COMPLETE" payments

---

## Cost Structure

**PayFast Fees:**
- Credit/Debit Card: 2.9% + R2.00
- EFT: R2.00 flat
- Apple Pay: 2.9% + R2.00
- SnapScan/Zapper: 2.9% + R2.00

**Example:**
- Order: R850
- PayFast fee: R26.65 (2.9% + R2)
- You receive: R823.35

---

## Troubleshooting

### Payment Not Processing
1. Check `.env` has correct credentials
2. Verify `PAYFAST_SANDBOX` matches your account mode
3. Check PayFast dashboard for error logs
4. Ensure IPN webhook URL is accessible

### IPN Not Received
1. Verify webhook URL is publicly accessible (use ngrok for testing)
2. Check server logs for incoming requests
3. Test webhook manually in PayFast dashboard
4. Ensure server is running on correct port

### Apple Pay Not Showing
1. Must use Safari browser
2. Customer must have Apple Pay configured
3. Only works in live mode (not sandbox)
4. Verify PayFast account is verified

---

## API Endpoints Reference

### Create Payment
```bash
POST /api/payfast/create-payment
{
  "orderId": 123,
  "amount": 850.00,
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+27727346573",
  "items": [
    { "name": "Cuban Cigar", "quantity": 2 }
  ]
}

Response:
{
  "success": true,
  "paymentUrl": "https://sandbox.payfast.co.za/eng/process",
  "paymentData": { ... }
}
```

### Customer Login
```bash
POST /api/auth/login
{
  "phone": "+27727346573",
  "pin": "123"
}

Response:
{
  "success": true,
  "customer": {
    "id": 1,
    "name": "John Doe",
    "phone": "+27727346573",
    "email": "john@example.com"
  }
}
```

---

## Next Steps

1. **Send me your PayFast credentials** (Merchant ID, Key, Passphrase)
2. I'll add them to `.env`
3. Test payment flow in sandbox
4. Deploy to production when ready

Everything is ready - just need your PayFast credentials to activate payments!
