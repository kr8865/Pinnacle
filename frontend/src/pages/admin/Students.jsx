import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import {
  FiUpload, FiDownload, FiCheck, FiX, FiSlash, FiTrash2, FiEye,
} from 'react-icons/fi';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import StatusPill from '../../components/Badge';
import Avatar from '../../components/Avatar';
import FileUploadField from '../../components/FileUploadField';
import { SkeletonText } from '../../components/Skeleton';
import studentsService from '../../services/students.service';
import coursesService from '../../services/courses.service';

const STATUS_OPTIONS = ['pending', 'approved', 'rejected', 'suspended'];
const CLASS_OPTIONS = ['10', '11', '12'];

const dangerBtnClass =
  'inline-flex items-center justify-center gap-2 rounded-full bg-danger text-white font-semibold px-6 py-2.5 shadow-soft hover:brightness-110 active:scale-[0.97] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

const selectClass =
  'rounded-full border border-surface-border bg-white px-3 py-2 text-xs font-medium text-ink dark:border-surface-darkBorder dark:bg-surface-dark dark:text-ink-light focus:outline-none focus:ring-2 focus:ring-brand-500/40';

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function DetailField({ label, value }) {
  const display = value === null || value === undefined || value === '' ? '—' : value;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-lightMuted">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-ink dark:text-ink-light">{display}</p>
    </div>
  );
}

function formatDate(d) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return null;
  }
}

export default function Students() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [courses, setCourses] = useState([]);

  const [selectedIds, setSelectedIds] = useState([]);

  const [detail, setDetail] = useState(null);
  const [detailTab, setDetailTab] = useState('profile');
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [idCard, setIdCard] = useState(null);
  const [idCardLoading, setIdCardLoading] = useState(false);

  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadCourses = useCallback(async () => {
    try {
      const res = await coursesService.list({ limit: 100 });
      setCourses(res?.data?.data || []);
    } catch {
      // filter dropdown is non-critical; ignore failures silently
    }
  }, []);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (status) params.status = status;
      if (classLevel) params.class = classLevel;
      if (courseFilter) params.course = courseFilter;
      const res = await studentsService.list(params);
      setRows(res?.data?.data || []);
      setMeta(res?.data?.meta || { pages: 1, total: 0 });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, classLevel, courseFilter]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    setPage(1);
  }, [search, status, classLevel, courseFilter]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const openDetail = (student) => {
    setDetail(student);
    setDetailTab('profile');
    setDocuments([]);
    setIdCard(null);
  };

  useEffect(() => {
    if (!detail || detailTab !== 'documents' || documents.length > 0) return;
    (async () => {
      setDocsLoading(true);
      try {
        const res = await studentsService.documents(detail._id);
        setDocuments(res?.data?.data || []);
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to load documents');
      } finally {
        setDocsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail, detailTab]);

  useEffect(() => {
    if (!detail || detailTab !== 'id-card' || idCard) return;
    (async () => {
      setIdCardLoading(true);
      try {
        const res = await studentsService.idCard(detail._id);
        setIdCard(res?.data?.data || null);
      } catch (err) {
        toast.error(err?.response?.data?.message || 'Failed to load ID card');
      } finally {
        setIdCardLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail, detailTab]);

  const handleApprove = async (student) => {
    try {
      const res = await studentsService.approve(student._id);
      toast.success('Student approved');
      const updated = res?.data?.data;
      if (updated && detail?._id === student._id) setDetail(updated);
      loadStudents();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to approve student');
    }
  };

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setRejectLoading(true);
    try {
      await studentsService.reject(rejectTarget._id, rejectReason.trim());
      toast.success('Admission rejected');
      setRejectTarget(null);
      setRejectReason('');
      setDetail(null);
      loadStudents();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reject student');
    } finally {
      setRejectLoading(false);
    }
  };

  const confirmMeta = useMemo(() => {
    if (!confirmAction) return {};
    if (confirmAction.type === 'suspend') {
      return {
        title: 'Suspend student?',
        message: `${confirmAction.student.user?.name || 'This student'} will immediately lose portal access.`,
        confirmLabel: 'Suspend',
        danger: false,
      };
    }
    if (confirmAction.type === 'delete') {
      return {
        title: 'Delete student?',
        message: `This permanently removes ${confirmAction.student.user?.name || 'this student'} and their account. This cannot be undone.`,
        confirmLabel: 'Delete',
        danger: true,
      };
    }
    if (confirmAction.type === 'bulk-delete') {
      return {
        title: 'Delete selected students?',
        message: `This permanently removes ${selectedIds.length} student(s) and their accounts. This cannot be undone.`,
        confirmLabel: 'Delete All',
        danger: true,
      };
    }
    return {};
  }, [confirmAction, selectedIds.length]);

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction.type === 'suspend') {
        const res = await studentsService.suspend(confirmAction.student._id);
        toast.success('Student suspended');
        const updated = res?.data?.data;
        if (updated && detail?._id === confirmAction.student._id) setDetail(updated);
      } else if (confirmAction.type === 'delete') {
        await studentsService.remove(confirmAction.student._id);
        toast.success('Student deleted');
        setDetail(null);
      } else if (confirmAction.type === 'bulk-delete') {
        await studentsService.bulkDelete(selectedIds);
        toast.success('Selected students deleted');
        setSelectedIds([]);
      }
      loadStudents();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setBulkLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', bulkFile);
      const res = await studentsService.bulkUpload(formData);
      const result = res?.data?.data;
      toast.success(
        `Created ${result?.created ?? 0} student(s)${result?.failed ? `, ${result.failed} row(s) failed` : ''}`
      );
      setBulkUploadOpen(false);
      setBulkFile(null);
      loadStudents();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Bulk upload failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExport = async (type) => {
    setExporting(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      if (classLevel) params.class = classLevel;
      if (courseFilter) params.course = courseFilter;
      const res = type === 'excel' ? await studentsService.exportExcel(params) : await studentsService.exportPdf(params);
      downloadBlob(res.data, `students-export.${type === 'excel' ? 'xlsx' : 'pdf'}`);
      toast.success('Export downloaded');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    {
      key: 'select',
      label: '',
      className: 'w-8',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row._id)}
          onChange={() => toggleSelect(row._id)}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-surface-border text-brand-500 focus:ring-brand-500 dark:border-surface-darkBorder"
        />
      ),
    },
    {
      key: 'name',
      label: 'Student',
      render: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={row.user?.name} src={row.user?.avatar?.url} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink dark:text-ink-light">{row.user?.name || '—'}</p>
            <p className="truncate text-xs text-ink-muted dark:text-ink-lightMuted">{row.user?.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'studentId',
      label: 'ID',
      render: (row) => (
        <div className="text-xs">
          <p className="font-medium text-ink dark:text-ink-light">{row.studentId || '—'}</p>
          <p className="text-ink-lightMuted">{row.registrationNumber || ''}</p>
        </div>
      ),
    },
    { key: 'currentClass', label: 'Class', render: (row) => `Class ${row.currentClass}` },
    { key: 'course', label: 'Course', render: (row) => row.course?.name || '—' },
    {
      key: 'admissionStatus',
      label: 'Status',
      render: (row) => <StatusPill status={row.admissionStatus} />,
    },
    { key: 'mobile', label: 'Mobile' },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button type="button" title="View" className="btn-ghost h-8 w-8" onClick={() => openDetail(row)}>
            <FiEye className="h-4 w-4" />
          </button>
          {row.admissionStatus === 'pending' && (
            <button
              type="button"
              title="Approve"
              className="btn-ghost h-8 w-8 text-success"
              onClick={() => handleApprove(row)}
            >
              <FiCheck className="h-4 w-4" />
            </button>
          )}
          {row.admissionStatus === 'pending' && (
            <button
              type="button"
              title="Reject"
              className="btn-ghost h-8 w-8 text-danger"
              onClick={() => setRejectTarget(row)}
            >
              <FiX className="h-4 w-4" />
            </button>
          )}
          {row.admissionStatus !== 'suspended' && (
            <button
              type="button"
              title="Suspend"
              className="btn-ghost h-8 w-8 text-warning"
              onClick={() => setConfirmAction({ type: 'suspend', student: row })}
            >
              <FiSlash className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            title="Delete"
            className="btn-ghost h-8 w-8 text-danger"
            onClick={() => setConfirmAction({ type: 'delete', student: row })}
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const toolbar = (
    <>
      <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
        <option value="">All Status</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s[0].toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
      <select value={classLevel} onChange={(e) => setClassLevel(e.target.value)} className={selectClass}>
        <option value="">All Classes</option>
        {CLASS_OPTIONS.map((c) => (
          <option key={c} value={c}>
            Class {c}
          </option>
        ))}
      </select>
      <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className={selectClass}>
        <option value="">All Courses</option>
        {courses.map((c) => (
          <option key={c._id} value={c._id}>
            {c.name}
          </option>
        ))}
      </select>
      {selectedIds.length > 0 && (
        <button
          type="button"
          className="btn-secondary py-2 text-xs"
          onClick={() => setConfirmAction({ type: 'bulk-delete' })}
        >
          <FiTrash2 className="h-3.5 w-3.5" /> Delete Selected ({selectedIds.length})
        </button>
      )}
      <button type="button" className="btn-secondary py-2 text-xs" onClick={() => setBulkUploadOpen(true)}>
        <FiUpload className="h-3.5 w-3.5" /> Bulk Upload
      </button>
      <button
        type="button"
        disabled={exporting}
        className="btn-secondary py-2 text-xs"
        onClick={() => handleExport('excel')}
      >
        <FiDownload className="h-3.5 w-3.5" /> Excel
      </button>
      <button
        type="button"
        disabled={exporting}
        className="btn-secondary py-2 text-xs"
        onClick={() => handleExport('pdf')}
      >
        <FiDownload className="h-3.5 w-3.5" /> PDF
      </button>
    </>
  );

  const tabs = useMemo(() => {
    const t = [
      { key: 'profile', label: 'Profile' },
      { key: 'documents', label: 'Documents' },
    ];
    if (detail?.admissionStatus === 'approved') t.push({ key: 'id-card', label: 'ID Card' });
    return t;
  }, [detail]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink dark:text-ink-light">Students &amp; Admissions</h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-ink-lightMuted">
          Manage admissions, approvals and student records.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        rowKey="_id"
        page={page}
        pages={meta.pages}
        total={meta.total}
        onPageChange={setPage}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, student ID, registration no..."
        toolbar={toolbar}
        onRowClick={openDetail}
        emptyTitle="No students found"
        emptyDescription="Try adjusting your filters or bulk-upload a CSV to get started."
      />

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.user?.name || 'Student'} size="xl">
        {detail && (
          <div>
            <div className="mb-5 flex items-center gap-2 border-b border-surface-border pb-3 dark:border-surface-darkBorder">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setDetailTab(tab.key)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    detailTab === tab.key
                      ? 'bg-brand-gradient text-white'
                      : 'text-ink-muted hover:bg-black/5 dark:text-ink-lightMuted dark:hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {detailTab === 'profile' && (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <Avatar name={detail.user?.name} src={detail.user?.avatar?.url} size="lg" />
                  <div>
                    <p className="text-lg font-bold text-ink dark:text-ink-light">{detail.user?.name}</p>
                    <p className="text-sm text-ink-muted dark:text-ink-lightMuted">{detail.user?.email}</p>
                    <div className="mt-1">
                      <StatusPill status={detail.admissionStatus} />
                    </div>
                  </div>
                </div>

                {detail.admissionStatus === 'rejected' && detail.rejectionReason && (
                  <div className="rounded-2xl bg-danger/5 p-4 text-sm text-danger">
                    <span className="font-semibold">Rejection reason: </span>
                    {detail.rejectionReason}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <DetailField label="Student ID" value={detail.studentId} />
                  <DetailField label="Registration No" value={detail.registrationNumber} />
                  <DetailField label="Admission No" value={detail.admissionNumber} />
                  <DetailField label="Father's Name" value={detail.fatherName} />
                  <DetailField label="Mother's Name" value={detail.motherName} />
                  <DetailField label="Gender" value={detail.gender} />
                  <DetailField label="Date of Birth" value={formatDate(detail.dob)} />
                  <DetailField label="Mobile" value={detail.mobile} />
                  <DetailField label="Parent Mobile" value={detail.parentMobile} />
                  <DetailField label="Emergency Contact" value={detail.emergencyContact} />
                  <DetailField label="Address" value={detail.address} />
                  <DetailField label="City" value={detail.city} />
                  <DetailField label="State" value={detail.state} />
                  <DetailField label="Pincode" value={detail.pincode} />
                  <DetailField label="School" value={detail.schoolName} />
                  <DetailField label="Previous School" value={detail.previousSchool} />
                  <DetailField label="Board" value={detail.board} />
                  <DetailField label="Class" value={detail.currentClass ? `Class ${detail.currentClass}` : null} />
                  <DetailField label="Course" value={detail.course?.name} />
                  <DetailField label="10th %" value={detail.tenthPercentage} />
                  <DetailField label="12th %" value={detail.twelfthPercentage} />
                  <DetailField label="Aadhar Number" value={detail.aadharNumber} />
                  <DetailField label="Blood Group" value={detail.bloodGroup} />
                  <DetailField label="Medical Info" value={detail.medicalInfo} />
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-surface-border pt-4 dark:border-surface-darkBorder">
                  {detail.admissionStatus === 'pending' && (
                    <>
                      <button type="button" className="btn-primary" onClick={() => handleApprove(detail)}>
                        <FiCheck className="h-4 w-4" /> Approve
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => setRejectTarget(detail)}>
                        <FiX className="h-4 w-4" /> Reject
                      </button>
                    </>
                  )}
                  {detail.admissionStatus !== 'suspended' && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setConfirmAction({ type: 'suspend', student: detail })}
                    >
                      <FiSlash className="h-4 w-4" /> Suspend
                    </button>
                  )}
                  <button
                    type="button"
                    className={dangerBtnClass}
                    onClick={() => setConfirmAction({ type: 'delete', student: detail })}
                  >
                    <FiTrash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </div>
            )}

            {detailTab === 'documents' && (
              <div>
                {docsLoading && <SkeletonText lines={4} />}
                {!docsLoading && documents.length === 0 && (
                  <EmptyState title="No documents uploaded" description="This student has not uploaded any documents yet." />
                )}
                {!docsLoading && documents.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {documents.map((doc) => (
                      <a
                        key={doc._id}
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="card flex flex-col items-center gap-2 p-4 text-center hover:border-brand-500/40"
                      >
                        {doc.type === 'photo' || doc.type === 'parentPhoto' ? (
                          <img src={doc.url} alt={doc.type} className="h-20 w-20 rounded-2xl object-cover" />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
                            <FiEye className="h-6 w-6" />
                          </div>
                        )}
                        <p className="text-xs font-medium capitalize text-ink dark:text-ink-light">{doc.type}</p>
                        {doc.verified && <StatusPill status="approved" label="Verified" />}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {detailTab === 'id-card' && (
              <div>
                {idCardLoading && <SkeletonText lines={4} />}
                {!idCardLoading && idCard && (
                  <div className="flex flex-col items-center gap-4 rounded-3xl bg-brand-500/5 p-6">
                    <div className="rounded-2xl bg-white p-3 shadow-soft">
                      <QRCodeSVG
                        value={
                          idCard.qrPayload ||
                          JSON.stringify({ studentId: idCard.studentId, admissionNumber: idCard.admissionNumber })
                        }
                        size={140}
                      />
                    </div>
                    <div className="text-center">
                      <p className="font-display text-lg font-bold text-ink dark:text-ink-light">{idCard.name}</p>
                      <p className="text-sm text-ink-muted dark:text-ink-lightMuted">
                        {idCard.course?.name} · Class {idCard.currentClass}
                      </p>
                    </div>
                    <div className="grid w-full grid-cols-2 gap-3">
                      <DetailField label="Student ID" value={idCard.studentId} />
                      <DetailField label="Admission No" value={idCard.admissionNumber} />
                      <DetailField label="Registration No" value={idCard.registrationNumber} />
                      <DetailField label="Blood Group" value={idCard.bloodGroup} />
                    </div>
                  </div>
                )}
                {!idCardLoading && !idCard && (
                  <EmptyState title="ID card unavailable" description="Could not generate the ID card for this student." />
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reject reason modal */}
      <Modal
        open={!!rejectTarget}
        onClose={() => {
          setRejectTarget(null);
          setRejectReason('');
        }}
        title="Reject Admission"
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setRejectTarget(null);
                setRejectReason('');
              }}
              disabled={rejectLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className={dangerBtnClass}
              disabled={!rejectReason.trim() || rejectLoading}
              onClick={handleReject}
            >
              {rejectLoading ? 'Rejecting...' : 'Reject'}
            </button>
          </>
        }
      >
        <label className="label-text">Reason for rejection</label>
        <textarea
          className="input-field"
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Enter reason for rejecting this admission..."
        />
      </Modal>

      {/* Bulk upload modal */}
      <Modal
        open={bulkUploadOpen}
        onClose={() => {
          setBulkUploadOpen(false);
          setBulkFile(null);
        }}
        title="Bulk Upload Students"
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setBulkUploadOpen(false);
                setBulkFile(null);
              }}
              disabled={bulkLoading}
            >
              Cancel
            </button>
            <button type="button" className="btn-primary" disabled={!bulkFile || bulkLoading} onClick={handleBulkUpload}>
              {bulkLoading ? 'Uploading...' : 'Upload'}
            </button>
          </>
        }
      >
        <p className="mb-3 text-sm text-ink-muted dark:text-ink-lightMuted">
          Upload a CSV with columns: studentName, email, fatherName, mobile, currentClass, course, city, etc. Rows
          are created with a <span className="font-semibold">pending</span> admission status.
        </p>
        <FileUploadField label="CSV File" accept=".csv" onChange={setBulkFile} hint="Max 10MB, .csv only" />
      </Modal>

      {/* Suspend / delete / bulk-delete confirmation */}
      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        loading={actionLoading}
        title={confirmMeta.title}
        message={confirmMeta.message}
        confirmLabel={confirmMeta.confirmLabel}
        danger={confirmMeta.danger}
      />
    </div>
  );
}
