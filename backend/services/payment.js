const Razorpay = require('razorpay');

const razorpay = process.env.RAZORPAY_KEY_ID
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
    : null;

const createRazorpayOrder = async (amount, receipt) => {
    if (!razorpay) {
        throw new Error('Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
    }
    const order = await razorpay.orders.create({
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: receipt || `order_${Date.now()}`,
    });
    return order;
};

const verifyRazorpayPayment = (orderId, paymentId, signature) => {
    if (!razorpay) return false;
    const crypto = require('crypto');
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
    return expectedSignature === signature;
};

module.exports = { createRazorpayOrder, verifyRazorpayPayment, razorpay };
