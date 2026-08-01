import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiChevronLeft, FiChevronRight, FiBookOpen,
} from 'react-icons/fi';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import StatusPill from '../../components/Badge';
import { SkeletonCard } from '../../components/Skeleton';
import useDebounce from '../../hooks/useDebounce';
import coursesService from '../../services/courses.service';

const CLASS_OPTIONS = ['10', '11', '12'];

const selectClass =
  'rounded-full border border-surface-border bg-white px-3 py-2 text-xs font-medium text-ink dark:border-surface-darkBorder dark:bg-surface-dark dark:text-ink-light focus:outline-none focus:ring-2 focus:ring-brand-500/40';

const dangerBtnClass =
  'inline-flex items-center justify-center gap-2 rounded-full bg-danger text-white font-semibold px-6 py-2.5 shadow-soft hover:brightness-110 active:scale-[0.97] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ pages: 1, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [classFilter, setClassFilter] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [detailCourse, setDetailCourse] = useState(null);
  const [addChapterLoading, setAddChapterLoading] = useState(false);

  const {
    register: registerCourse,
    handleSubmit: handleSubmitCourse,
    reset: resetCourse,
    formState: { errors: courseErrors },
  } = useForm({ defaultValues: { name: '', subject: '', classLevel: '10', description: '' } });

  const {
    register: registerChapter,
    handleSubmit: handleSubmitChapter,
    reset: resetChapter,
    formState: { errors: chapterErrors },
  } = useForm({ defaultValues: { title: '', order: '' } });

  const loadCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (classFilter) params.classLevel = classFilter;
      const res = await coursesService.list(params);
      setCourses(res?.data?.data || []);
      setMeta(res?.data?.meta || { pages: 1, total: 0 });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, classFilter]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, classFilter]);

  const openCreate = () => {
    setEditing(null);
    resetCourse({ name: '', subject: '', classLevel: '10', description: '' });
    setFormOpen(true);
  };

  const openEdit = (course) => {
    setEditing(course);
    resetCourse({
      name: course.name || '',
      subject: course.subject || '',
      classLevel: course.classLevel || '10',
      description: course.description || '',
    });
    setFormOpen(true);
  };

  const onSubmitCourse = async (values) => {
    setSaving(true);
    try {
      if (editing) {
        const res = await coursesService.update(editing._id, values);
        toast.success('Course updated successfully');
        const updated = res?.data?.data;
        if (updated) {
          setCourses((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
          if (detailCourse?._id === updated._id) setDetailCourse(updated);
        }
      } else {
        await coursesService.create(values);
        toast.success('Course created successfully');
        loadCourses();
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await coursesService.remove(deleteTarget._id);
      toast.success('Course deleted successfully');
      if (detailCourse?._id === deleteTarget._id) setDetailCourse(null);
      setDeleteTarget(null);
      loadCourses();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete course');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDetail = (course) => {
    setDetailCourse(course);
    resetChapter({ title: '', order: (course.chapters?.length || 0) });
  };

  const onSubmitChapter = async (values) => {
    if (!detailCourse) return;
    setAddChapterLoading(true);
    try {
      const payload = {
        title: values.title.trim(),
        order: values.order === '' || values.order === undefined ? undefined : Number(values.order),
      };
      const res = await coursesService.addChapter(detailCourse._id, payload);
      const updated = res?.data?.data;
      toast.success('Chapter added successfully');
      if (updated) {
        setDetailCourse(updated);
        setCourses((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
      }
      resetChapter({ title: '', order: (updated?.chapters?.length || 0) });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add chapter');
    } finally {
      setAddChapterLoading(false);
    }
  };

  const sortedChapters = useMemo(() => {
    if (!detailCourse?.chapters) return [];
    return [...detailCourse.chapters].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [detailCourse]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink dark:text-ink-light">Courses</h1>
          <p className="mt-1 text-sm text-ink-muted dark:text-ink-lightMuted">
            Manage subjects, class levels and chapters offered at Pinnacle.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={openCreate}>
          <FiPlus className="h-4 w-4" /> New Course
        </button>
      </div>

      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full items-center gap-2 rounded-full border border-surface-border bg-white px-4 py-2 dark:border-surface-darkBorder dark:bg-surface-dark sm:max-w-xs">
          <FiSearch className="h-4 w-4 shrink-0 text-ink-lightMuted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or subject..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink-lightMuted"
          />
        </div>
        <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className={selectClass}>
          <option value="">All Classes</option>
          {CLASS_OPTIONS.map((c) => (
            <option key={c} value={c}>
              Class {c}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && courses.length === 0 && (
        <EmptyState
          icon={FiBookOpen}
          title="No courses found"
          description="Try adjusting your filters, or create a new course to get started."
          action={
            <button type="button" className="btn-primary" onClick={openCreate}>
              <FiPlus className="h-4 w-4" /> New Course
            </button>
          }
        />
      )}

      {!loading && courses.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course._id}
                onClick={() => openDetail(course)}
                className="card flex cursor-pointer flex-col gap-3 p-5 transition-colors hover:border-brand-500/40"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/10 text-lg font-bold text-brand-500">
                    {course.subject?.[0]?.toUpperCase() || 'C'}
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="btn-ghost h-8 w-8" onClick={() => openEdit(course)}>
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="btn-ghost h-8 w-8 text-danger"
                      onClick={() => setDeleteTarget(course)}
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-ink dark:text-ink-light">{course.name}</p>
                  <p className="text-sm text-ink-muted dark:text-ink-lightMuted">
                    {course.subject} · Class {course.classLevel}
                  </p>
                </div>
                {course.description && (
                  <p className="line-clamp-2 text-xs text-ink-lightMuted">{course.description}</p>
                )}
                <div className="mt-auto flex items-center justify-between border-t border-surface-border pt-3 dark:border-surface-darkBorder">
                  <span className="text-xs font-medium text-ink-muted dark:text-ink-lightMuted">
                    {course.chapters?.length || 0} chapter{(course.chapters?.length || 0) === 1 ? '' : 's'}
                  </span>
                  <StatusPill
                    status={course.isActive ? 'approved' : 'suspended'}
                    label={course.isActive ? 'Active' : 'Inactive'}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 px-1">
            <span className="text-xs text-ink-muted dark:text-ink-lightMuted">
              Page {page} of {meta.pages || 1} {meta.total ? `· ${meta.total} total` : ''}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-ghost h-9 w-9 border border-surface-border disabled:opacity-40 dark:border-surface-darkBorder"
              >
                <FiChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={page >= (meta.pages || 1)}
                onClick={() => setPage((p) => p + 1)}
                className="btn-ghost h-9 w-9 border border-surface-border disabled:opacity-40 dark:border-surface-darkBorder"
              >
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create / edit course modal */}
      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Edit Course' : 'New Course'}
        size="md"
        footer={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setFormOpen(false);
                setEditing(null);
              }}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" form="course-form" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Course'}
            </button>
          </>
        }
      >
        <form id="course-form" onSubmit={handleSubmitCourse(onSubmitCourse)} className="space-y-4">
          <div>
            <label className="label-text">Course Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Mathematics"
              {...registerCourse('name', { required: 'Course name is required' })}
            />
            {courseErrors.name && <p className="mt-1 text-xs text-danger">{courseErrors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Subject</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Mathematics"
                {...registerCourse('subject', { required: 'Subject is required' })}
              />
              {courseErrors.subject && <p className="mt-1 text-xs text-danger">{courseErrors.subject.message}</p>}
            </div>
            <div>
              <label className="label-text">Class Level</label>
              <select className="input-field" {...registerCourse('classLevel', { required: true })}>
                {CLASS_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label-text">Description</label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Brief description of this course..."
              {...registerCourse('description')}
            />
          </div>
        </form>
      </Modal>

      {/* Course detail + chapters */}
      <Modal open={!!detailCourse} onClose={() => setDetailCourse(null)} title={detailCourse?.name || 'Course'} size="lg">
        {detailCourse && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-ink-muted dark:text-ink-lightMuted">
                  {detailCourse.subject} · Class {detailCourse.classLevel}
                </p>
                {detailCourse.description && (
                  <p className="mt-1 max-w-md text-sm text-ink dark:text-ink-light">{detailCourse.description}</p>
                )}
              </div>
              <StatusPill
                status={detailCourse.isActive ? 'approved' : 'suspended'}
                label={detailCourse.isActive ? 'Active' : 'Inactive'}
              />
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold text-ink dark:text-ink-light">
                Chapters ({sortedChapters.length})
              </h4>
              {sortedChapters.length === 0 ? (
                <EmptyState
                  icon={FiBookOpen}
                  title="No chapters yet"
                  description="Add the first chapter for this course below."
                />
              ) : (
                <div className="space-y-2">
                  {sortedChapters.map((chapter, i) => (
                    <div
                      key={chapter._id || i}
                      className="flex items-center justify-between rounded-2xl border border-surface-border px-4 py-3 dark:border-surface-darkBorder"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/10 text-xs font-semibold text-brand-500">
                          {chapter.order ?? i}
                        </span>
                        <p className="text-sm font-medium text-ink dark:text-ink-light">{chapter.title}</p>
                      </div>
                      <span className="text-xs text-ink-lightMuted">
                        {chapter.materials?.length || 0} material{(chapter.materials?.length || 0) === 1 ? '' : 's'}
                        {chapter.videos?.length ? ` · ${chapter.videos.length} video(s)` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={handleSubmitChapter(onSubmitChapter)}
              className="flex flex-col gap-3 rounded-2xl bg-black/[0.02] p-4 dark:bg-white/[0.03] sm:flex-row sm:items-end"
            >
              <div className="flex-1">
                <label className="label-text">Chapter Title</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Real Numbers"
                  {...registerChapter('title', { required: 'Chapter title is required' })}
                />
                {chapterErrors.title && <p className="mt-1 text-xs text-danger">{chapterErrors.title.message}</p>}
              </div>
              <div className="w-full sm:w-28">
                <label className="label-text">Order</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="0"
                  {...registerChapter('order')}
                />
              </div>
              <button type="submit" className="btn-primary shrink-0" disabled={addChapterLoading}>
                {addChapterLoading ? 'Adding...' : (
                  <>
                    <FiPlus className="h-4 w-4" /> Add Chapter
                  </>
                )}
              </button>
            </form>

            <div className="flex justify-end gap-2 border-t border-surface-border pt-4 dark:border-surface-darkBorder">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setDetailCourse(null);
                  openEdit(detailCourse);
                }}
              >
                <FiEdit2 className="h-4 w-4" /> Edit Course
              </button>
              <button
                type="button"
                className={dangerBtnClass}
                onClick={() => setDeleteTarget(detailCourse)}
              >
                <FiTrash2 className="h-4 w-4" /> Delete Course
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete course?"
        message={`This permanently removes "${deleteTarget?.name}" and all of its chapters. This cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
