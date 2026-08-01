const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String },
    publicId: { type: String },
    type: { type: String },
  },
  { _id: false }
);

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    instructions: { type: String, trim: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    chapter: { type: mongoose.Schema.Types.ObjectId },
    classLevel: { type: String, enum: ['10', '11', '12'], required: true, index: true },
    dueDate: { type: Date, required: true },
    maxMarks: { type: Number, required: true, default: 100 },
    attachments: { type: [attachmentSchema], default: [] },
    solutionPdf: {
      url: { type: String },
      publicId: { type: String },
    },
    status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

assignmentSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Assignment', assignmentSchema);
