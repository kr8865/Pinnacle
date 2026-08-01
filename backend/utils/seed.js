/**
 * Idempotent database seed script. Safe to re-run — uses upsert-style
 * logic so nothing is duplicated on subsequent runs.
 *
 * Usage: npm run seed
 */
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User.model');
const Course = require('../models/Course.model');

const COURSES = [
  { classLevel: '10', subject: 'Mathematics', name: 'Mathematics' },
  { classLevel: '10', subject: 'Science', name: 'Science' },
  { classLevel: '10', subject: 'English', name: 'English' },
  { classLevel: '10', subject: 'Hindi', name: 'Hindi' },
  { classLevel: '10', subject: 'Social Science', name: 'Social Science' },
  { classLevel: '10', subject: 'Computer', name: 'Computer' },
  { classLevel: '11', subject: 'Physics', name: 'Physics' },
  { classLevel: '12', subject: 'Physics', name: 'Physics' },
];

const seedAdmin = async () => {
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@pinnacletuition.com').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

  const existing = await User.findOne({ email });
  if (existing) {
    // eslint-disable-next-line no-console
    console.log(`[seed] Admin user already exists, skipping: ${email}`);
    return existing;
  }

  const admin = await User.create({
    name: 'Pinnacle Admin',
    email,
    password,
    role: 'admin',
    isActive: true,
  });
  // eslint-disable-next-line no-console
  console.log(`[seed] Admin user created: ${email}`);
  return admin;
};

const seedCourses = async () => {
  // eslint-disable-next-line no-restricted-syntax
  for (const c of COURSES) {
    // eslint-disable-next-line no-await-in-loop
    const course = await Course.findOneAndUpdate(
      { classLevel: c.classLevel, subject: c.subject },
      {
        $setOnInsert: {
          name: c.name,
          classLevel: c.classLevel,
          subject: c.subject,
          description: `${c.subject} — Class ${c.classLevel}`,
          isActive: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    // eslint-disable-next-line no-console
    console.log(`[seed] Course ready: ${course.name} (Class ${course.classLevel})`);
  }
};

const run = async () => {
  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    // eslint-disable-next-line no-console
    console.error('[seed] Could not connect to MongoDB. Aborting seed.');
    process.exit(1);
  }

  await seedAdmin();
  await seedCourses();

  // eslint-disable-next-line no-console
  console.log('[seed] Seeding complete.');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed] Seeding failed:', err);
  process.exit(1);
});
