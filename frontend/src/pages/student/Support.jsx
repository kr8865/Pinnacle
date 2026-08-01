import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiPlus } from 'react-icons/fi';
import supportTicketsService from '../../services/supportTickets.service';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import StatusPill from '../../components/Badge';

const CATEGORY_OPTIONS = [
  { value: 'technical', label: 'Technical' },
  { value: 'fee', label: 'Fee' },
  { value: 'academic', label: 'Academic' },
  { value: 'other', label: 'Other' },
];

function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [viewTicket, setViewTicket] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { subject: '', category: 'other', description: '' } });

  const fetchTickets = useCallback(async (targetPage = 1) => {
    try {
      setLoading(true);
      const res = await supportTicketsService.list({ page: targetPage, limit: 10 });
      setTickets(res?.data?.data || []);
      setPage(res?.data?.meta?.page || targetPage);
      setPages(res?.data?.meta?.pages || 1);
      setTotal(res?.data?.meta?.total || 0);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets(1);
  }, [fetchTickets]);

  const onCreate = async (values) => {
    setSubmitting(true);
    try {
      await supportTicketsService.create(values);
      toast.success('Support ticket submitted successfully');
      reset();
      setCreateOpen(false);
      fetchTickets(1);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'subject', label: 'Subject', render: (row) => <span className="font-medium">{row.subject}</span> },
    { key: 'category', label: 'Category', render: (row) => <span className="capitalize">{row.category}</span> },
    { key: 'status', label: 'Status', render: (row) => <StatusPill status={row.status} /> },
    { key: 'createdAt', label: 'Raised On', render: (row) => formatDateTime(row.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl px-1 pb-2 pt-6 sm:px-2">
        <div className="pointer-events-none absolute -top-16 left-10 h-64 w-64 rounded-full bg-warm-glow opacity-40 blur-3xl" />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink dark:text-ink-light sm:text-3xl">
              Support
            </h1>
            <p className="mt-1.5 text-sm text-ink-muted dark:text-ink-lightMuted">
              Raise a ticket and track responses from the Pinnacle team.
            </p>
          </div>
          <button type="button" onClick={() => setCreateOpen(true)} className="btn-primary inline-flex items-center gap-2 self-start">
            <FiPlus className="h-4 w-4" /> New Ticket
          </button>
        </motion.div>
      </div>

      <DataTable
        columns={columns}
        data={tickets}
        loading={loading}
        rowKey="_id"
        page={page}
        pages={pages}
        total={total}
        onPageChange={(p) => fetchTickets(p)}
        onRowClick={(row) => setViewTicket(row)}
        emptyTitle="No support tickets yet"
        emptyDescription="Need help? Raise a new ticket and our team will get back to you."
      />

      {/* Create ticket modal */}
      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          reset();
        }}
        title="Raise a Support Ticket"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="create-ticket-form" disabled={submitting} className="btn-primary">
              {submitting ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </>
        }
      >
        <form id="create-ticket-form" onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <div>
            <label className="label-text">Subject</label>
            <input
              type="text"
              className="input-field"
              placeholder="Briefly describe your issue"
              {...register('subject', { required: 'Subject is required' })}
            />
            {errors.subject && <p className="mt-1 text-xs text-danger">{errors.subject.message}</p>}
          </div>

          <div>
            <label className="label-text">Category</label>
            <select className="input-field" {...register('category', { required: true })}>
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-text">Description</label>
            <textarea
              rows={5}
              className="input-field"
              placeholder="Share full details so we can help you faster"
              {...register('description', { required: 'Description is required', minLength: { value: 10, message: 'Please provide more detail (min 10 characters)' } })}
            />
            {errors.description && <p className="mt-1 text-xs text-danger">{errors.description.message}</p>}
          </div>
        </form>
      </Modal>

      {/* View ticket modal */}
      <Modal open={!!viewTicket} onClose={() => setViewTicket(null)} title={viewTicket?.subject} size="lg">
        {viewTicket && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={viewTicket.status} />
              <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium capitalize text-ink-muted dark:bg-white/5 dark:text-ink-lightMuted">
                {viewTicket.category}
              </span>
              <span className="text-xs text-ink-lightMuted">Raised on {formatDateTime(viewTicket.createdAt)}</span>
            </div>

            <div>
              <p className="label-text">Description</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink dark:text-ink-light">{viewTicket.description}</p>
            </div>

            <div>
              <p className="label-text">Response from Pinnacle Team</p>
              {viewTicket.responses?.length ? (
                <div className="mt-2 space-y-3">
                  {viewTicket.responses.map((resp, idx) => (
                    <div key={idx} className="rounded-2xl bg-brand-500/5 p-3">
                      <p className="whitespace-pre-wrap text-sm text-ink dark:text-ink-light">{resp.message}</p>
                      <p className="mt-1 text-xs text-ink-lightMuted">
                        {resp.by?.name || 'Admin'} · {formatDateTime(resp.at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-sm text-ink-muted dark:text-ink-lightMuted">
                  No response yet. Our team will get back to you soon.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
