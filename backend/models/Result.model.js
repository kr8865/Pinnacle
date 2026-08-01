const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, required: true },
    selected: { type: Number },
    correct: { type: Boolean, default: false },
    marksAwarded: { type: Number, default: 0 },
  },
  { _id: false }
);

const chapterPerfSchema = new mongoose.Schema(
  {
    chapter: { type: mongoose.Schema.Types.ObjectId },
    correct: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const resultSchema = new mongoose.Schema(
  {
    test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    answers: { type: [answerSchema], default: [] },
    score: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    rank: { type: Number },
    startedAt: { type: Date },
    submittedAt: { type: Date },
    status: {
      type: String,
      enum: ['in-progress', 'submitted', 'auto-submitted'],
      default: 'in-progress',
      index: true,
    },
    chapterWisePerformance: { type: [chapterPerfSchema], default: [] },
  },
  { timestamps: true }
);

resultSchema.index({ test: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);
