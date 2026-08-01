/**
 * Seed script for sample STUDENT accounts (separate from utils/seed.js,
 * which only seeds the admin user + course catalogue).
 *
 * Creates a handful of students across different classes/courses with a
 * mix of admission statuses (approved / pending / rejected) so you have
 * real data to test the student portal, login flow, and the admin
 * admissions-review screen without filling out the admission form by hand.
 *
 * Idempotent — safe to re-run; skips any student whose email already exists.
 *
 * Usage: npm run seed:students   (or: node utils/seed1.js)
 */
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User.model');
const Student = require('../models/Student.model');
const Course = require('../models/Course.model');
const { generateStudentCodes } = require('./idGenerators');

// Default password for every seeded student (they can change it later via
// "Change Password" once logged in). Shown again in the console output.
const DEFAULT_PASSWORD = process.env.SEED_STUDENT_PASSWORD || 'Student@123';

const STUDENTS = [
  {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    fatherName: 'Rajesh Sharma',
    motherName: 'Sunita Sharma',
    mobile: '9876500001',
    parentMobile: '9876500011',
    address: '12 MG Road',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    gender: 'male',
    dob: '2009-04-12',
    schoolName: 'DAV Public School',
    board: 'CBSE',
    currentClass: '10',
    courseMatch: { classLevel: '10', subject: 'Mathematics' },
    aadharNumber: '123456789012',
    bloodGroup: 'B+',
    emergencyContact: '9876500011',
    tenthPercentage: undefined,
    admissionStatus: 'approved',
  },
  {
    name: 'Priya Verma',
    email: 'priya.verma@example.com',
    fatherName: 'Anil Verma',
    motherName: 'Kavita Verma',
    mobile: '9876500002',
    parentMobile: '9876500012',
    address: '45 Lake View',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411002',
    gender: 'female',
    dob: '2009-08-23',
    schoolName: 'Delhi Public School',
    board: 'CBSE',
    currentClass: '10',
    courseMatch: { classLevel: '10', subject: 'Science' },
    aadharNumber: '123456789013',
    bloodGroup: 'A+',
    emergencyContact: '9876500012',
    admissionStatus: 'approved',
  },
  {
    name: 'Rohan Gupta',
    email: 'rohan.gupta@example.com',
    fatherName: 'Sanjay Gupta',
    motherName: 'Meena Gupta',
    mobile: '9876500003',
    parentMobile: '9876500013',
    address: '78 Civil Lines',
    city: 'Nagpur',
    state: 'Maharashtra',
    pincode: '440001',
    gender: 'male',
    dob: '2008-01-15',
    schoolName: 'St. Xavier\'s High School',
    board: 'ICSE',
    currentClass: '11',
    courseMatch: { classLevel: '11', subject: 'Physics' },
    aadharNumber: '123456789014',
    bloodGroup: 'O+',
    emergencyContact: '9876500013',
    tenthPercentage: 88.4,
    admissionStatus: 'approved',
  },
  {
    name: 'Sneha Iyer',
    email: 'sneha.iyer@example.com',
    fatherName: 'Ravi Iyer',
    motherName: 'Lakshmi Iyer',
    mobile: '9876500004',
    parentMobile: '9876500014',
    address: '9 Anna Nagar',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600040',
    gender: 'female',
    dob: '2007-11-02',
    schoolName: 'Chennai Public School',
    board: 'State',
    currentClass: '12',
    courseMatch: { classLevel: '12', subject: 'Physics' },
    aadharNumber: '123456789015',
    bloodGroup: 'AB+',
    emergencyContact: '9876500014',
    tenthPercentage: 91.2,
    twelfthPercentage: undefined,
    admissionStatus: 'pending', // left pending on purpose — test the admin approve/reject flow
  },
  {
    name: 'Karan Mehta',
    email: 'karan.mehta@example.com',
    fatherName: 'Vikram Mehta',
    motherName: 'Anita Mehta',
    mobile: '9876500005',
    parentMobile: '9876500015',
    address: '21 Model Town',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411003',
    gender: 'male',
    dob: '2009-06-30',
    schoolName: 'Ryan International School',
    board: 'CBSE',
    currentClass: '10',
    courseMatch: { classLevel: '10', subject: 'English' },
    aadharNumber: '123456789016',
    bloodGroup: 'B-',
    emergencyContact: '9876500015',
    admissionStatus: 'rejected',
    rejectionReason: 'Incomplete documents submitted',
  },
];

const seedStudents = async () => {
  const admin = await User.findOne({ role: 'admin' });

  // eslint-disable-next-line no-restricted-syntax
  for (const s of STUDENTS) {
    const email = s.email.toLowerCase();
    // eslint-disable-next-line no-await-in-loop
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // eslint-disable-next-line no-console
      console.log(`[seed:students] Skipping (already exists): ${email}`);
      continue; // eslint-disable-line no-continue
    }

    // eslint-disable-next-line no-await-in-loop
    const course = await Course.findOne(s.courseMatch);
    if (!course) {
      // eslint-disable-next-line no-console
      console.warn(
        `[seed:students] No matching course for ${email} (${JSON.stringify(s.courseMatch)}) — run "npm run seed" first. Skipping.`
      );
      continue; // eslint-disable-line no-continue
    }

    // eslint-disable-next-line no-await-in-loop
    const user = await User.create({
      name: s.name,
      email,
      password: DEFAULT_PASSWORD,
      role: 'student',
      phone: s.mobile,
      isActive: true,
    });

    const studentDoc = {
      user: user._id,
      fatherName: s.fatherName,
      motherName: s.motherName,
      mobile: s.mobile,
      parentMobile: s.parentMobile,
      address: s.address,
      city: s.city,
      state: s.state,
      pincode: s.pincode,
      gender: s.gender,
      dob: s.dob,
      schoolName: s.schoolName,
      board: s.board,
      currentClass: s.currentClass,
      course: course._id,
      aadharNumber: s.aadharNumber,
      bloodGroup: s.bloodGroup,
      emergencyContact: s.emergencyContact,
      tenthPercentage: s.tenthPercentage,
      twelfthPercentage: s.twelfthPercentage,
      termsAccepted: true,
      admissionStatus: s.admissionStatus,
      rejectionReason: s.rejectionReason,
      searchName: s.name,
    };

    if (s.admissionStatus === 'approved') {
      // eslint-disable-next-line no-await-in-loop
      const codes = await generateStudentCodes(Student);
      Object.assign(studentDoc, codes, {
        approvedBy: admin?._id,
        approvedAt: new Date(),
      });
    }

    // eslint-disable-next-line no-await-in-loop
    await Student.create(studentDoc);

    // eslint-disable-next-line no-console
    console.log(
      `[seed:students] Created ${s.admissionStatus} student: ${s.name} <${email}> — ${course.name} (Class ${course.classLevel})`
    );
  }
};

const run = async () => {
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    // eslint-disable-next-line no-console
    console.error('[seed:students] Could not connect to MongoDB. Aborting seed.');
    process.exit(1);
  }

  await seedStudents();

  // eslint-disable-next-line no-console
  console.log(`\n[seed:students] Done. All seeded students use the password: ${DEFAULT_PASSWORD}`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed:students] Seeding failed:', err);
  process.exit(1);
});
