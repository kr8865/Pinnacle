# Pinnacle — MongoDB / Mongoose Schema Reference

All models live in `backend/models/`, one file per collection, PascalCase filenames (e.g. `Student.model.js`). Use `timestamps: true` on every schema. Add indexes as noted.

### User (`users`)
`{ name, email (unique, lowercase, indexed), password (bcrypt hash, select:false), role: enum[admin,student,teacher,parent,receptionist] default student, phone, avatar {url,publicId}, isActive: Boolean default true, lastLogin, refreshTokens: [{ token, expiresAt, device }], passwordResetToken, passwordResetExpires }`

### Student (`students`) — ref `User`
`{ user: ObjectId ref User, fatherName, motherName, mobile, parentMobile, address, city, state, pincode, gender enum[male,female,other], dob, schoolName, board enum[CBSE,ICSE,State,Other], currentClass enum['10','11','12'], course: ObjectId ref Course, aadharNumber (encrypted/masked in API responses), bloodGroup, emergencyContact, previousSchool, tenthPercentage, twelfthPercentage, medicalInfo, termsAccepted: Boolean, studentId (unique, generated on approval), registrationNumber (unique), admissionNumber (unique), admissionStatus enum[pending,approved,rejected,suspended] default pending, rejectionReason, documents: [ObjectId ref Document], bookmarks: [ObjectId ref StudyMaterial], approvedBy: ObjectId ref User, approvedAt }`
Indexes: `admissionStatus`, `course`, `currentClass`, text index on `user.name`(via populate) — keep a denormalized `searchName` field updated on save for fast text search.

### Course (`courses`)
`{ name, classLevel enum['10','11','12'], subject, description, thumbnail {url,publicId}, teacher: ObjectId ref User (nullable, future), chapters: [{ _id, title, order, materials: [ObjectId ref StudyMaterial] }], isActive: Boolean default true }`

### StudyMaterial (`studymaterials`)
`{ title, description, course: ObjectId ref Course, chapter: ObjectId (subdoc id), type enum[notes,video,pyq,worksheet,book,formula-sheet], fileUrl, publicId, videoUrl, uploadedBy: ObjectId ref User, downloadCount: Number default 0 }`

### Assignment (`assignments`)
`{ title, description, instructions, course: ObjectId ref Course, chapter, classLevel, dueDate, maxMarks, attachments: [{url,publicId,type}], solutionPdf {url,publicId}, status enum[draft,published,closed] default draft, createdBy: ObjectId ref User }`

### AssignmentSubmission (`assignmentsubmissions`)
`{ assignment: ObjectId ref Assignment, student: ObjectId ref Student, files: [{url,publicId,type}], remarks, submittedAt, status enum[pending,submitted,late,checked] default pending, marks, feedback, gradedBy: ObjectId ref User, gradedAt, attemptNumber: Number default 1 }`
Unique compound index `{ assignment: 1, student: 1 }`.

### Attendance (`attendances`)
`{ student: ObjectId ref Student, course: ObjectId ref Course, date, status enum[present,absent,leave], markedBy: ObjectId ref User }`
Unique compound index `{ student: 1, course: 1, date: 1 }`.

### Test (`tests`) & Result (`results`)
Test: `{ title, course, chapter, type enum[mcq,subjective], durationMinutes, negativeMarking (fraction, e.g. 0.25), totalMarks, questions: [{ text, options:[String], correctOption: Number, marks, negativeMarks }], status enum[draft,published,closed], createdBy }`
Result: `{ test: ObjectId ref Test, student: ObjectId ref Student, answers: [{ question: ObjectId, selected: Number, correct: Boolean, marksAwarded }], score, totalMarks, percentage, rank, startedAt, submittedAt, status enum[in-progress,submitted,auto-submitted], chapterWisePerformance: [{ chapter, correct, total }] }`

### Fee (`fees`) / Payment (`payments`) / Receipt (`receipts`)
Fee: `{ student: ObjectId ref Student, title, amount, dueDate, installmentNumber, discount, scholarship, status enum[pending,paid,overdue,partially-paid], academicYear }`
Payment: `{ fee: ObjectId ref Fee, student, amount, method enum[razorpay,cash,cheque,offline], razorpayOrderId, razorpayPaymentId, razorpaySignature, status enum[created,pending,success,failed,rejected], approvedBy, rejectedReason }`
Receipt: `{ payment: ObjectId ref Payment, receiptNumber (unique), pdfUrl, publicId, issuedAt }`

### Document (`documents`)
`{ student: ObjectId ref Student, type enum[photo,signature,tenthMarksheet,eleventhMarksheet,idProof,parentPhoto,other], url, publicId, verified: Boolean default false }`

### Announcement (`announcements`)
`{ title, body, audience enum[all,class,course], targetClass, targetCourse: ObjectId ref Course, scheduledAt, publishedAt, status enum[draft,scheduled,published], createdBy }`

### Notification (`notifications`)
`{ user: ObjectId ref User, type enum[assignment,exam,fee,attendance,announcement,message,system], title, body, link, isRead: Boolean default false, meta: Mixed }`
Index `{ user: 1, isRead: 1, createdAt: -1 }`.

### Message (`messages`) / SupportTicket (`supporttickets`)
Message: `{ from: ObjectId ref User, to: ObjectId ref User, body, isRead: Boolean default false }`
SupportTicket: `{ student: ObjectId ref Student, subject, category enum[technical,fee,academic,other], description, status enum[open,in-progress,resolved,closed] default open, responses: [{ by: ObjectId ref User, message, at }] }`

### Enrollment (`enrollments`)
`{ student: ObjectId ref Student, course: ObjectId ref Course, enrolledAt, status enum[active,completed,dropped], progress: Number default 0 }`

### ActivityLog (`activitylogs`)
`{ user: ObjectId ref User, action, ip, userAgent, meta: Mixed }` — TTL index optional (e.g. 180 days) for storage hygiene.

## Seed data
`backend/utils/seed.js` must seed: 1 admin user (`admin@pinnacletuition.com` / from `.env` `SEED_ADMIN_PASSWORD`), and the 8 courses (Class 10: Mathematics, Science, English, Hindi, Social Science, Computer; Class 11: Physics; Class 12: Physics).
