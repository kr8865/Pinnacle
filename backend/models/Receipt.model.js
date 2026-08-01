const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema(
  {
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
    receiptNumber: { type: String, required: true, unique: true },
    pdfUrl: { type: String },
    publicId: { type: String },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Receipt', receiptSchema);
