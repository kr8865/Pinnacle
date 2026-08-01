const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    url: { type: String },
    publicId: { type: String },
    type: { type: String },
  },
  { _id: false }
);

const assignmentSubmissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    files: { type: [fileSchema], default: [] },
    remarks: { type: String, trim: true },
    submittedAt: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'late', 'checked'],
      default: 'pending',
      index: true,
    },
    marks: { type: Number },
    feedback: { type: String, trim: true },
    gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    gradedAt: { type: Date },
    attemptNumber: { type: Number, default: 1 },
  },
  { timestamps: true }
);

assignmentSubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
