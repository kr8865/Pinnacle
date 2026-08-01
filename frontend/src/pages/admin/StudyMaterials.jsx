import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { FiPlus, FiTrash2, FiExternalLink } from 'react-icons/fi';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import StatusPill from '../../components/Badge';
import FileUploadField from '../../components/FileUploadField';
import studyMaterialsService from '../../services/studyMaterials.service';
import coursesService from '../../services/courses.service';

const TYPE_OPTIONS = [
  { value: 'notes', label: 'Notes' },
  { value: 'video', label: 'Video' },
  { value: 'pyq', label: 'PYQ' },
  { value: 'worksheet', label: 'Worksheet' },
  { value: 'book', label: 'Book' },
  { value: 'formula-sheet', label: 'Formula Sheet' },
];

const TYPE_TONE = {
  notes: 'brand',
  video: 'info',
  pyq: 'warning',
  worksheet: 'success',
  book: 'neutral',
  'formula-sheet': 'brand',
};

export default function StudyMaterials() {
  const [materials, setMaterials] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);

  const [filters, setFilters] = useState({ course: '', chapter: '', type: '', search: '', page: 1 });

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { title: '', course: '', chapter: '', type: 'notes', description: '', videoUrl: '' },
  });

  const selectedCourseId = watch('course');
  const selectedType = watch('type');
  const selectedCourse = courses.find((c) => c._id === selectedCourseId);

  const loadCourses = useCallback(async () => {
    try {
      const res = await coursesService.list({ limit: 100 });
      setCourses(res.data?.data || []);
    } catch {
      // Non-blocking — filter/picker dropdowns just stay empty.
    }
  }, []);

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: filters.page };
      if (filters.course) params.course = filters.course;
      if (filters.chapter) params.chapter = filters.chapter;
      if (filters.type) params.type = filters.type;
      if (filters.search) params.search = filters.search;

      const res = await studyMaterialsService.list(params);
      setMaterials(res.data?.data || []);
      setMeta((m) => ({ ...m, ...(res.data?.meta || {}) }));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load study materials');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

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

  const openUploadModal = () => {
    reset({ title: '', course: '', chapter: '', type: 'notes', description: '', videoUrl: '' });
    setFile(null);
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    if (values.type !== 'video' && !file) {
      toast.error('Please choose a file to upload');
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', values.title);
      fd.append('course', values.course);
      if (values.chapter) fd.append('chapter', values.chapter);
      fd.append('type', values.type);
      if (values.description) fd.append('description', values.description);
      if (values.type === 'video' && values.videoUrl) fd.append('videoUrl', values.videoUrl);
      if (file) fd.append('file', file);

      const res = await studyMaterialsService.create(fd);
      toast.success(res.data?.message || 'Study material uploaded successfully');
      setModalOpen(false);
      setFilters((f) => ({ ...f, page: 1 }));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to upload study material');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await studyMaterialsService.remove(deleteTarget._id);
      toast.success('Study material deleted');
      setDeleteTarget(null);
      loadMaterials();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete study material');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (row) => (
        <div className="min-w-0 max-w-xs">
          <p className="truncate font-semibold text-ink dark:text-ink-light">{row.title}</p>
          {row.description && (
            <p className="truncate text-xs text-ink-lightMuted">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => <StatusPill status={row.type} tone={TYPE_TONE[row.type] || 'neutral'} />,
    },
    {
      key: 'course',
      label: 'Course / Chapter',
      render: (row) => (
        <div>
          <p className="font-medium text-ink dark:text-ink-light">{courseNameFor(row.course)}</p>
          {chapterTitleFor(row) && <p className="text-xs text-ink-lightMuted">{chapterTitleFor(row)}</p>}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Uploaded',
      render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'),
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          {(row.fileUrl || row.videoUrl) && (
            <a
              href={row.fileUrl || row.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost h-9 w-9"
              title="Open file"
              onClick={(e) => e.stopPropagation()}
            >
              <FiExternalLink className="h-4 w-4" />
            </a>
          )}
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

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink dark:text-ink-light">Study Material</h1>
          <p className="text-sm text-ink-muted dark:text-ink-lightMuted">
            Upload notes, videos, PYQs, worksheets, books and formula sheets for your students.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={openUploadModal}>
          <FiPlus className="h-4 w-4" /> Upload Material
        </button>
      </div>

      <DataTable
        columns={columns}
        data={materials}
        loading={loading}
        rowKey="_id"
        page={meta.page}
        pages={meta.pages}
        total={meta.total}
        onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
        onSearchChange={(term) => setFilters((f) => ({ ...f, search: term, page: 1 }))}
        searchPlaceholder="Search materials..."
        emptyTitle="No study material yet"
        emptyDescription="Upload notes, videos or worksheets to get started."
        toolbar={
          <>
            <select
              className="input-field !w-auto"
              value={filters.course}
              onChange={(e) => setFilters((f) => ({ ...f, course: e.target.value, chapter: '', page: 1 }))}
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
              value={filters.chapter}
              disabled={!filters.course}
              onChange={(e) => setFilters((f) => ({ ...f, chapter: e.target.value, page: 1 }))}
            >
              <option value="">All Chapters</option>
              {(courses.find((c) => c._id === filters.course)?.chapters || []).map((ch) => (
                <option key={ch._id} value={ch._id}>
                  {ch.title}
                </option>
              ))}
            </select>
            <select
              className="input-field !w-auto"
              value={filters.type}
              onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value, page: 1 }))}
            >
              <option value="">All Types</option>
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </>
        }
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Upload Study Material"
        size="lg"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" form="upload-material-form" className="btn-primary" disabled={submitting}>
              {submitting ? 'Uploading...' : 'Upload'}
            </button>
          </>
        }
      >
        <form id="upload-material-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label-text">Title</label>
            <input
              className="input-field"
              placeholder="e.g. Chapter 3 — Motion Notes"
              {...register('title', { required: true })}
            />
            {errors.title && <p className="mt-1 text-xs text-danger">Title is required</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-text">Course</label>
              <select className="input-field" {...register('course', { required: true })}>
                <option value="">Select course</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} (Class {c.classLevel})
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
          </div>

          <div>
            <label className="label-text">Type</label>
            <select className="input-field" {...register('type', { required: true })}>
              {TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {selectedType === 'video' && (
            <div>
              <label className="label-text">Video URL (optional if uploading a video file)</label>
              <input className="input-field" placeholder="https://..." {...register('videoUrl')} />
            </div>
          )}

          <FileUploadField
            label={selectedType === 'video' ? 'Video File (optional)' : 'File'}
            required={selectedType !== 'video'}
            onChange={setFile}
            hint="PDF, DOC/DOCX, image or video files up to 10MB"
          />

          <div>
            <label className="label-text">Description (optional)</label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Short description of this material..."
              {...register('description')}
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete study material?"
        message={`This will permanently remove "${deleteTarget?.title || ''}" and any student bookmarks referencing it.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  );
}
