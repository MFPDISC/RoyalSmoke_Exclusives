# Twilio Integration Setup Guide

## Overview
RoyalSmoke uses Twilio for:
- **SMS notifications** (customer PINs, order confirmations, delivery updates)
- **Outbound calls** (delivery arrival notifications)
- **Inbound AI agent** (customers can call to place orders - future)

## Your Credentials (Already Configured)
```
Account SID: your_twilio_account_sid
Auth Token: your_twilio_auth_token
Phone Number: +18125563620
```

## Setup Instructions

### 1. Create .env File
Copy `.env.example` to `.env` in the `/server` folder:
```bash
cd server
cp .env.example .env
```

Your Twilio credentials are already in `.env.example` - they'll work immediately!

### 2. Test SMS (Optional)
Run this to test SMS sending:
```bash
node -e "
const twilio = require('./services/twilioService');
twilio.sendSMS('+270727346573', 'Test from RoyalSmoke!');
"
```

## Features Implemented

### 1. Customer PIN via SMS
When a new customer places their first order:
- 3-digit PIN generated automatically
- SMS sent: "Welcome to RoyalSmoke, [Name]! Your login PIN is: XXX"
- Customer uses this PIN for future orders

### 2. Order Confirmation SMS
After order is placed:
```
RoyalSmoke Order #123 confirmed!

Total: R850
ETA: 30-45 min

Track your delivery at royalsmoke.co.za

ID check required (18+)
```

### 3. Delivery Status Updates
When order status changes to "dispatched":
```
RoyalSmoke Order #123 Update:

Your order is on the way!
Driver: John Smith
ETA: 15 min
```

When delivered:
```
RoyalSmoke Order #123 Update:

Order delivered! Enjoy your premium cigars.

Thank you for choosing RoyalSmoke!
```

### 4. Outbound Calls (Optional)
You can call customers when driver is arriving:
```javascript
twilioService.callDeliveryArrival(
  '+270727346573',
  123,
  'John Smith'
);
```

## Inbound AI Agent (Future Setup)

### What It Does
Customers can call **+18125563620** and:
- AI agent answers: "Welcome to RoyalSmoke..."
- Customer speaks their order
- AI processes and confirms order
- Order automatically created in system

### Setup Steps (When Ready)

**1. Configure Twilio Phone Number**
- Go to https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
- Click your number: +18125563620
- Under "Voice Configuration":
  - When a call comes in: **Webhook**
  - URL: `https://your-domain.com/api/twilio/voice`
  - HTTP Method: **POST**
- Save

**2. Expose Your Server (for testing)**
Use ngrok to expose localhost:
```bash
ngrok http 5001
```
Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
Use this as your webhook URL: `https://abc123.ngrok.io/api/twilio/voice`

**3. Test Inbound Call**
- Call +18125563620 from your phone
- You'll hear: "Welcome to RoyalSmoke..."
- Speak your order
- Check server logs to see what was captured

**4. Add AI/NLP Processing**
The webhook at `/api/twilio/process-order` receives speech.
Integrate with:
- OpenAI GPT for natural language understanding
- Your product catalog to match spoken items
- Automatic order creation

## SMS Triggers

| Event | SMS Sent | Recipient |
|-------|----------|-----------|
| New customer | PIN delivery | Customer |
| Order placed | Order confirmation | Customer |
| Status → Dispatched | Delivery update with driver info | Customer |
| Status → Delivered | Delivery complete message | Customer |

## API Endpoints

### Send Test SMS
```bash
POST /api/twilio/test-sms
{
  "to": "+270727346573",
  "message": "Test message"
}
```

### Inbound Voice Webhook
```
POST /api/twilio/voice
```
Automatically configured - receives incoming calls.

### Process Order (AI Agent)
```
POST /api/twilio/process-order
```
Receives speech-to-text from customer order.

## Cost Estimates (Twilio Pricing)

**SMS:**
- Outbound to South Africa: ~$0.04 per SMS
- 100 orders/day = ~$4/day = ~R75/day

**Voice Calls:**
- Outbound to South Africa: ~$0.10/min
- Inbound: ~$0.01/min
- AI agent calls: ~$0.05/call average

**Budget Example:**
- 100 orders/day with SMS: ~R2,250/month
- 50 inbound AI calls/day: ~R75/month

## Troubleshooting

### SMS Not Sending
1. Check `.env` has correct credentials
2. Verify phone number format: `+27...` (with country code)
3. Check Twilio console for error logs
4. Ensure Twilio account has credit

### Inbound Calls Not Working
1. Verify webhook URL is publicly accessible
2. Check Twilio phone number configuration
3. Use ngrok for local testing
4. Review server logs for errors

### AI Agent Not Understanding Orders
1. Check `/api/twilio/process-order` logs
2. Verify speech-to-text is working
3. Add better NLP/AI processing
4. Train on common order phrases

## Production Checklist

- [ ] Add Twilio credentials to production `.env`
- [ ] Set up proper domain for webhooks (not ngrok)
- [ ] Configure SSL certificate for webhook URLs
- [ ] Set up Twilio account alerts for low balance
- [ ] Test SMS delivery to all SA carriers
- [ ] Configure fallback URLs in Twilio
- [ ] Set up monitoring for failed SMS/calls
- [ ] Add retry logic for failed notifications

## Support
- Twilio Console: https://console.twilio.com
- Twilio Docs: https://www.twilio.com/docs
- Test your number: https://www.twilio.com/console/phone-numbers/incoming
