import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiArrowLeft, FiArrowRight, FiCheckCircle, FiUser, FiHome, FiClipboard, FiUpload,
} from 'react-icons/fi';
import StepProgress from '../../components/StepProgress';
import FileUploadField from '../../components/FileUploadField';
import coursesService from '../../services/courses.service';
import { useAuth } from '../../context/AuthContext';

const steps = ['Personal Details', 'Academic Details', 'Course & Documents', 'Review & Submit'];

const fieldsByStep = [
  [
    'studentName', 'fatherName', 'motherName', 'gender', 'dob', 'bloodGroup',
    'email', 'password', 'mobile', 'parentMobile', 'emergencyContact',
    'address', 'city', 'state', 'pincode', 'aadharNumber',
  ],
  ['schoolName', 'previousSchool', 'board', 'currentClass', 'tenthPercentage', 'twelfthPercentage'],
  ['selectedCourse'],
  ['termsAccepted'],
];

const fileFields = [
  { name: 'photo', label: 'Passport Size Photo', accept: 'image/*', required: true, hint: 'JPG/PNG, max 10MB' },
  { name: 'signature', label: 'Signature', accept: 'image/*', required: false, hint: 'JPG/PNG, max 10MB' },
  { name: 'idProof', label: 'ID Proof (Aadhar/Birth Certificate)', accept: 'image/*,.pdf', required: true, hint: 'JPG/PNG/PDF, max 10MB' },
  { name: 'parentPhoto', label: "Parent's Photo", accept: 'image/*', required: false, hint: 'JPG/PNG, max 10MB' },
  { name: 'tenthMarksheet', label: '10th Marksheet', accept: 'image/*,.pdf', required: false, hint: 'JPG/PNG/PDF, max 10MB' },
  { name: 'eleventhMarksheet', label: '11th Marksheet', accept: 'image/*,.pdf', required: false, hint: 'JPG/PNG/PDF, max 10MB' },
];

function FieldError({ error }) {
  if (!error) return null;
  return <p className="mt-1 text-xs text-danger">{error.message}</p>;
}

export default function Admission() {
  const { register: authRegister } = useAuth() || {};
  const [searchParams] = useSearchParams();
  const preselectedCourse = searchParams.get('course') || '';

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setError,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      studentName: '', fatherName: '', motherName: '', gender: '', dob: '', bloodGroup: '',
      email: '', password: '', mobile: '', parentMobile: '', emergencyContact: '',
      address: '', city: '', state: '', pincode: '', aadharNumber: '',
      schoolName: '', previousSchool: '', board: '', currentClass: '',
      tenthPercentage: '', twelfthPercentage: '', medicalInfo: '',
      selectedCourse: preselectedCourse, termsAccepted: false,
    },
  });

  const [step, setStep] = useState(0);
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [files, setFiles] = useState({});
  const [fileErrors, setFileErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState([]);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setCoursesLoading(true);
        const res = await coursesService.list({ limit: 100 });
        if (active) setCourses(res?.data?.data || []);
      } catch (err) {
        console.warn('Failed to load courses for admission form:', err?.message || err);
      } finally {
        if (active) setCoursesLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleFileChange = (name) => (file) => {
    setFiles((prev) => ({ ...prev, [name]: file }));
    setFileErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validateFilesForStep2 = () => {
    const nextErrors = {};
    fileFields.forEach((f) => {
      if (f.required && !files[f.name]) {
        nextErrors[f.name] = 'This document is required.';
      }
    });
    setFileErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = async () => {
    const valid = await trigger(fieldsByStep[step]);
    if (step === 2) {
      const filesValid = validateFilesForStep2();
      if (!valid || !filesValid) return;
    } else if (!valid) {
      return;
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (data) => {
    const filesValid = validateFilesForStep2();
    if (!filesValid) {
      toast.error('Please upload all required documents.');
      setStep(2);
      return;
    }

    setServerErrors([]);
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'termsAccepted') {
          formData.append(key, value ? 'true' : 'false');
        } else if (value !== undefined && value !== null) {
          formData.append(key, value);
        }
      });
      Object.entries(files).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });

      const doRegister = authRegister || null;
      const result = doRegister ? await doRegister(formData) : null;
      const payload = result?.data || result || {};
      const registrationNumber =
        payload?.registrationNumber || payload?.data?.registrationNumber || payload?.data?.regNo || null;

      toast.success('Application submitted successfully!');
      setSuccess({ registrationNumber });
    } catch (err) {
      const message = err?.response?.data?.message || 'Something went wrong while submitting your application.';
      toast.error(message);

      const apiErrors = err?.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length) {
        setServerErrors(apiErrors);
        apiErrors.forEach((e) => {
          if (e?.field && fieldsByStep.flat().includes(e.field)) {
            setError(e.field, { type: 'server', message: e.message });
          }
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const values = getValues();

  const selectedCourseLabel = useMemo(() => {
    const course = courses.find((c) => (c._id || c.id) === values.selectedCourse);
    return course ? `${course.name || course.subject} (Class ${course.classLevel})` : values.selectedCourse;
  }, [courses, values.selectedCourse]);

  if (success) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="card flex flex-col items-center gap-4 p-10 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-success/10 text-success">
            <FiCheckCircle className="h-8 w-8" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-ink dark:text-ink-light">
            Application Submitted!
          </h1>
          {success.registrationNumber && (
            <div className="rounded-2xl bg-brand-500/10 px-5 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-brand-600 dark:text-brand-300">
                Registration Number
              </p>
              <p className="font-display text-xl font-bold text-brand-700 dark:text-brand-200">
                {success.registrationNumber}
              </p>
            </div>
          )}
          <p className="max-w-md text-sm text-ink-muted dark:text-ink-lightMuted">
            Thank you for applying to Pinnacle Tuition Classes. Your admission is currently{' '}
            <span className="font-semibold text-warning">pending review</span>. Our admissions team
            will verify your documents and get in touch shortly. Please do not try to log in until
            you receive an approval confirmation by email/SMS.
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Link to="/" className="btn-primary">Back to Home</Link>
            <Link to="/contact" className="btn-secondary">Contact Admissions</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl">
        <div className="bg-blob-field absolute inset-0 -z-10">
          <div className="blob h-72 w-72 -top-16 -right-16" />
        </div>
        <div className="mx-auto max-w-2xl py-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl font-extrabold tracking-tight text-ink dark:text-ink-light sm:text-4xl"
          >
            Admission Application
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-3 text-ink-muted dark:text-ink-lightMuted"
          >
            Fill in your details below to apply for admission. Your application will be reviewed by
            our admissions team before your account is activated.
          </motion.p>
        </div>
      </section>

      <div className="card p-6 sm:p-10">
        <StepProgress steps={steps} current={step} />

        {serverErrors.length > 0 && (
          <div className="mt-6 rounded-2xl border border-danger/30 bg-danger/5 p-4">
            <p className="text-sm font-semibold text-danger">Please review the following issues:</p>
            <ul className="mt-2 list-inside list-disc text-xs text-danger">
              {serverErrors.map((e, i) => (
                <li key={i}>{e.field ? `${e.field}: ` : ''}{e.message}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 gap-5 sm:grid-cols-2"
              >
                <div className="sm:col-span-2 mb-1 flex items-center gap-2 text-brand-600 dark:text-brand-300">
                  <FiUser className="h-5 w-5" />
                  <h2 className="font-display text-lg font-bold">Personal Details</h2>
                </div>

                <div>
                  <label className="label-text">Student Name *</label>
                  <input className="input-field" {...register('studentName', { required: 'Student name is required' })} />
                  <FieldError error={errors.studentName} />
                </div>
                <div>
                  <label className="label-text">Father's Name *</label>
                  <input className="input-field" {...register('fatherName', { required: "Father's name is required" })} />
                  <FieldError error={errors.fatherName} />
                </div>
                <div>
                  <label className="label-text">Mother's Name *</label>
                  <input className="input-field" {...register('motherName', { required: "Mother's name is required" })} />
                  <FieldError error={errors.motherName} />
                </div>
                <div>
                  <label className="label-text">Gender *</label>
                  <select className="input-field" {...register('gender', { required: 'Gender is required' })}>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <FieldError error={errors.gender} />
                </div>
                <div>
                  <label className="label-text">Date of Birth *</label>
                  <input type="date" className="input-field" {...register('dob', { required: 'Date of birth is required' })} />
                  <FieldError error={errors.dob} />
                </div>
                <div>
                  <label className="label-text">Blood Group</label>
                  <select className="input-field" {...register('bloodGroup')}>
                    <option value="">Select blood group</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-text">Email *</label>
                  <input
                    type="email"
                    className="input-field"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                    })}
                  />
                  <FieldError error={errors.email} />
                </div>
                <div>
                  <label className="label-text">Password *</label>
                  <input
                    type="password"
                    className="input-field"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Minimum 6 characters' },
                    })}
                  />
                  <FieldError error={errors.password} />
                </div>
                <div>
                  <label className="label-text">Student Mobile *</label>
                  <input
                    className="input-field"
                    {...register('mobile', {
                      required: 'Mobile number is required',
                      pattern: { value: /^[0-9]{10}$/, message: 'Enter a valid 10-digit number' },
                    })}
                  />
                  <FieldError error={errors.mobile} />
                </div>
                <div>
                  <label className="label-text">Parent Mobile *</label>
                  <input
                    className="input-field"
                    {...register('parentMobile', {
                      required: 'Parent mobile number is required',
                      pattern: { value: /^[0-9]{10}$/, message: 'Enter a valid 10-digit number' },
                    })}
                  />
                  <FieldError error={errors.parentMobile} />
                </div>
                <div>
                  <label className="label-text">Emergency Contact *</label>
                  <input
                    className="input-field"
                    {...register('emergencyContact', {
                      required: 'Emergency contact is required',
                      pattern: { value: /^[0-9]{10}$/, message: 'Enter a valid 10-digit number' },
                    })}
                  />
                  <FieldError error={errors.emergencyContact} />
                </div>
                <div>
                  <label className="label-text">Aadhar Number *</label>
                  <input
                    className="input-field"
                    {...register('aadharNumber', {
                      required: 'Aadhar number is required',
                      pattern: { value: /^[0-9]{12}$/, message: 'Enter a valid 12-digit Aadhar number' },
                    })}
                  />
                  <FieldError error={errors.aadharNumber} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label-text">Address *</label>
                  <input className="input-field" {...register('address', { required: 'Address is required' })} />
                  <FieldError error={errors.address} />
                </div>
                <div>
                  <label className="label-text">City *</label>
                  <input className="input-field" {...register('city', { required: 'City is required' })} />
                  <FieldError error={errors.city} />
                </div>
                <div>
                  <label className="label-text">State *</label>
                  <input className="input-field" {...register('state', { required: 'State is required' })} />
                  <FieldError error={errors.state} />
                </div>
                <div>
                  <label className="label-text">Pincode *</label>
                  <input
                    className="input-field"
                    {...register('pincode', {
                      required: 'Pincode is required',
                      pattern: { value: /^[0-9]{6}$/, message: 'Enter a valid 6-digit pincode' },
                    })}
                  />
                  <FieldError error={errors.pincode} />
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 gap-5 sm:grid-cols-2"
              >
                <div className="sm:col-span-2 mb-1 flex items-center gap-2 text-brand-600 dark:text-brand-300">
                  <FiHome className="h-5 w-5" />
                  <h2 className="font-display text-lg font-bold">Academic Details</h2>
                </div>

                <div>
                  <label className="label-text">Current/Previous School *</label>
                  <input className="input-field" {...register('schoolName', { required: 'School name is required' })} />
                  <FieldError error={errors.schoolName} />
                </div>
                <div>
                  <label className="label-text">Previous School (if changed)</label>
                  <input className="input-field" {...register('previousSchool')} />
                </div>
                <div>
                  <label className="label-text">Board *</label>
                  <select className="input-field" {...register('board', { required: 'Board is required' })}>
                    <option value="">Select board</option>
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                    <option value="State Board">State Board</option>
                    <option value="Other">Other</option>
                  </select>
                  <FieldError error={errors.board} />
                </div>
                <div>
                  <label className="label-text">Applying for Class *</label>
                  <select className="input-field" {...register('currentClass', { required: 'Class is required' })}>
                    <option value="">Select class</option>
                    <option value="10">Class 10</option>
                    <option value="11">Class 11</option>
                    <option value="12">Class 12</option>
                  </select>
                  <FieldError error={errors.currentClass} />
                </div>
                <div>
                  <label className="label-text">10th Percentage</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    {...register('tenthPercentage', {
                      min: { value: 0, message: 'Must be between 0-100' },
                      max: { value: 100, message: 'Must be between 0-100' },
                    })}
                  />
                  <FieldError error={errors.tenthPercentage} />
                </div>
                <div>
                  <label className="label-text">12th Percentage</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    {...register('twelfthPercentage', {
                      min: { value: 0, message: 'Must be between 0-100' },
                      max: { value: 100, message: 'Must be between 0-100' },
                    })}
                  />
                  <FieldError error={errors.twelfthPercentage} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label-text">Medical Information (optional)</label>
                  <textarea
                    rows={3}
                    className="input-field"
                    placeholder="Any allergies or medical conditions we should be aware of"
                    {...register('medicalInfo')}
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-6"
              >
                <div className="mb-1 flex items-center gap-2 text-brand-600 dark:text-brand-300">
                  <FiClipboard className="h-5 w-5" />
                  <h2 className="font-display text-lg font-bold">Course Selection</h2>
                </div>
                <div>
                  <label className="label-text">Select Course *</label>
                  <select
                    className="input-field"
                    disabled={coursesLoading}
                    {...register('selectedCourse', { required: 'Please select a course' })}
                  >
                    <option value="">{coursesLoading ? 'Loading courses...' : 'Select a course'}</option>
                    {courses.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {(c.name || c.subject)} {c.classLevel ? `— Class ${c.classLevel}` : ''}
                      </option>
                    ))}
                  </select>
                  <FieldError error={errors.selectedCourse} />
                </div>

                <div className="mb-1 mt-2 flex items-center gap-2 text-brand-600 dark:text-brand-300">
                  <FiUpload className="h-5 w-5" />
                  <h2 className="font-display text-lg font-bold">Documents</h2>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {fileFields.map((f) => (
                    <FileUploadField
                      key={f.name}
                      label={f.label}
                      accept={f.accept}
                      required={f.required}
                      hint={f.hint}
                      error={fileErrors[f.name]}
                      onChange={handleFileChange(f.name)}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-6"
              >
                <div className="mb-1 flex items-center gap-2 text-brand-600 dark:text-brand-300">
                  <FiCheckCircle className="h-5 w-5" />
                  <h2 className="font-display text-lg font-bold">Review &amp; Submit</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 rounded-2xl bg-black/5 p-5 text-sm dark:bg-white/5 sm:grid-cols-2">
                  <ReviewItem label="Student Name" value={values.studentName} />
                  <ReviewItem label="Father's Name" value={values.fatherName} />
                  <ReviewItem label="Mother's Name" value={values.motherName} />
                  <ReviewItem label="Gender" value={values.gender} />
                  <ReviewItem label="Date of Birth" value={values.dob} />
                  <ReviewItem label="Email" value={values.email} />
                  <ReviewItem label="Mobile" value={values.mobile} />
                  <ReviewItem label="Parent Mobile" value={values.parentMobile} />
                  <ReviewItem label="City / State" value={[values.city, values.state].filter(Boolean).join(', ')} />
                  <ReviewItem label="School" value={values.schoolName} />
                  <ReviewItem label="Board" value={values.board} />
                  <ReviewItem label="Applying for Class" value={values.currentClass} />
                  <ReviewItem label="Selected Course" value={selectedCourseLabel} />
                  <ReviewItem
                    label="Documents Uploaded"
                    value={Object.entries(files).filter(([, f]) => f).map(([k]) => k).join(', ') || 'None'}
                  />
                </div>

                <div>
                  <label className="flex items-start gap-3 text-sm text-ink-muted dark:text-ink-lightMuted">
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-surface-border text-brand-500 focus:ring-brand-500/40"
                      checked={!!watch('termsAccepted')}
                      onChange={(e) => {
                        setValue('termsAccepted', e.target.checked, { shouldValidate: true });
                      }}
                    />
                    <span>
                      I confirm that the information provided is accurate and I agree to the{' '}
                      <Link to="/terms" target="_blank" className="font-semibold text-brand-600 dark:text-brand-300">
                        Terms &amp; Conditions
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy-policy" target="_blank" className="font-semibold text-brand-600 dark:text-brand-300">
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>
                  <FieldError error={errors.termsAccepted} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-between border-t border-surface-border pt-6 dark:border-surface-darkBorder">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className="btn-secondary disabled:opacity-40"
            >
              <FiArrowLeft className="h-4 w-4" /> Back
            </button>

            {step < steps.length - 1 ? (
              <button type="button" onClick={goNext} className="btn-primary">
                Next <FiArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function ReviewItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-lightMuted">{label}</p>
      <p className="mt-0.5 font-medium text-ink dark:text-ink-light">{value || '—'}</p>
    </div>
  );
}
