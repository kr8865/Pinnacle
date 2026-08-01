import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit2, FiTrash2, FiSend, FiLock, FiUsers } from 'react-icons/fi';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import StatusPill from '../../components/Badge';
import FileUploadField, { FilePill } from '../../components/FileUploadField';
import assignmentsService from '../../services/assignments.service';
import coursesService from '../../services/courses.service';

const CLASS_OPTIONS = ['10', '11', '12'];
const STATUS_OPTIONS = ['draft', 'published', 'closed'];
const SUBMISSION_STATUS_OPTIONS = ['submitted', 'late', 'checked'];

function toDateTimeInputValue(date) {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);

  const [filters, setFilters] = useState({ course: '', class: '', status: '', search: '', page: 1 });

  // Create / edit modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState([]);
  const [solutionPdf, setSolutionPdf] = useState(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Publish/close in-flight row id
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);

  // Submissions modal
  const [viewingAssignment, setViewingAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState('');

  // Grading modal
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [grading, setGrading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      course: '',
      chapter: '',
      classLevel: '',
      dueDate: '',
      maxMarks: 100,
      instructions: '',
      description: '',
    },
  });

  const {
    register: registerGrade,
    handleSubmit: handleGradeSubmit,
    reset: resetGrade,
    formState: { errors: gradeErrors },
  } = useForm({ defaultValues: { marks: '', feedback: '' } });

  const selectedCourseId = watch('course');
  const selectedCourse = courses.find((c) => c._id === selectedCourseId);

  const loadCourses = useCallback(async () => {
    try {
      const res = await coursesService.list({ limit: 100 });
      setCourses(res.data?.data || []);
    } catch {
      // Non-blocking — filter/picker dropdowns just stay empty.
    }
  }, []);

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: filters.page };
      if (filters.course) params.course = filters.course;
      if (filters.class) params.class = filters.class;
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;

      const res = await assignmentsService.list(params);
      setAssignments(res.data?.data || []);
      setMeta((m) => ({ ...m, ...(res.data?.meta || {}) }));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const courseNameFor = (course) => {
    if (!course) return '—';
    if (typeof course === 'object') return course.name || '—';
    return courses.find((c) => c._id === course)?.name || '—';
  };

  const chapterTitleFor = (row) => {
    if (!row.chapter) return null;
    const courseId = typeof row.course === 'object' ? row.course._id : row.course;
    const course = courses.find((c) => c._id === courseId);
    const chapter = course?.chapters?.find((ch) => ch._id === row.chapter);
    return chapter?.title || null;
  };

  const openCreateModal = () => {
    setEditingAssignment(null);
    reset({
      title: '',
      course: '',
      chapter: '',
      classLevel: '',
      dueDate: '',
      maxMarks: 100,
      instructions: '',
      description: '',
    });
    setFiles([]);
    setSolutionPdf(null);
    setFormOpen(true);
  };

  const openEditModal = (row) => {
    setEditingAssignment(row);
    const courseId = typeof row.course === 'object' ? row.course._id : row.course;
    reset({
      title: row.title || '',
      course: courseId || '',
      chapter: row.chapter || '',
      classLevel: row.classLevel || '',
      dueDate: toDateTimeInputValue(row.dueDate),
      maxMarks: row.maxMarks ?? 100,
      instructions: row.instructions || '',
      description: row.description || '',
    });
    setFiles([]);
    setSolutionPdf(null);
    setFormOpen(true);
  };

  const onSubmitAssignment = async (values) => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', values.title);
      fd.append('course', values.course);
      if (values.chapter) fd.append('chapter', values.chapter);
      fd.append('class', values.classLevel);
      fd.append('dueDate', new Date(values.dueDate).toISOString());
      fd.append('maxMarks', String(values.maxMarks || 100));
      if (values.instructions) fd.append('instructions', values.instructions);
      if (values.description) fd.append('description', values.description);
      files.forEach((f) => fd.append('files', f));
      if (solutionPdf) fd.append('solutionPdf', solutionPdf);

      if (editingAssignment) {
        const res = await assignmentsService.update(editingAssignment._id, fd);
        toast.success(res.data?.message || 'Assignment updated successfully');
      } else {
        const res = await assignmentsService.create(fd);
        toast.success(res.data?.message || 'Assignment created successfully');
      }

      setFormOpen(false);
      loadAssignments();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await assignmentsService.remove(deleteTarget._id);
      toast.success('Assignment deleted');
      setDeleteTarget(null);
      loadAssignments();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete assignment');
    } finally {
      setDeleting(false);
    }
  };

  const handlePublish = async (row) => {
    setStatusUpdatingId(row._id);
    try {
      await assignmentsService.publish(row._id);
      toast.success('Assignment published');
      loadAssignments();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to publish assignment');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleClose = async (row) => {
    setStatusUpdatingId(row._id);
    try {
      await assignmentsService.close(row._id);
      toast.success('Assignment closed');
      loadAssignments();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to close assignment');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const loadSubmissions = useCallback(async (assignmentId, statusFilter) => {
    setSubmissionsLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await assignmentsService.submissions(assignmentId, params);
      setSubmissions(res.data?.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load submissions');
    } finally {
      setSubmissionsLoading(false);
    }
  }, []);

  const openSubmissionsModal = (row) => {
    setViewingAssignment(row);
    setSubmissionStatusFilter('');
    loadSubmissions(row._id, '');
  };

  const closeSubmissionsModal = () => {
    setViewingAssignment(null);
    setSubmissions([]);
  };

  const openGradeModal = (submission) => {
    setGradingSubmission(submission);
    resetGrade({ marks: submission.marks ?? '', feedback: submission.feedback || '' });
  };

  const onSubmitGrade = async (values) => {
    if (!gradingSubmission) return;
    setGrading(true);
    try {
      await assignmentsService.grade(gradingSubmission._id, {
        marks: Number(values.marks),
        feedback: values.feedback,
      });
      toast.success('Submission graded successfully');
      setGradingSubmission(null);
      if (viewingAssignment) loadSubmissions(viewingAssignment._id, submissionStatusFilter);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to grade submission');
    } finally {
      setGrading(false);
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (row) => (
        <div className="min-w-0 max-w-xs">
          <p className="truncate font-semibold text-ink dark:text-ink-light">{row.title}</p>
          {chapterTitleFor(row) && <p className="truncate text-xs text-ink-lightMuted">{chapterTitleFor(row)}</p>}
        </div>
      ),
    },
    { key: 'course', label: 'Course', render: (row) => courseNameFor(row.course) },
    { key: 'classLevel', label: 'Class', render: (row) => `Class ${row.classLevel}` },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (row) => (row.dueDate ? new Date(row.dueDate).toLocaleString() : '—'),
    },
    { key: 'maxMarks', label: 'Max Marks' },
    { key: 'status', label: 'Status', render: (row) => <StatusPill status={row.status} /> },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            className="btn-ghost h-9 w-9"
            title="Edit"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(row);
            }}
          >
            <FiEdit2 className="h-4 w-4" />
          </button>
          {row.status === 'draft' && (
            <button
              type="button"
              className="btn-ghost h-9 w-9 text-success hover:bg-success/10"
              title="Publish"
              disabled={statusUpdatingId === row._id}
              onClick={(e) => {
                e.stopPropagation();
                handlePublish(row);
              }}
            >
              <FiSend className="h-4 w-4" />
            </button>
          )}
          {row.status === 'published' && (
            <button
              type="button"
              className="btn-ghost h-9 w-9 text-warning hover:bg-warning/10"
              title="Close"
              disabled={statusUpdatingId === row._id}
              onClick={(e) => {
                e.stopPropagation();
                handleClose(row);
              }}
            >
              <FiLock className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            className="btn-ghost h-9 w-9"
            title="View submissions"
            onClick={(e) => {
              e.stopPropagation();
              openSubmissionsModal(row);
            }}
          >
            <FiUsers className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="btn-ghost h-9 w-9 text-danger hover:bg-danger/10"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row);
            }}
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const submissionColumns = [
    {
      key: 'student',
      label: 'Student',
      render: (row) => row.student?.user?.name || row.student?.name || 'Unknown student',
    },
    {
      key: 'submittedAt',
      label: 'Submitted',
      render: (row) => (row.submittedAt ? new Date(row.submittedAt).toLocaleString() : '—'),
    },
    { key: 'status', label: 'Status', render: (row) => <StatusPill status={row.status} /> },
    { key: 'marks', label: 'Marks', render: (row) => (row.marks === undefined || row.marks === null ? '—' : row.marks) },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      render: (row) => (
        <button type="button" className="btn-secondary !px-4 !py-1.5 text-xs" onClick={() => openGradeModal(row)}>
          Grade
        </button>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink dark:text-ink-light">Assignments</h1>
          <p className="text-sm text-ink-muted dark:text-ink-lightMuted">
            Create, publish and grade assignments for your students.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={openCreateModal}>
          <FiPlus className="h-4 w-4" /> New Assignment
        </button>
      </div>

      <DataTable
        columns={columns}
        data={assignments}
        loading={loading}
        rowKey="_id"
        page={meta.page}
        pages={meta.pages}
        total={meta.total}
        onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
        onSearchChange={(term) => setFilters((f) => ({ ...f, search: term, page: 1 }))}
        searchPlaceholder="Search assignments..."
        emptyTitle="No assignments yet"
        emptyDescription="Create your first assignment to get started."
        toolbar={
          <>
            <select
              className="input-field !w-auto"
              value={filters.course}
              onChange={(e) => setFilters((f) => ({ ...f, course: e.target.value, page: 1 }))}
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              className="input-field !w-auto"
              value={filters.class}
              onChange={(e) => setFilters((f) => ({ ...f, class: e.target.value, page: 1 }))}
            >
              <option value="">All Classes</option>
              {CLASS_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  Class {c}
                </option>
              ))}
            </select>
            <select
              className="input-field !w-auto"
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </>
        }
      />

      {/* Create / Edit assignment modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingAssignment ? 'Edit Assignment' : 'New Assignment'}
        size="lg"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setFormOpen(false)} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" form="assignment-form" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingAssignment ? 'Save Changes' : 'Create Assignment'}
            </button>
          </>
        }
      >
        <form id="assignment-form" onSubmit={handleSubmit(onSubmitAssignment)} className="space-y-4">
          <div>
            <label className="label-text">Title</label>
            <input
              className="input-field"
              placeholder="e.g. Worksheet on Kinematics"
              {...register('title', { required: true })}
            />
            {errors.title && <p className="mt-1 text-xs text-danger">Title is required</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="label-text">Course</label>
              <select className="input-field" {...register('course', { required: true })}>
                <option value="">Select course</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.course && <p className="mt-1 text-xs text-danger">Course is required</p>}
            </div>
            <div>
              <label className="label-text">Chapter (optional)</label>
              <select className="input-field" disabled={!selectedCourseId} {...register('chapter')}>
                <option value="">No specific chapter</option>
                {(selectedCourse?.chapters || []).map((ch) => (
                  <option key={ch._id} value={ch._id}>
                    {ch.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-text">Class</label>
              <select className="input-field" {...register('classLevel', { required: true })}>
                <option value="">Select class</option>
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </select>
              {errors.classLevel && <p className="mt-1 text-xs text-danger">Class is required</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-text">Due Date</label>
              <input
                type="datetime-local"
                className="input-field"
                {...register('dueDate', { required: true })}
              />
              {errors.dueDate && <p className="mt-1 text-xs text-danger">Due date is required</p>}
            </div>
            <div>
              <label className="label-text">Max Marks</label>
              <input
                type="number"
                min="0"
                className="input-field"
                {...register('maxMarks', { required: true, min: 0 })}
              />
            </div>
          </div>

          <div>
            <label className="label-text">Instructions (optional)</label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Instructions for students..."
              {...register('instructions')}
            />
          </div>

          <div>
            <label className="label-text">Description (optional)</label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="Short internal description..."
              {...register('description')}
            />
          </div>

          {editingAssignment && (editingAssignment.attachments?.length > 0 || editingAssignment.solutionPdf?.url) && (
            <div>
              <label className="label-text">Existing files</label>
              <div className="flex flex-wrap gap-2">
                {(editingAssignment.attachments || []).map((att, i) => (
                  <a key={att.publicId || i} href={att.url} target="_blank" rel="noreferrer">
                    <FilePill name={`Attachment ${i + 1}`} />
                  </a>
                ))}
                {editingAssignment.solutionPdf?.url && (
                  <a href={editingAssignment.solutionPdf.url} target="_blank" rel="noreferrer">
                    <FilePill name="Solution PDF" />
                  </a>
                )}
              </div>
            </div>
          )}

          <FileUploadField
            label="Attachment Files (optional)"
            multiple
            onChange={setFiles}
            hint={editingAssignment ? 'New files will be added to existing attachments' : 'PDF, DOC, image or ZIP files up to 10MB each'}
          />

          <FileUploadField
            label="Solution PDF (optional)"
            accept="application/pdf"
            onChange={setSolutionPdf}
            hint={editingAssignment ? 'Uploading a new solution PDF will replace the existing one' : undefined}
          />
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete assignment?"
        message={`This will permanently remove "${deleteTarget?.title || ''}" and all its submissions.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />

      {/* Submissions modal */}
      <Modal
        open={!!viewingAssignment}
        onClose={closeSubmissionsModal}
        title={viewingAssignment ? `Submissions — ${viewingAssignment.title}` : 'Submissions'}
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <select
              className="input-field !w-auto"
              value={submissionStatusFilter}
              onChange={(e) => {
                setSubmissionStatusFilter(e.target.value);
                if (viewingAssignment) loadSubmissions(viewingAssignment._id, e.target.value);
              }}
            >
              <option value="">All Statuses</option>
              {SUBMISSION_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <DataTable
            columns={submissionColumns}
            data={submissions}
            loading={submissionsLoading}
            rowKey="_id"
            emptyTitle="No submissions yet"
            emptyDescription="Students haven't submitted this assignment yet."
          />
        </div>
      </Modal>

      {/* Grade submission modal */}
      <Modal
        open={!!gradingSubmission}
        onClose={() => setGradingSubmission(null)}
        title="Grade Submission"
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setGradingSubmission(null)} disabled={grading}>
              Cancel
            </button>
            <button type="submit" form="grade-form" className="btn-primary" disabled={grading}>
              {grading ? 'Saving...' : 'Save Grade'}
            </button>
          </>
        }
      >
        <form id="grade-form" onSubmit={handleGradeSubmit(onSubmitGrade)} className="space-y-4">
          <div>
            <label className="label-text">Marks</label>
            <input
              type="number"
              min="0"
              className="input-field"
              {...registerGrade('marks', { required: true, min: 0 })}
            />
            {gradeErrors.marks && <p className="mt-1 text-xs text-danger">Marks are required</p>}
          </div>
          <div>
            <label className="label-text">Feedback (optional)</label>
            <textarea className="input-field" rows={3} placeholder="Feedback for the student..." {...registerGrade('feedback')} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
