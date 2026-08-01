const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    materials: [{ type: mongoose.Schema.Types.ObjectId, ref: 'StudyMaterial' }],
    videos: [{ type: String }],
  },
  { timestamps: true }
);

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    classLevel: { type: String, enum: ['10', '11', '12'], required: true, index: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    thumbnail: {
      url: { type: String },
      publicId: { type: String },
    },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    chapters: { type: [chapterSchema], default: [] },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

courseSchema.index({ name: 'text', subject: 'text' });
courseSchema.index({ classLevel: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('Course', courseSchema);
