const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    options: { type: [String], default: [] },
    correctOption: { type: Number, required: true },
    marks: { type: Number, default: 1 },
    negativeMarks: { type: Number, default: 0 },
  },
  { timestamps: false }
);

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    chapter: { type: mongoose.Schema.Types.ObjectId },
    type: { type: String, enum: ['mcq', 'subjective'], default: 'mcq' },
    durationMinutes: { type: Number, required: true, default: 30 },
    negativeMarking: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    questions: { type: [questionSchema], default: [] },
    status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

testSchema.pre('save', function computeTotalMarks(next) {
  if (this.questions && this.questions.length) {
    this.totalMarks = this.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  }
  next();
});

module.exports = mongoose.model('Test', testSchema);
