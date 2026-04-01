const nodemailer = require('nodemailer');

const ADMIN_EMAIL = 'royalsmoke.exclusives@gmail.com';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || ADMIN_EMAIL,
        pass: process.env.EMAIL_PASS || 'app_password_here'
    }
});

const sendOrderNotification = async (order, customer) => {
    try {
        console.log(`[EMAIL] Sending order notification for Order #${order.id}...`);

        const itemsHtml = order.items.map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #333;">
                    <strong>${item.name || 'Product ID: ' + item.product_id}</strong> x ${item.quantity}
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #333; text-align: right;">
                    R ${Number(item.price).toFixed(2)}
                </td>
            </tr>
        `).join('');

        const mailOptions = {
            from: `"RoyalSmoke AI" <${ADMIN_EMAIL}>`,
            to: ADMIN_EMAIL,
            subject: `🔥 NEW ORDER: ${customer.name} - R${order.total_amount}`,
            html: `
                <div style="background-color: #0f172a; color: #f1f5f9; padding: 40px; font-family: sans-serif; max-width: 600px; margin: auto; border-radius: 20px; border: 1px solid #334155;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #fbbf24; margin-bottom: 5px; font-family: serif;">RoyalSmoke Exclusives</h1>
                        <p style="color: #64748b; text-transform: uppercase; font-size: 10px; font-weight: 800; letter-spacing: 2px;">Order Notification System</p>
                    </div>

                    <div style="background-color: #1e293b; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
                        <h2 style="margin-top: 0; color: #fbbf24; font-size: 18px;">Order Summary</h2>
                        <table style="width: 100%; border-collapse: collapse;">
                            ${itemsHtml}
                        </table>
                        <div style="margin-top: 20px; text-align: right;">
                            <p style="margin: 0; color: #94a3b8;">Subtotal: R ${order.total_amount - order.delivery_fee}</p>
                            <p style="margin: 0; color: #94a3b8;">Delivery: R ${order.delivery_fee}</p>
                            <h3 style="color: #fbbf24; font-size: 24px; margin: 10px 0 0 0;">Total: R ${order.total_amount}</h3>
                        </div>
                    </div>

                    <div style="background-color: #1e293b; padding: 20px; border-radius: 12px;">
                        <h2 style="margin-top: 0; color: #c084fc; font-size: 18px;">Customer Details</h2>
                        <p style="margin: 5px 0;"><strong>Name:</strong> ${customer.name}</p>
                        <p style="margin: 5px 0;"><strong>Phone:</strong> ${customer.phone}</p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> ${customer.email || 'None'}</p>
                        <p style="margin: 5px 0;"><strong>DOB:</strong> ${customer.dob || 'Not provided'}</p>
                        <div style="margin-top: 15px; border-top: 1px solid #334155; pt: 10px;">
                            <p style="margin: 5px 0;"><strong>Address:</strong><br/>${customer.address}</p>
                            ${customer.postal_code ? `<p style="margin: 5px 0;"><strong>Postal Code:</strong> ${customer.postal_code}</p>` : ''}
                        </div>
                    </div>

                    <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #64748b; border-top: 1px solid #334155; padding-top: 20px;">
                        <p>© 2026 RoyalSmoke Exclusives • All Legal Guidelines Observed • 18+ Verification Confirmed</p>
                    </div>
                </div>
            `
        };

        if (!process.env.EMAIL_PASS) {
            console.warn('[EMAIL] Not sending actually as EMAIL_PASS is missing. Check .env');
            return false;
        }

        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL] Message sent: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('[EMAIL] Send error:', error);
        return false;
    }
};

module.exports = {
    sendOrderNotification
};
