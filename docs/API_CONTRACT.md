# Pinnacle Tuition Classes — API Contract (v1)

Base URL: `/api/v1`
Auth: `Authorization: Bearer <accessToken>` header. Refresh token sent as httpOnly cookie `refreshToken`.
All list endpoints support `?page=&limit=&sort=&search=` and return:
```json
{ "success": true, "data": [...], "meta": { "page":1, "limit":20, "total":123, "pages":7 } }
```
All errors return:
```json
{ "success": false, "message": "...", "errors": [ { "field":"email","message":"Invalid email" } ] }
```

## Roles
`admin`, `student` (schema also reserves `teacher`, `parent`, `receptionist` for future use — do not build UI for these now, just leave the enum values and model fields in place).

---
## 1. Auth — `/auth`
- `POST /auth/register` — student self-registration (multipart/form-data, see Admission fields below). Creates `User` + `Student` with `admissionStatus: pending`. Returns registration number, no tokens (must wait for approval).
- `POST /auth/login` — `{ email, password, remember }` → validates `admissionStatus === approved` for students and `isActive` for all. Returns `{ accessToken, user }`, sets `refreshToken` httpOnly cookie (30d if remember else 1d).
- `POST /auth/admin-login` — same shape, role must be admin.
- `POST /auth/refresh` — reads cookie, issues new access token.
- `POST /auth/logout` — clears refresh cookie, revokes token in DB (`ActivityLog` entry).
- `POST /auth/forgot-password` — `{ email }` → emails reset link (Nodemailer) with signed token (1h expiry).
- `POST /auth/reset-password/:token` — `{ password }`.
- `POST /auth/change-password` — (auth required) `{ oldPassword, newPassword }`.
- `GET /auth/me` — current user profile.

## 2. Students / Admissions — `/students`
Admission form fields (multipart): studentName, fatherName, motherName, email, password, mobile, parentMobile, address, city, state, pincode, gender, dob, schoolName, board, currentClass, selectedCourse (course id), aadharNumber, bloodGroup, emergencyContact, previousSchool, tenthPercentage, twelfthPercentage, medicalInfo, termsAccepted(bool). Files: photo, signature, tenthMarksheet, eleventhMarksheet, idProof, parentPhoto (each uploaded to Cloudinary via `services/cloudinary.service.js`, stored as `Document` records linked to student).

- `GET /students` (admin) — filters: status, course, class, city, search; pagination.
- `GET /students/:id` (admin, or self)
- `PATCH /students/:id` (admin/self depending on field set)
- `PATCH /students/:id/approve` (admin) — sets admissionStatus=approved, generates `studentId`, `registrationNumber`, `admissionNumber` (format: PTC-{year}-{seq}), emails welcome mail.
- `PATCH /students/:id/reject` (admin) — body `{ reason }`.
- `PATCH /students/:id/suspend` (admin)
- `DELETE /students/:id` (admin)
- `POST /students/bulk-upload` (admin, CSV via multer) — creates pending students.
- `POST /students/bulk-delete` (admin) — `{ ids: [] }`
- `GET /students/export/excel` (admin) — filtered export
- `GET /students/export/pdf` (admin)
- `GET /students/:id/documents` — list Document records
- `GET /students/:id/id-card` — returns ID card data incl. QR payload (JSON string of studentId+admissionNumber, verifiable via `/students/verify/:studentId`)

## 3. Courses — `/courses`
Seed data: Class 10 (Mathematics, Science, English, Hindi, Social Science, Computer), Class 11 (Physics), Class 12 (Physics).
- `GET /courses` (public, for landing page)
- `GET /courses/:id`
- `POST /courses` (admin)
- `PATCH /courses/:id` (admin)
- `DELETE /courses/:id` (admin)
- `POST /courses/:id/chapters` (admin) — add chapter `{ title, order }`
- Course model holds `chapters: [{ title, order, materials: [StudyMaterial ids], videos: [...] }]`

## 4. Study Material — `/study-materials`
- `GET /study-materials?course=&chapter=&type=&search=` — types: notes, video, pyq, worksheet, book, formula-sheet
- `POST /study-materials` (admin, multipart upload to Cloudinary)
- `DELETE /study-materials/:id` (admin)
- `POST /study-materials/:id/bookmark` (student, toggles in `Student.bookmarks`)
- `GET /study-materials/bookmarked` (student)

## 5. Assignments — `/assignments`
- `GET /assignments?course=&class=&status=` (role-aware: students only see published & assigned-to-them)
- `POST /assignments` (admin) — `{ title, course, chapter, class, dueDate, maxMarks, instructions, files[], solutionPdf }`
- `PATCH /assignments/:id` (admin)
- `PATCH /assignments/:id/publish` / `/close` (admin)
- `DELETE /assignments/:id` (admin)
- `POST /assignments/:id/submit` (student, multipart: files, remarks) → creates/updates `AssignmentSubmission`, status auto-computed (`submitted` vs `late` based on dueDate)
- `GET /assignments/:id/submissions` (admin) — list + filters
- `PATCH /assignments/submissions/:submissionId/grade` (admin) — `{ marks, feedback }` → status=checked
- `GET /assignments/my-submissions` (student)

## 6. Attendance — `/attendance`
- `POST /attendance/mark` (admin) — `{ course, date, records: [{ student, status }] }` (status: present/absent/leave)
- `GET /attendance?student=&course=&month=&year=` — daily records
- `GET /attendance/summary/:studentId` — `{ present, absent, percentage, monthly:[...] }`

## 7. Tests & Results — `/tests`
- `POST /tests` (admin) — `{ title, course, chapter, type: mcq|subjective, durationMinutes, negativeMarking, questions:[{ text, options:[], correctOption, marks }] }`
- `GET /tests?course=` (student sees published+upcoming/active only)
- `POST /tests/:id/start` (student) — creates `Result` doc in-progress, returns questions w/o answers + server start time (for timer/auto-submit)
- `POST /tests/:id/submit` (student) — `{ answers:[{questionId, selected}] }` → auto-grades MCQ, computes score/rank
- `GET /tests/:id/leaderboard`
- `GET /results/my` (student) — history + chapter-wise performance + weak/strong chapters
- `GET /results/:studentId` (admin)

## 8. Fees & Payments — `/fees`, `/payments`
- `POST /fees/generate` (admin) — `{ student, amount, dueDate, installments, discount, scholarship }`
- `GET /fees/due` (student) / `GET /fees?student=&status=` (admin)
- `POST /payments/create-order` (student) — `{ feeId }` → creates Razorpay order (test mode), returns order id/key
- `POST /payments/verify` (student) — `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }` → verifies signature, marks Payment success, generates Receipt PDF (Cloudinary), triggers Notification
- `POST /payments/:id/approve` / `/reject` (admin, for manual/offline payments)
- `GET /payments/history` (student)
- `GET /payments/:id/receipt` — signed PDF URL
- `GET /fees/reports/revenue` (admin) — monthly revenue analytics

## 9. Announcements — `/announcements`
- `GET /announcements` (role-aware)
- `POST /announcements` (admin) — `{ title, body, audience: all|class|course, scheduledAt }`
- `PATCH /announcements/:id` / `DELETE /announcements/:id` (admin)
- On publish → emits Socket.IO event `announcement:new` to targeted room(s) + creates `Notification` docs.

## 10. Notifications — `/notifications`
- `GET /notifications` (auth) — paginated, unread count
- `PATCH /notifications/:id/read`
- `PATCH /notifications/read-all`
- Socket.IO rooms: `user:{userId}`, `role:admin`, `course:{courseId}`. Events: `notification:new`, `announcement:new`.

## 11. Messaging / Support — `/messages`, `/support-tickets`
- `GET /messages/:withUserId` (auth) — conversation thread
- `POST /messages` — `{ to, body }` (emits socket `message:new`)
- `POST /support-tickets` (student) — `{ subject, category, description }`
- `GET /support-tickets` (admin: all, student: own)
- `PATCH /support-tickets/:id` (admin) — `{ status, response }`

## 12. Reports & Analytics — `/reports`, `/analytics`
- `GET /analytics/dashboard` (admin) — totals: students, todayAttendance, assignmentsPending/Submitted, courses, revenue, feeDue, activeStudents, recentAdmissions, recentPayments, recentAssignments
- `GET /analytics/graphs?type=revenue|attendance|admissions|growth&range=`
- `GET /reports/:type/export?format=excel|pdf` — type: attendance, fee, revenue, student, assignment, admission

## 13. Search — `/search?q=`
Global search across Students, Assignments, Courses, Payments, Attendance (admin only), scoped for students to their own data.

---
## Standard Middleware Order (every protected route)
`helmet → cors → rateLimiter → express-mongo-sanitize → xss-clean equivalent → authenticate (JWT) → authorize(roles) → validate (express-validator/zod schema) → controller`

## File Upload Rules
- Max 10MB per file, allowed mimetypes per field (images: jpg/png/webp; docs: pdf/doc/docx; assignments also allow zip).
- All uploads go through `services/upload.service.js` → Cloudinary (folder structure: `pinnacle/students/{id}`, `pinnacle/assignments/{id}`, `pinnacle/study-materials`, `pinnacle/receipts`).
