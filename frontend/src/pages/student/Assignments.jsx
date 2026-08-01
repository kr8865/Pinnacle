import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  FiEdit3, FiClock, FiCheckCircle, FiAward, FiPaperclip, FiDownload, FiUploadCloud,
} from 'react-icons/fi';
import assignmentsService from '../../services/assignments.service';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import StatusPill from '../../components/Badge';
import FileUploadField, { FilePill } from '../../components/FileUploadField';
import { SkeletonCard } from '../../components/Skeleton';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'checked', label: 'Graded' },
];

function deriveStatus(assignment) {
  const submission = assignment.mySubmission;
  if (!submission) return 'pending';
  if (submission.status === 'checked') return 'checked';
  if (submission.status === 'late') return 'late';
  if (submission.status === 'submitted') return 'submitted';
  return 'pending';
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selected, setSelected] = useState(null);
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { remarks: '' } });

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, mySubsRes] = await Promise.all([
        assignmentsService.list(),
        assignmentsService.mySubmissions().catch(() => null),
      ]);

      const list = listRes.data?.data || [];
      const mySubmissions = mySubsRes?.data?.data || [];
      const submissionByAssignmentId = new Map(
        mySubmissions.map((s) => [
          (typeof s.assignment === 'object' ? s.assignment?._id : s.assignment) || '',
          s,
        ])
      );

      const merged = list.map((a) => ({
        ...a,
        mySubmission: a.mySubmission || submissionByAssignmentId.get(a._id) || null,
      }));

      setAssignments(merged);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not load assignments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return assignments;
    if (activeTab === 'submitted') {
      return assignments.filter((a) => ['submitted', 'late'].includes(deriveStatus(a)));
    }
    return assignments.filter((a) => deriveStatus(a) === activeTab);
  }, [assignments, activeTab]);

  const openAssignment = (assignment) => {
    setSelected(assignment);
    setFiles([]);
    reset({ remarks: assignment.mySubmission?.remarks || '' });
  };

  const closeModal = () => {
    setSelected(null);
    setFiles([]);
  };

  const onSubmitAssignment = async (formValues) => {
    if (!selected) return;
    if (!files.length && !selected.mySubmission) {
      toast.error('Please attach at least one file');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      formData.append('remarks', formValues.remarks || '');
      await assignmentsService.submit(selected._id, formData);
      toast.success('Assignment submitted successfully');
      closeModal();
      loadAssignments();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const submission = selected?.mySubmission;
  const canSubmit = selected?.status === 'published' && submission?.status !== 'checked';

  return (
    <div className="mx-auto max-w-6xl py-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink dark:text-ink-light">
          Assignments
        </h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-ink-lightMuted">
          Track your pending, submitted and graded assignments.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? 'bg-brand-gradient text-white'
                : 'bg-black/5 text-ink-muted hover:bg-black/10 dark:bg-white/5 dark:text-ink-lightMuted dark:hover:bg-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={FiEdit3}
          title="No assignments found"
          description="There are no assignments matching this filter right now."
        />
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((assignment) => {
            const status = deriveStatus(assignment);
            return (
              <button
                key={assignment._id}
                type="button"
                onClick={() => openAssignment(assignment)}
                className="card flex flex-col gap-3 p-5 text-left transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
                    <FiEdit3 className="h-5 w-5" />
                  </div>
                  <StatusPill status={status} />
                </div>
                <div>
                  <h3 className="font-semibold text-ink dark:text-ink-light line-clamp-2">{assignment.title}</h3>
                  <p className="mt-0.5 text-xs text-ink-muted dark:text-ink-lightMuted">
                    {assignment.course?.name || 'Course'} {assignment.course?.subject ? `· ${assignment.course.subject}` : ''}
                  </p>
                </div>
                <div className="mt-auto flex items-center justify-between text-xs text-ink-muted dark:text-ink-lightMuted">
                  <span className="inline-flex items-center gap-1">
                    <FiClock className="h-3.5 w-3.5" /> Due {formatDate(assignment.dueDate)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FiAward className="h-3.5 w-3.5" /> {assignment.maxMarks} marks
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Modal
        open={!!selected}
        onClose={closeModal}
        title={selected?.title}
        size="lg"
        footer={
          canSubmit ? (
            <>
              <button type="button" className="btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button
                type="submit"
                form="assignment-submit-form"
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? 'Submitting...' : submission ? 'Resubmit' : 'Submit Assignment'}
              </button>
            </>
          ) : (
            <button type="button" className="btn-secondary" onClick={closeModal}>
              Close
            </button>
          )
        }
      >
        {selected && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted dark:text-ink-lightMuted">
              <StatusPill status={selected.status} />
              <span className="inline-flex items-center gap-1">
                <FiClock className="h-3.5 w-3.5" /> Due {formatDate(selected.dueDate)}
              </span>
              <span className="inline-flex items-center gap-1">
                <FiAward className="h-3.5 w-3.5" /> {selected.maxMarks} marks
              </span>
            </div>

            {(selected.description || selected.instructions) && (
              <div>
                <h4 className="label-text">Instructions</h4>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink dark:text-ink-light">
                  {selected.instructions || selected.description}
                </p>
              </div>
            )}

            {selected.attachments?.length > 0 && (
              <div>
                <h4 className="label-text">Attachments</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selected.attachments.map((file, i) => (
                    <a
                      key={file.publicId || i}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-600 hover:bg-brand-500/20 dark:text-brand-300"
                    >
                      <FiPaperclip className="h-3 w-3" /> Attachment {i + 1} <FiDownload className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {selected.solutionPdf?.url && (
              <div>
                <h4 className="label-text">Solution</h4>
                <a
                  href={selected.solutionPdf.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-ink dark:bg-white/5 dark:text-ink-light"
                >
                  <FiDownload className="h-3 w-3" /> Download solution
                </a>
              </div>
            )}

            {submission && (
              <div className="rounded-2xl border border-surface-border p-4 dark:border-surface-darkBorder">
                <div className="flex items-center justify-between">
                  <h4 className="label-text">Your Submission</h4>
                  <StatusPill status={submission.status} />
                </div>
                <p className="mt-2 text-xs text-ink-muted dark:text-ink-lightMuted">
                  Submitted {formatDate(submission.submittedAt)}
                </p>
                {submission.remarks && (
                  <p className="mt-2 text-sm text-ink dark:text-ink-light">{submission.remarks}</p>
                )}
                {submission.files?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {submission.files.map((file, i) => (
                      <a key={file.publicId || i} href={file.url} target="_blank" rel="noreferrer">
                        <FilePill name={`File ${i + 1}`} />
                      </a>
                    ))}
                  </div>
                )}
                {submission.status === 'checked' && (
                  <div className="mt-4 flex items-center gap-3 rounded-2xl bg-brand-500/5 p-3">
                    <FiCheckCircle className="h-5 w-5 shrink-0 text-brand-600 dark:text-brand-300" />
                    <div>
                      <p className="text-sm font-semibold text-ink dark:text-ink-light">
                        Marks: {submission.marks ?? '—'} / {selected.maxMarks}
                      </p>
                      {submission.feedback && (
                        <p className="mt-0.5 text-xs text-ink-muted dark:text-ink-lightMuted">
                          {submission.feedback}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {canSubmit && (
              <form id="assignment-submit-form" onSubmit={handleSubmit(onSubmitAssignment)} className="space-y-4">
                <FileUploadField
                  label={submission ? 'Replace files' : 'Upload files'}
                  multiple
                  onChange={(selectedFiles) => setFiles(selectedFiles || [])}
                  hint="You can attach multiple files (images, PDFs, docs)."
                />
                <div>
                  <label className="label-text">Remarks (optional)</label>
                  <textarea
                    rows={3}
                    className="input-field"
                    placeholder="Add any notes for your teacher..."
                    {...register('remarks')}
                  />
                  {errors.remarks && <p className="mt-1 text-xs text-danger">{errors.remarks.message}</p>}
                </div>
                <p className="flex items-center gap-1.5 text-xs text-ink-lightMuted">
                  <FiUploadCloud className="h-3.5 w-3.5" /> Submitting after the due date will be marked as late.
                </p>
              </form>
            )}

            {!canSubmit && selected.status !== 'published' && !submission && (
              <p className="text-sm text-ink-muted dark:text-ink-lightMuted">
                This assignment is not currently open for submissions.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
