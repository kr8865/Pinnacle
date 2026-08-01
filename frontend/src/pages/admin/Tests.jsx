import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiAward, FiClock, FiHash } from 'react-icons/fi';
import testsService from '../../services/tests.service';
import coursesService from '../../services/courses.service';
import api from '../../services/api';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import StatusPill from '../../components/Badge';

function courseLabel(course) {
  if (!course) return '';
  return [course.name, course.subject].filter(Boolean).join(' · ');
}

const emptyQuestion = () => ({ text: '', options: ['', ''], correctOption: 0, marks: 1 });

// The backend test schema always requires `options` (min 2) + `correctOption` even for
// subjective questions (see backend/validators/tests.validator.js). The UI hides those
// fields for subjective tests per design, but we still send harmless placeholder values
// so the create/update request passes validation.
function sanitizeQuestionsForSubmit(questions, type) {
  return questions.map((q) => {
    if (type === 'mcq') {
      return {
        text: q.text,
        options: q.options,
        correctOption: Number(q.correctOption) || 0,
        marks: Number(q.marks) || 1,
      };
    }
    return {
      text: q.text,
      options: q.options && q.options.filter(Boolean).length >= 2 ? q.options : ['N/A', 'N/A'],
      correctOption: 0,
      marks: Number(q.marks) || 1,
    };
  });
}

function TestFormModal({ open, onClose, onSaved, test, courses }) {
  const isEdit = Boolean(test);
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
      type: 'mcq',
      durationMinutes: 30,
      negativeMarkingEnabled: false,
      negativeMarking: 0,
    },
  });

  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [submitting, setSubmitting] = useState(false);
  const [chapters, setChapters] = useState([]);

  const watchType = watch('type');
  const watchCourse = watch('course');
  const watchNegEnabled = watch('negativeMarkingEnabled');

  useEffect(() => {
    if (!open) return;
    if (test) {
      reset({
        title: test.title || '',
        course: test.course?._id || test.course || '',
        chapter: test.chapter || '',
        type: test.type || 'mcq',
        durationMinutes: test.durationMinutes || 30,
        negativeMarkingEnabled: !!test.negativeMarking,
        negativeMarking: test.negativeMarking || 0,
      });
      setQuestions(
        test.questions && test.questions.length
          ? test.questions.map((q) => ({
              text: q.text || '',
              options: q.options && q.options.length ? q.options : ['', ''],
              correctOption: q.correctOption ?? 0,
              marks: q.marks ?? 1,
            }))
          : [emptyQuestion()]
      );
    } else {
      reset({
        title: '',
        course: '',
        chapter: '',
        type: 'mcq',
        durationMinutes: 30,
        negativeMarkingEnabled: false,
        negativeMarking: 0,
      });
      setQuestions([emptyQuestion()]);
    }
  }, [open, test, reset]);

  useEffect(() => {
    if (!watchCourse) {
      setChapters([]);
      return;
    }
    let active = true;
    (async () => {
      try {
        const { data } = await coursesService.get(watchCourse);
        if (active) setChapters(data?.data?.chapters || []);
      } catch {
        if (active) setChapters([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [watchCourse]);

  const updateQuestion = (idx, patch) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  };

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);
  const removeQuestion = (idx) => setQuestions((prev) => prev.filter((_, i) => i !== idx));

  const addOption = (qIdx) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, options: [...q.options, ''] } : q))
    );
  };
  const removeOption = (qIdx, oIdx) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const options = q.options.filter((_, j) => j !== oIdx);
        const correctOption = q.correctOption >= options.length ? 0 : q.correctOption;
        return { ...q, options, correctOption };
      })
    );
  };
  const updateOption = (qIdx, oIdx, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const options = q.options.map((o, j) => (j === oIdx ? value : o));
        return { ...q, options };
      })
    );
  };

  const onSubmit = async (values) => {
    if (!questions.length) {
      toast.error('Add at least one question');
      return;
    }
    for (const q of questions) {
      if (!q.text.trim()) {
        toast.error('Every question needs text');
        return;
      }
      if (values.type === 'mcq') {
        if (q.options.filter((o) => o.trim()).length < 2) {
          toast.error('Every MCQ question needs at least 2 options');
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        title: values.title,
        course: values.course,
        chapter: values.chapter || undefined,
        type: values.type,
        durationMinutes: Number(values.durationMinutes),
        negativeMarking: values.negativeMarkingEnabled ? Number(values.negativeMarking) || 0 : 0,
        questions: sanitizeQuestionsForSubmit(questions, values.type),
      };

      if (isEdit) {
        await api.patch(`/tests/${test._id}`, payload);
        toast.success('Test updated successfully');
      } else {
        await testsService.create(payload);
        toast.success('Test created successfully');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save test');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Test' : 'New Test'}
      size="xl"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleSubmit(onSubmit)} disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Test'}
          </button>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label-text">Title</label>
            <input className="input-field" placeholder="e.g. Chapter 3 — Trigonometry" {...register('title', { required: 'Title is required' })} />
            {errors.title && <p className="mt-1 text-xs text-danger">{errors.title.message}</p>}
          </div>
          <div>
            <label className="label-text">Course</label>
            <select className="input-field" {...register('course', { required: 'Course is required' })}>
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {courseLabel(c)}
                </option>
              ))}
            </select>
            {errors.course && <p className="mt-1 text-xs text-danger">{errors.course.message}</p>}
          </div>
          <div>
            <label className="label-text">Chapter</label>
            <select className="input-field" {...register('chapter')} disabled={!chapters.length}>
              <option value="">{chapters.length ? 'Select chapter (optional)' : 'No chapters for this course'}</option>
              {chapters.map((ch) => (
                <option key={ch._id} value={ch._id}>
                  {ch.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-text">Type</label>
            <select className="input-field" {...register('type')}>
              <option value="mcq">MCQ</option>
              <option value="subjective">Subjective</option>
            </select>
          </div>
          <div>
            <label className="label-text">Duration (minutes)</label>
            <input
              type="number"
              min={1}
              className="input-field"
              {...register('durationMinutes', { required: true, min: 1 })}
            />
          </div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-sm text-ink-muted dark:text-ink-lightMuted">
              <input type="checkbox" className="h-4 w-4 rounded border-surface-border text-brand-500 focus:ring-brand-500" {...register('negativeMarkingEnabled')} />
              Negative marking
            </label>
            {watchNegEnabled && (
              <input
                type="number"
                step="0.01"
                min={0}
                max={1}
                placeholder="e.g. 0.25"
                className="input-field"
                {...register('negativeMarking')}
              />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-ink dark:text-ink-light">Questions</h4>
            <button type="button" className="btn-secondary" onClick={addQuestion}>
              <FiPlus className="h-4 w-4" /> Add question
            </button>
          </div>

          {questions.map((q, qIdx) => (
            <div key={qIdx} className="space-y-3 rounded-2xl border border-surface-border p-4 dark:border-surface-darkBorder">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <label className="label-text">Question {qIdx + 1}</label>
                  <textarea
                    className="input-field min-h-[60px]"
                    value={q.text}
                    onChange={(e) => updateQuestion(qIdx, { text: e.target.value })}
                    placeholder="Enter question text"
                  />
                </div>
                <div className="w-24">
                  <label className="label-text">Marks</label>
                  <input
                    type="number"
                    min={0}
                    className="input-field"
                    value={q.marks}
                    onChange={(e) => updateQuestion(qIdx, { marks: e.target.value })}
                  />
                </div>
                {questions.length > 1 && (
                  <button
                    type="button"
                    className="btn-ghost mt-6 text-danger"
                    onClick={() => removeQuestion(qIdx)}
                    aria-label="Remove question"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {watchType === 'mcq' && (
                <div className="space-y-2">
                  <label className="label-text">Options (select the correct one)</label>
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${qIdx}`}
                        checked={Number(q.correctOption) === oIdx}
                        onChange={() => updateQuestion(qIdx, { correctOption: oIdx })}
                        className="h-4 w-4 text-brand-500 focus:ring-brand-500"
                      />
                      <input
                        type="text"
                        className="input-field"
                        value={opt}
                        placeholder={`Option ${oIdx + 1}`}
                        onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                      />
                      {q.options.length > 2 && (
                        <button type="button" className="btn-ghost text-danger" onClick={() => removeOption(qIdx, oIdx)}>
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="btn-secondary" onClick={() => addOption(qIdx)}>
                    <FiPlus className="h-4 w-4" /> Add option
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </form>
    </Modal>
  );
}

function LeaderboardModal({ open, onClose, test }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !test) return;
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const { data } = await testsService.leaderboard(test._id);
        if (active) setRows(data?.data || []);
      } catch {
        if (active) toast.error('Could not load leaderboard');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, test]);

  const columns = [
    { key: 'rank', label: 'Rank', render: (row) => `#${row.rank ?? '—'}` },
    { key: 'student', label: 'Student' },
    {
      key: 'score',
      label: 'Score',
      render: (row) => `${row.score} / ${row.totalMarks}`,
    },
    {
      key: 'percentage',
      label: 'Percentage',
      render: (row) => `${row.percentage}%`,
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title={`Leaderboard — ${test?.title || ''}`} size="lg">
      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        rowKey={(row) => `${row.rank}-${row.student}`}
        emptyTitle="No submissions yet"
        emptyDescription="Once students submit this test, rankings will appear here."
      />
    </Modal>
  );
}

export default function Tests() {
  const [tests, setTests] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCourse, setFilterCourse] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [leaderboardTest, setLeaderboardTest] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await coursesService.list({ limit: 200 });
        setCourses(data?.data || []);
      } catch {
        toast.error('Could not load courses');
      }
    })();
  }, []);

  const fetchTests = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await testsService.list({ course: filterCourse || undefined, limit: 200 });
      setTests(data?.data || []);
    } catch {
      toast.error('Could not load tests');
    } finally {
      setLoading(false);
    }
  }, [filterCourse]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  const coursesById = useMemo(() => {
    const map = new Map();
    courses.forEach((c) => map.set(c._id, c));
    return map;
  }, [courses]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/tests/${deleteTarget._id}`);
      toast.success('Test deleted');
      setDeleteTarget(null);
      fetchTests();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete test');
    } finally {
      setDeleting(false);
    }
  };

  const handlePublish = async (test) => {
    try {
      await api.patch(`/tests/${test._id}/publish`);
      toast.success('Test published');
      fetchTests();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to publish test');
    }
  };

  const columns = [
    { key: 'title', label: 'Title' },
    {
      key: 'course',
      label: 'Course',
      render: (row) => courseLabel(row.course) || courseLabel(coursesById.get(row.course)) || '—',
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => <StatusPill status={row.type} tone={row.type === 'mcq' ? 'brand' : 'info'} label={row.type === 'mcq' ? 'MCQ' : 'Subjective'} />,
    },
    {
      key: 'durationMinutes',
      label: 'Duration',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5">
          <FiClock className="h-3.5 w-3.5 text-ink-lightMuted" /> {row.durationMinutes} min
        </span>
      ),
    },
    {
      key: 'totalMarks',
      label: 'Marks',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5">
          <FiHash className="h-3.5 w-3.5 text-ink-lightMuted" /> {row.totalMarks ?? '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusPill status={row.status} />,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          {row.status === 'draft' && (
            <button type="button" className="btn-secondary" onClick={() => handlePublish(row)}>
              Publish
            </button>
          )}
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setLeaderboardTest(row)}
            aria-label="Leaderboard"
          >
            <FiAward className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setEditingTest(row);
              setFormOpen(true);
            }}
            aria-label="Edit"
          >
            <FiEdit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="btn-ghost text-danger"
            onClick={() => setDeleteTarget(row)}
            aria-label="Delete"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink dark:text-ink-light">Tests</h1>
          <p className="mt-1 text-sm text-ink-muted dark:text-ink-lightMuted">
            Create tests, manage questions, and review leaderboards.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            setEditingTest(null);
            setFormOpen(true);
          }}
        >
          <FiPlus className="h-4 w-4" /> New Test
        </button>
      </div>

      <DataTable
        columns={columns}
        data={tests}
        loading={loading}
        rowKey="_id"
        toolbar={
          <select className="input-field w-48" value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}>
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {courseLabel(c)}
              </option>
            ))}
          </select>
        }
        emptyTitle="No tests yet"
        emptyDescription="Create your first test to get started."
      />

      <TestFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={fetchTests}
        test={editingTest}
        courses={courses}
      />

      <LeaderboardModal open={Boolean(leaderboardTest)} onClose={() => setLeaderboardTest(null)} test={leaderboardTest} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete test?"
        message={`This will permanently delete "${deleteTarget?.title}" and all of its results.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  );
}
