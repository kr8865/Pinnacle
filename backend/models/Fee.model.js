const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    installmentNumber: { type: Number, default: 1 },
    discount: { type: Number, default: 0 },
    scholarship: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'partially-paid'],
      default: 'pending',
      index: true,
    },
    academicYear: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Fee', feeSchema);
