# South African Phone Number Setup for Twilio

## Current Setup
You're currently using a US phone number:
- **Phone:** +18125563620
- **Works globally** but shows as international to SA customers

## Getting a South African Phone Number

### Option 1: Buy SA Number from Twilio (Recommended)
**Cost:** ~R150/month

**Steps:**
1. Go to https://console.twilio.com/us1/develop/phone-numbers/manage/search
2. Select **Country:** South Africa (+27)
3. Select **Capabilities:** Voice + SMS
4. Search for available numbers
5. Buy a number (e.g., +27 XX XXX XXXX)
6. Update `.env`:
   ```
   TWILIO_PHONE_NUMBER=+27XXXXXXXXX
   ```

**Benefits:**
- Local SA number - customers trust it more
- Lower SMS costs to SA numbers
- Better delivery rates
- Professional appearance

### Option 2: Keep US Number
Your current US number works fine for:
- Sending SMS to SA numbers ✓
- Making calls to SA numbers ✓
- Receiving calls from SA ✓

**Downside:** Shows as international number to customers

## Recommended: Get SA Number

### Why SA Number is Better:
1. **Trust** - Local number = more legitimate
2. **Cost** - Cheaper SMS to SA numbers
3. **Delivery** - Better SMS delivery rates
4. **Professional** - Looks like a real SA business

### After You Get SA Number:
1. Update `.env`:
   ```
   TWILIO_PHONE_NUMBER=+27XXXXXXXXX
   ```
2. Restart server
3. Test SMS sending
4. Update any marketing materials with new number

## Current Configuration

Your `.env` currently has:
```
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+18125563620  ← Change this when you get SA number
```

## SMS Costs Comparison

### With US Number (+1):
- SMS to SA: ~$0.045 per message (~R0.85)
- 1000 SMS/month: ~R850

### With SA Number (+27):
- SMS to SA: ~$0.035 per message (~R0.65)
- 1000 SMS/month: ~R650
- **Savings:** R200/month

## How to Buy SA Number

1. **Login to Twilio:** https://console.twilio.com
2. **Click:** Phone Numbers → Buy a Number
3. **Select:** South Africa
4. **Filter:** SMS + Voice capabilities
5. **Choose:** Any available number
6. **Buy:** ~R150/month
7. **Copy:** New number to `.env`
8. **Restart:** Server

## Testing After Change

```bash
# Test SMS with new SA number
node -e "
const twilio = require('./services/twilioService');
twilio.sendSMS('+27727346573', 'Test from RoyalSmoke SA number!');
"
```

## Important Notes

- Keep your US number as backup (don't release it yet)
- Test thoroughly before switching
- Update any documentation with new number
- Inform customers if they have your old number saved

## Current Status

✅ **Working:** US number sending SMS to SA
🔄 **Pending:** Get SA number for better local presence
📋 **Action:** Buy SA number from Twilio when ready

Your system works perfectly with the US number - getting an SA number is just an optimization for better customer experience and lower costs!
