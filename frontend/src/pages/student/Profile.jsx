import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { FiEdit2, FiCreditCard, FiMail, FiHash } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import { Avatar } from '../../components/Avatar';
import StatusPill from '../../components/Badge';
import { SkeletonCard } from '../../components/Skeleton';
import studentsService from '../../services/students.service';

export default function Profile() {
  const { user, refreshMe } = useAuth();
  const studentProfile = user?.studentProfile;

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [idCardOpen, setIdCardOpen] = useState(false);
  const [idCardLoading, setIdCardLoading] = useState(false);
  const [idCard, setIdCard] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (editOpen && studentProfile) {
      reset({
        mobile: studentProfile.mobile || '',
        parentMobile: studentProfile.parentMobile || '',
        address: studentProfile.address || '',
        city: studentProfile.city || '',
        state: studentProfile.state || '',
        pincode: studentProfile.pincode || '',
        emergencyContact: studentProfile.emergencyContact || '',
        medicalInfo: studentProfile.medicalInfo || '',
        bloodGroup: studentProfile.bloodGroup || '',
      });
    }
  }, [editOpen, studentProfile, reset]);

  const onSubmit = async (values) => {
    if (!studentProfile?._id) return;
    setSaving(true);
    try {
      await studentsService.update(studentProfile._id, values);
      await refreshMe();
      toast.success('Profile updated successfully');
      setEditOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  const openIdCard = async () => {
    setIdCardOpen(true);
    if (!studentProfile?._id) return;
    setIdCardLoading(true);
    try {
      const { data } = await studentsService.idCard(studentProfile._id);
      setIdCard(data?.data || null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not load ID card');
      setIdCardOpen(false);
    } finally {
      setIdCardLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="space-y-6 pt-6">
        <SkeletonCard />
      </div>
    );
  }

  const infoRows = [
    { label: 'Student ID', value: studentProfile?.studentId || '—' },
    { label: 'Registration No.', value: studentProfile?.registrationNumber || '—' },
    { label: 'Admission No.', value: studentProfile?.admissionNumber || '—' },
    { label: 'Course', value: studentProfile?.course?.name || '—' },
    { label: 'Class', value: studentProfile?.currentClass || '—' },
    { label: 'Mobile', value: studentProfile?.mobile || '—' },
    { label: 'Parent Mobile', value: studentProfile?.parentMobile || '—' },
    { label: 'Blood Group', value: studentProfile?.bloodGroup || '—' },
    { label: 'City', value: studentProfile?.city || '—' },
    { label: 'State', value: studentProfile?.state || '—' },
    { label: 'Pincode', value: studentProfile?.pincode || '—' },
    { label: 'Address', value: studentProfile?.address || '—' },
    { label: 'Emergency Contact', value: studentProfile?.emergencyContact || '—' },
    { label: 'Medical Info', value: studentProfile?.medicalInfo || '—' },
  ];

  return (
    <div className="space-y-6 pt-6">
      {/* Profile header card */}
      <div className="card p-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Avatar name={user?.name} src={user?.avatar?.url} size="lg" />
            <div>
              <h1 className="font-display text-xl font-bold text-ink dark:text-ink-light">{user?.name}</h1>
              <p className="flex items-center gap-1.5 text-sm text-ink-muted dark:text-ink-lightMuted">
                <FiMail className="h-3.5 w-3.5" /> {user?.email}
              </p>
              {studentProfile?.admissionStatus && (
                <div className="mt-2">
                  <StatusPill status={studentProfile.admissionStatus} />
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={openIdCard} className="btn-secondary">
              <FiCreditCard className="h-4 w-4" /> View ID Card
            </button>
            <button type="button" onClick={() => setEditOpen(true)} className="btn-primary">
              <FiEdit2 className="h-4 w-4" /> Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="card p-6">
        <h3 className="mb-4 text-sm font-semibold text-ink dark:text-ink-light">Personal &amp; Academic Details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {infoRows.map((row) => (
            <div key={row.label}>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-lightMuted">{row.label}</p>
              <p className="mt-1 text-sm font-medium text-ink dark:text-ink-light">{row.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Edit profile modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Profile"
        size="lg"
        footer={
          <>
            <button type="button" onClick={() => setEditOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" form="edit-profile-form" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form id="edit-profile-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label-text">Mobile</label>
            <input
              className="input-field"
              {...register('mobile', { required: 'Mobile number is required' })}
            />
            {errors.mobile && <p className="mt-1 text-xs text-danger">{errors.mobile.message}</p>}
          </div>
          <div>
            <label className="label-text">Parent Mobile</label>
            <input className="input-field" {...register('parentMobile')} />
          </div>
          <div className="sm:col-span-2">
            <label className="label-text">Address</label>
            <input className="input-field" {...register('address')} />
          </div>
          <div>
            <label className="label-text">City</label>
            <input className="input-field" {...register('city')} />
          </div>
          <div>
            <label className="label-text">State</label>
            <input className="input-field" {...register('state')} />
          </div>
          <div>
            <label className="label-text">Pincode</label>
            <input className="input-field" {...register('pincode')} />
          </div>
          <div>
            <label className="label-text">Blood Group</label>
            <input className="input-field" {...register('bloodGroup')} />
          </div>
          <div>
            <label className="label-text">Emergency Contact</label>
            <input className="input-field" {...register('emergencyContact')} />
          </div>
          <div className="sm:col-span-2">
            <label className="label-text">Medical Info</label>
            <textarea rows={3} className="input-field" {...register('medicalInfo')} />
          </div>
        </form>
      </Modal>

      {/* ID card modal */}
      <Modal open={idCardOpen} onClose={() => setIdCardOpen(false)} title="Student ID Card" size="sm">
        {idCardLoading ? (
          <SkeletonCard />
        ) : idCard ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <Avatar name={idCard.name || user?.name} src={idCard.photo} size="lg" />
            <div>
              <p className="font-display text-lg font-bold text-ink dark:text-ink-light">{idCard.name}</p>
              <p className="text-xs text-ink-muted dark:text-ink-lightMuted">
                {idCard.course?.name ? `${idCard.course.name} · ` : ''}Class {idCard.currentClass}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-3">
              <QRCodeSVG value={idCard.qrPayload || JSON.stringify({ studentId: idCard.studentId, admissionNumber: idCard.admissionNumber })} size={160} />
            </div>
            <div className="w-full space-y-1.5 rounded-2xl bg-black/5 p-4 text-left text-sm dark:bg-white/5">
              <p className="flex items-center gap-2 text-ink dark:text-ink-light">
                <FiHash className="h-3.5 w-3.5 text-ink-lightMuted" /> Student ID: <span className="font-semibold">{idCard.studentId}</span>
              </p>
              <p className="flex items-center gap-2 text-ink dark:text-ink-light">
                <FiHash className="h-3.5 w-3.5 text-ink-lightMuted" /> Admission No.: <span className="font-semibold">{idCard.admissionNumber}</span>
              </p>
              {idCard.bloodGroup && (
                <p className="flex items-center gap-2 text-ink dark:text-ink-light">
                  <FiHash className="h-3.5 w-3.5 text-ink-lightMuted" /> Blood Group: <span className="font-semibold">{idCard.bloodGroup}</span>
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-ink-muted dark:text-ink-lightMuted">
            ID card is only available for approved students.
          </p>
        )}
      </Modal>
    </div>
  );
}
