const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    chapter: { type: mongoose.Schema.Types.ObjectId },
    type: {
      type: String,
      enum: ['notes', 'video', 'pyq', 'worksheet', 'book', 'formula-sheet'],
      required: true,
      index: true,
    },
    fileUrl: { type: String },
    publicId: { type: String },
    videoUrl: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

studyMaterialSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);
