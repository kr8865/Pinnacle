const Razorpay = require('razorpay');

let instance = null;

/**
 * Lazily instantiate Razorpay so a missing key at module-load time
 * (e.g. during smoke tests) never throws synchronously.
 */
const getRazorpay = () => {
  if (instance) return instance;
  instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
  });
  return instance;
};

module.exports = getRazorpay;
