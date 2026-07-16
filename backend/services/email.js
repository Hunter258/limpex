const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
    if (transporter) return transporter;
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('Email not configured (missing SMTP_* env vars). Emails will be logged only.');
        return null;
    }
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: (process.env.SMTP_PORT === '465'),
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
    return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
    if (!to) return;
    const transport = getTransporter();
    const mailOptions = {
        from: process.env.EMAIL_FROM || 'Limpex <noreply@limpex.com>',
        to,
        subject,
        html,
    };

    if (!transport) {
        console.log(`[EMAIL LOG] To: ${to} | Subject: ${subject}`);
        return;
    }

    try {
        await transport.sendMail(mailOptions);
        console.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
        console.error(`Email send failed to ${to}:`, error.message);
    }
};

const sendOrderConfirmation = async (order, items) => {
    const itemRows = items.map(item =>
        `<tr>
            <td style="padding:8px;border-bottom:1px solid #eee">${item.product_name}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity} ${item.unit}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">&#8377;${item.price}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-weight:600">&#8377;${(item.quantity * item.price).toFixed(0)}</td>
        </tr>`
    ).join('');

    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#00b4a0;color:white;padding:24px;text-align:center">
            <h1 style="margin:0;font-size:24px">Order Confirmed!</h1>
            <p style="margin:8px 0 0;opacity:0.9">Order #${order.id}</p>
        </div>
        <div style="padding:24px;background:#fff">
            <p>Hi ${order.customer_name},</p>
            <p>Thank you for your order. We've received it and are processing it now.</p>
            <div style="background:#f0fdf4;border-radius:8px;padding:16px;margin:16px 0;border:1px solid #bbf7d0">
                <strong style="color:#166534">Estimated Delivery:</strong> ${order.delivery_estimate}
            </div>
            <h3 style="margin:24px 0 12px;font-size:16px">Order Items</h3>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
                <thead>
                    <tr style="background:#f9fafb">
                        <th style="padding:8px;text-align:left">Item</th>
                        <th style="padding:8px;text-align:center">Qty</th>
                        <th style="padding:8px;text-align:right">Price</th>
                        <th style="padding:8px;text-align:right">Total</th>
                    </tr>
                </thead>
                <tbody>${itemRows}</tbody>
            </table>
            <div style="border-top:2px solid #00b4a0;margin-top:16px;padding-top:16px;display:flex;justify-content:space-between">
                <span style="font-size:18px;font-weight:700">Total Paid</span>
                <span style="font-size:18px;font-weight:700;color:#00b4a0">&#8377;${order.total_amount}</span>
            </div>
            <div style="margin-top:16px;padding:12px;background:#f8fafb;border-radius:8px;font-size:13px;color:#666">
                <p style="margin:0"><strong>Payment:</strong> ${order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method === 'upi' ? 'UPI' : 'Card'}</p>
                <p style="margin:4px 0 0"><strong>Delivery Address:</strong> ${order.delivery_address}</p>
            </div>
            <p style="margin-top:24px;font-size:13px;color:#666">Track your order at: <a href="${process.env.FRONTEND_URL || 'https://limpex-production.up.railway.app'}/track-order/${order.id}">Track Order #${order.id}</a></p>
        </div>
        <div style="background:#f9fafb;padding:16px;text-align:center;font-size:12px;color:#999">
            <p style="margin:0">Limpex - Premium Fresh Produce</p>
            <p style="margin:4px 0 0">+91 98921 99247 | limpex@upi</p>
        </div>
    </div>`;

    await sendEmail({ to: order.customer_email, subject: `Order #${order.id} Confirmed - Limpex`, html });
};

const sendOrderStatusUpdate = async (order, newStatus) => {
    const statusMessages = {
        confirmed: 'Your order has been confirmed and is being prepared.',
        processing: 'Your order is now being processed.',
        shipped: 'Your order has been shipped and is on its way!',
        out_for_delivery: 'Your order is out for delivery today!',
        delivered: 'Your order has been delivered. Thank you!',
        cancelled: 'Your order has been cancelled.',
    };

    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#00b4a0;color:white;padding:20px;text-align:center">
            <h1 style="margin:0;font-size:20px">Order Status Update</h1>
        </div>
        <div style="padding:24px;background:#fff">
            <p>Hi ${order.customer_name},</p>
            <p>${statusMessages[newStatus] || `Your order status has been updated to ${newStatus}.`}</p>
            <div style="text-align:center;margin:24px 0">
                <span style="display:inline-block;padding:12px 32px;background:${newStatus === 'delivered' ? '#16a34a' : '#00b4a0'};color:white;border-radius:8px;font-size:16px;font-weight:600;text-transform:capitalize">${newStatus.replace(/_/g, ' ')}</span>
            </div>
            <p style="font-size:14px;color:#666">Order #${order.id} | Total: &#8377;${order.total_amount}</p>
            <p style="margin-top:20px"><a href="${process.env.FRONTEND_URL || 'https://limpex-production.up.railway.app'}/track-order/${order.id}" style="color:#00b4a0;font-weight:600">Track your order</a></p>
        </div>
    </div>`;

    await sendEmail({ to: order.customer_email, subject: `Order #${order.id} - ${newStatus.replace(/_/g, ' ')} | Limpex`, html });
};

module.exports = { sendEmail, sendOrderConfirmation, sendOrderStatusUpdate };
