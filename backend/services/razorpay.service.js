const crypto = require('crypto');
const getRazorpay = require('../config/razorpay');

/** Creates a Razorpay order for the given amount (in rupees). */
const createOrder = async ({ amount, receipt, notes = {} }) => {
  const razorpay = getRazorpay();
  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100), // paise
    currency: 'INR',
    receipt,
    notes,
  });
  return order;
};

/** Verifies the HMAC SHA256 signature Razorpay sends back after checkout. */
const verifySignature = ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
    .update(body)
    .digest('hex');
  return expectedSignature === razorpay_signature;
};

module.exports = { createOrder, verifySignature };
