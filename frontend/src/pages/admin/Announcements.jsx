import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiSpeaker } from 'react-icons/fi';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import StatusPill from '../../components/Badge';
import announcementsService from '../../services/announcements.service';
import coursesService from '../../services/courses.service';

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'Everyone' },
  { value: 'class', label: 'Specific Class' },
  { value: 'course', label: 'Specific Course' },
];

const CLASS_OPTIONS = ['10', '11', '12'];

const AUDIENCE_LABEL = AUDIENCE_OPTIONS.reduce((acc, o) => ({ ...acc, [o.value]: o.label }), {});

function toDateTimeInputValue(date) {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);

  const [filters, setFilters] = useState({ search: '', page: 1 });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      body: '',
      audience: 'all',
      targetClass: '',
      targetCourse: '',
      scheduledAt: '',
    },
  });

  const audience = watch('audience');

  const loadCourses = useCallback(async () => {
    try {
      const res = await coursesService.list({ limit: 100 });
      setCourses(res.data?.data || []);
    } catch {
      // Non-blocking — course picker just stays empty.
    }
  }, []);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: filters.page };
      if (filters.search) params.search = filters.search;
      const res = await announcementsService.list(params);
      setAnnouncements(res.data?.data || []);
      setMeta((m) => ({ ...m, ...(res.data?.meta || {}) }));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const courseNameFor = (row) => {
    const course = row.targetCourse;
    if (!course) return null;
    if (typeof course === 'object') return course.name || '—';
    return courses.find((c) => c._id === course)?.name || '—';
  };

  const openCreate = () => {
    setEditing(null);
    reset({ title: '', body: '', audience: 'all', targetClass: '', targetCourse: '', scheduledAt: '' });
    setFormOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    const targetCourseId = typeof row.targetCourse === 'object' ? row.targetCourse?._id : row.targetCourse;
    reset({
      title: row.title || '',
      body: row.body || '',
      audience: row.audience || 'all',
      targetClass: row.targetClass || '',
      targetCourse: targetCourseId || '',
      scheduledAt: toDateTimeInputValue(row.scheduledAt),
    });
    setFormOpen(true);
  };

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      const payload = {
        title: values.title,
        body: values.body,
        audience: values.audience,
        targetClass: values.audience === 'class' ? values.targetClass : null,
        targetCourse: values.audience === 'course' ? values.targetCourse : null,
        scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : undefined,
      };

      if (editing) {
        await announcementsService.update(editing._id, payload);
        toast.success('Announcement updated successfully');
      } else {
        await announcementsService.create(payload);
        toast.success('Announcement created successfully');
      }

      setFormOpen(false);
      setEditing(null);
      loadAnnouncements();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save announcement');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await announcementsService.remove(deleteTarget._id);
      toast.success('Announcement deleted successfully');
      setDeleteTarget(null);
      loadAnnouncements();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete announcement');
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
          <p className="truncate text-xs text-ink-lightMuted">{row.body}</p>
        </div>
      ),
    },
    {
      key: 'audience',
      label: 'Audience',
      render: (row) => {
        const label = AUDIENCE_LABEL[row.audience] || row.audience;
        if (row.audience === 'class' && row.targetClass) return `${label} (Class ${row.targetClass})`;
        if (row.audience === 'course') {
          const name = courseNameFor(row);
          return name ? `${label} (${name})` : label;
        }
        return label;
      },
    },
    {
      key: 'scheduledAt',
      label: 'Scheduled / Created',
      render: (row) => {
        const value = row.scheduledAt || row.createdAt;
        return value ? new Date(value).toLocaleString() : '—';
      },
    },
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
              openEdit(row);
            }}
          >
            <FiEdit2 className="h-4 w-4" />
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

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-300">
            <FiSpeaker className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink dark:text-ink-light">Announcements</h1>
            <p className="text-sm text-ink-muted dark:text-ink-lightMuted">
              Broadcast updates to all students, a specific class, or a specific course.
            </p>
          </div>
        </div>
        <button type="button" className="btn-primary" onClick={openCreate}>
          <FiPlus className="h-4 w-4" /> New Announcement
        </button>
      </div>

      <DataTable
        columns={columns}
        data={announcements}
        loading={loading}
        rowKey="_id"
        page={meta.page}
        pages={meta.pages}
        total={meta.total}
        onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
        onSearchChange={(term) => setFilters((f) => ({ ...f, search: term, page: 1 }))}
        searchPlaceholder="Search announcements..."
        emptyTitle="No announcements yet"
        emptyDescription="Create your first announcement to notify students."
      />

      {/* Create / Edit modal */}
      <Modal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Edit Announcement' : 'New Announcement'}
        size="lg"
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
            <button type="submit" form="announcement-form" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Announcement'}
            </button>
          </>
        }
      >
        <form id="announcement-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label-text">Title</label>
            <input
              className="input-field"
              placeholder="e.g. Diwali Holiday Notice"
              {...register('title', { required: true })}
            />
            {errors.title && <p className="mt-1 text-xs text-danger">Title is required</p>}
          </div>

          <div>
            <label className="label-text">Body</label>
            <textarea
              className="input-field"
              rows={4}
              placeholder="Write the announcement details here..."
              {...register('body', { required: true })}
            />
            {errors.body && <p className="mt-1 text-xs text-danger">Body is required</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-text">Audience</label>
              <select className="input-field" {...register('audience', { required: true })}>
                {AUDIENCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {audience === 'class' && (
              <div>
                <label className="label-text">Class</label>
                <select className="input-field" {...register('targetClass', { required: audience === 'class' })}>
                  <option value="">Select class</option>
                  {CLASS_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      Class {c}
                    </option>
                  ))}
                </select>
                {errors.targetClass && <p className="mt-1 text-xs text-danger">Class is required</p>}
              </div>
            )}

            {audience === 'course' && (
              <div>
                <label className="label-text">Course</label>
                <select className="input-field" {...register('targetCourse', { required: audience === 'course' })}>
                  <option value="">Select course</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.targetCourse && <p className="mt-1 text-xs text-danger">Course is required</p>}
              </div>
            )}
          </div>

          <div>
            <label className="label-text">Schedule For (optional)</label>
            <input type="datetime-local" className="input-field" {...register('scheduledAt')} />
            <p className="mt-1 text-xs text-ink-lightMuted">
              Leave blank to publish immediately. Set a future date/time to schedule it.
            </p>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete announcement?"
        message={`This will permanently remove "${deleteTarget?.title || ''}". This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleting}
      />
    </div>
  );
}
