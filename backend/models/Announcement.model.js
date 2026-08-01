const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    audience: { type: String, enum: ['all', 'class', 'course'], default: 'all' },
    targetClass: { type: String, enum: ['10', '11', '12', null], default: null },
    targetCourse: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    scheduledAt: { type: Date },
    publishedAt: { type: Date },
    status: { type: String, enum: ['draft', 'scheduled', 'published'], default: 'draft', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);
