const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    type: {
      type: String,
      enum: ['photo', 'signature', 'tenthMarksheet', 'eleventhMarksheet', 'idProof', 'parentPhoto', 'other'],
      required: true,
    },
    url: { type: String, required: true },
    publicId: { type: String },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
