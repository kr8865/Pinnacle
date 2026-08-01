const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fatherName: { type: String, trim: true },
    motherName: { type: String, trim: true },
    mobile: { type: String, trim: true },
    parentMobile: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true, index: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    dob: { type: Date },
    schoolName: { type: String, trim: true },
    board: { type: String, enum: ['CBSE', 'ICSE', 'State', 'Other'] },
    currentClass: { type: String, enum: ['10', '11', '12'], index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', index: true },
    aadharNumber: { type: String, trim: true },
    bloodGroup: { type: String, trim: true },
    emergencyContact: { type: String, trim: true },
    previousSchool: { type: String, trim: true },
    tenthPercentage: { type: Number },
    twelfthPercentage: { type: Number },
    medicalInfo: { type: String, trim: true },
    termsAccepted: { type: Boolean, default: false },

    studentId: { type: String, unique: true, sparse: true },
    registrationNumber: { type: String, unique: true, sparse: true },
    admissionNumber: { type: String, unique: true, sparse: true },

    admissionStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
      index: true,
    },
    rejectionReason: { type: String },

    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'StudyMaterial' }],

    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },

    // Denormalized for fast text search without needing to populate `user`.
    searchName: { type: String, trim: true, index: true },
  },
  { timestamps: true }
);

studentSchema.index({ admissionStatus: 1 });
studentSchema.index({ course: 1 });
studentSchema.index({ currentClass: 1 });
studentSchema.index({ searchName: 'text', studentId: 'text', registrationNumber: 'text', admissionNumber: 'text' });

module.exports = mongoose.model('Student', studentSchema);
