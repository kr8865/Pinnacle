import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  FiPlus, FiDollarSign, FiClock, FiAlertCircle, FiDownload, FiSearch, FiX, FiCheck,
} from 'react-icons/fi';

import feesService from '../../services/fees.service';
import paymentsService from '../../services/payments.service';
import studentsService from '../../services/students.service';

import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import StatCard from '../../components/StatCard';
import StatusPill from '../../components/Badge';
import { Skeleton, SkeletonCard } from '../../components/Skeleton';
import RevenueChart from '../../components/charts/RevenueChart';
import useDebounce from '../../hooks/useDebounce';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];
const FEE_STATUS_OPTIONS = ['pending', 'paid', 'overdue', 'partially-paid'];

const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;
const formatDate = (v) => (v ? new Date(v).toLocaleDateString('en-IN') : '—');
const errMsg = (err, fallback) => err?.response?.data?.message || fallback;

/**
 * Debounced search-as-you-type student picker. Queries `studentsService.list({ search })`
 * (the Student model has no direct name field — the backend populates `user: { name, email }`
 * and also exposes a denormalized `searchName`/`studentId`, both text-indexed for `search`).
 */
function StudentAutocomplete({ selected, onSelect, placeholder = 'Search student by name or ID...' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setResults([]);
      return undefined;
    }
    let active = true;
    setLoading(true);
    studentsService
      .list({ search: debouncedQuery.trim(), status: 'approved', limit: 8 })
      .then((res) => {
        if (active) setResults(res.data?.data || []);
      })
      .catch(() => {
        if (active) setResults([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-surface-border bg-white px-4 py-2.5 dark:border-surface-darkBorder dark:bg-surface-dark">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink dark:text-ink-light">
            {selected.user?.name || 'Unnamed student'}
          </p>
          <p className="truncate text-xs text-ink-muted dark:text-ink-lightMuted">
            {selected.studentId || selected.registrationNumber || selected.user?.email || ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            onSelect(null);
            setQuery('');
          }}
          className="btn-ghost h-8 w-8 shrink-0"
        >
          <FiX className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-2xl border border-surface-border bg-white px-4 py-2.5 dark:border-surface-darkBorder dark:bg-surface-dark">
        <FiSearch className="h-4 w-4 shrink-0 text-ink-lightMuted" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm outline-none placeholder:text-ink-lightMuted"
        />
      </div>
      {open && (query.trim().length >= 2) && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-2xl border border-surface-border bg-white shadow-softLg dark:border-surface-darkBorder dark:bg-surface-dark">
          {loading && <div className="p-3 text-xs text-ink-muted dark:text-ink-lightMuted">Searching...</div>}
          {!loading && results.length === 0 && (
            <div className="p-3 text-xs text-ink-muted dark:text-ink-lightMuted">No matching students found.</div>
          )}
          {!loading &&
            results.map((student) => (
              <button
                key={student._id}
                type="button"
                onClick={() => {
                  onSelect(student);
                  setOpen(false);
                  setQuery('');
                }}
                className="flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left text-sm hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
              >
                <span className="font-medium text-ink dark:text-ink-light">{student.user?.name || 'Unnamed student'}</span>
                <span className="text-xs text-ink-muted dark:text-ink-lightMuted">
                  {student.studentId || student.registrationNumber || student.user?.email || ''}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

export default function Fees() {
  // ---- Revenue report / stat cards ----
  const [year, setYear] = useState(CURRENT_YEAR);
  const [revenue, setRevenue] = useState(null);
  const [revenueLoading, setRevenueLoading] = useState(true);

  const [feeStats, setFeeStats] = useState({ dueCount: 0, dueAmount: 0, overdueCount: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // ---- Fee records table ----
  const [fees, setFees] = useState([]);
  const [feesLoading, setFeesLoading] = useState(true);
  const [feesMeta, setFeesMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [feePage, setFeePage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [studentFilter, setStudentFilter] = useState(null);

  // ---- Generate fee modal ----
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalStudent, setModalStudent] = useState(null);
  const {
    register, handleSubmit, reset, formState: { errors },
  } = useForm({
    defaultValues: { amount: '', dueDate: '', installments: 1, discount: 0, scholarship: 0 },
  });

  // ---- Payments ----
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsUnavailable, setPaymentsUnavailable] = useState(false);
  const [manualPaymentId, setManualPaymentId] = useState('');

  // ---- Reject dialog ----
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const loadRevenue = useCallback(async (y) => {
    setRevenueLoading(true);
    try {
      const res = await feesService.revenueReport({ year: y });
      setRevenue(res.data?.data || null);
    } catch (err) {
      toast.error(errMsg(err, 'Failed to load revenue report'));
    } finally {
      setRevenueLoading(false);
    }
  }, []);

  const loadFees = useCallback(async () => {
    setFeesLoading(true);
    try {
      const params = { page: feePage, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (studentFilter) params.student = studentFilter._id;
      const res = await feesService.list(params);
      setFees(res.data?.data || []);
      setFeesMeta(res.data?.meta || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      toast.error(errMsg(err, 'Failed to load fee records'));
    } finally {
      setFeesLoading(false);
    }
  }, [feePage, statusFilter, studentFilter]);

  // `GET /fees/reports/revenue` already returns `totalDue` (sum of pending/overdue/
  // partially-paid fees), but not a breakdown count. We fetch pending + overdue pages
  // separately (client-side aggregation) to surface counts on the stat cards, since
  // there is no dedicated fees-summary-by-status endpoint.
  const loadFeeStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [pendingRes, overdueRes] = await Promise.all([
        feesService.list({ status: 'pending', limit: 200 }),
        feesService.list({ status: 'overdue', limit: 200 }),
      ]);
      const pendingItems = pendingRes.data?.data || [];
      const overdueItems = overdueRes.data?.data || [];
      const dueAmount = [...pendingItems, ...overdueItems].reduce((sum, f) => sum + (f.amount || 0), 0);
      setFeeStats({
        dueCount: pendingRes.data?.meta?.total ?? pendingItems.length,
        dueAmount,
        overdueCount: overdueRes.data?.meta?.total ?? overdueItems.length,
      });
    } catch (err) {
      toast.error(errMsg(err, 'Failed to load fee statistics'));
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // NOTE / RISK: `payments.service.js` only exposes `history()`, which maps to
  // `GET /payments/history`. Per API_CONTRACT.md and payments.controller.js, that
  // route is student-facing only — the backend resolves `Student.findOne({ user:
  // req.user._id })` from the logged-in user and 404s with "Student profile not
  // found" for an admin caller (admins have no Student document). There is no
  // dedicated admin "list all payments" endpoint anywhere in the contract or the
  // service file. We still call `history()` as the closest available method; if it
  // 404s (expected for admin accounts) we fall back to a manual "look up by Payment
  // ID" control below so admins can still approve/reject/view a receipt for a known
  // payment id. This is flagged as a gap in the final report.
  const loadPayments = useCallback(async () => {
    setPaymentsLoading(true);
    setPaymentsUnavailable(false);
    try {
      const res = await paymentsService.history();
      setPayments(res.data?.data || []);
    } catch {
      setPaymentsUnavailable(true);
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  useEffect(() => { loadRevenue(year); }, [year, loadRevenue]);
  useEffect(() => { loadFees(); }, [loadFees]);
  useEffect(() => { loadFeeStats(); }, [loadFeeStats]);
  useEffect(() => { loadPayments(); }, [loadPayments]);

  const monthlyChartData = useMemo(() => {
    if (!revenue?.monthly) return [];
    return revenue.monthly.map((m) => ({ label: MONTH_LABELS[m.month - 1], revenue: m.total }));
  }, [revenue]);

  const openGenerateModal = () => {
    reset({ amount: '', dueDate: '', installments: 1, discount: 0, scholarship: 0 });
    setModalStudent(null);
    setModalOpen(true);
  };

  const onGenerate = async (values) => {
    if (!modalStudent) {
      toast.error('Please select a student');
      return;
    }
    setSubmitting(true);
    try {
      await feesService.generate({
        student: modalStudent._id,
        amount: Number(values.amount),
        dueDate: values.dueDate,
        installments: Number(values.installments) || 1,
        discount: Number(values.discount) || 0,
        scholarship: Number(values.scholarship) || 0,
      });
      toast.success('Fee generated successfully');
      setModalOpen(false);
      loadFees();
      loadFeeStats();
      loadRevenue(year);
    } catch (err) {
      toast.error(errMsg(err, 'Failed to generate fee'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    if (!id) {
      toast.error('Enter a payment ID first');
      return;
    }
    try {
      await paymentsService.approve(id);
      toast.success('Payment approved');
      loadPayments();
    } catch (err) {
      toast.error(errMsg(err, 'Failed to approve payment'));
    }
  };

  const openReject = (id) => {
    if (!id) {
      toast.error('Enter a payment ID first');
      return;
    }
    setRejectTarget(id);
    setRejectReason('');
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      await paymentsService.reject(rejectTarget, rejectReason);
      toast.success('Payment rejected');
      setRejectTarget(null);
      loadPayments();
    } catch (err) {
      toast.error(errMsg(err, 'Failed to reject payment'));
    } finally {
      setRejecting(false);
    }
  };

  const viewReceipt = async (id) => {
    if (!id) {
      toast.error('Enter a payment ID first');
      return;
    }
    try {
      const res = await paymentsService.receipt(id);
      const url = res.data?.data?.pdfUrl;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      else toast.error('Receipt URL not available yet');
    } catch (err) {
      toast.error(errMsg(err, 'Receipt not found for this payment'));
    }
  };

  const feeColumns = [
    {
      key: 'student',
      label: 'Student',
      render: (row) => (
        <div>
          <p className="font-medium text-ink dark:text-ink-light">{row.student?.user?.name || 'Unknown'}</p>
          <p className="text-xs text-ink-muted dark:text-ink-lightMuted">
            {row.student?.studentId || row.student?.user?.email || ''}
          </p>
        </div>
      ),
    },
    {
      key: 'title',
      label: 'Fee',
      render: (row) => (
        <div>
          <p>{row.title}</p>
          <p className="text-xs text-ink-muted dark:text-ink-lightMuted">Installment #{row.installmentNumber}</p>
        </div>
      ),
    },
    { key: 'amount', label: 'Amount', render: (row) => money(row.amount) },
    { key: 'dueDate', label: 'Due Date', render: (row) => formatDate(row.dueDate) },
    { key: 'status', label: 'Status', render: (row) => <StatusPill status={row.status} /> },
  ];

  const paymentColumns = [
    {
      key: 'student',
      label: 'Student',
      render: (row) => row.student?.user?.name || row.student?.studentId || row.student || '—',
    },
    { key: 'amount', label: 'Amount', render: (row) => money(row.amount) },
    { key: 'method', label: 'Method', render: (row) => <span className="capitalize">{row.method}</span> },
    { key: 'status', label: 'Status', render: (row) => <StatusPill status={row.status} /> },
    { key: 'createdAt', label: 'Date', render: (row) => formatDate(row.createdAt) },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          {(row.status === 'pending' || row.status === 'created') && (
            <>
              <button type="button" className="btn-ghost text-xs text-success" onClick={() => handleApprove(row._id)}>
                <FiCheck className="h-3.5 w-3.5" /> Approve
              </button>
              <button type="button" className="btn-ghost text-xs text-danger" onClick={() => openReject(row._id)}>
                <FiX className="h-3.5 w-3.5" /> Reject
              </button>
            </>
          )}
          {row.status === 'success' && (
            <button type="button" className="btn-ghost text-xs" onClick={() => viewReceipt(row._id)}>
              <FiDownload className="h-3.5 w-3.5" /> Receipt
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink dark:text-ink-light">
            Fees &amp; Payments
          </h1>
          <p className="text-sm text-ink-muted dark:text-ink-lightMuted">
            Generate fee records, track revenue, and manage student payments.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={openGenerateModal}>
          <FiPlus className="h-4 w-4" /> Generate Fee
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {revenueLoading || statsLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard icon={FiDollarSign} label="Total Revenue" value={money(revenue?.totalRevenue)} tone="brand" index={0} />
            <StatCard
              icon={FiClock}
              label={`${feeStats.dueCount} fee record(s) pending`}
              value={money(revenue?.totalDue ?? feeStats.dueAmount)}
              tone="warning"
              index={1}
            />
            <StatCard icon={FiAlertCircle} label="Overdue Fee Records" value={feeStats.overdueCount} tone="danger" index={2} />
          </>
        )}
      </div>

      {/* Revenue chart */}
      <div className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-ink dark:text-ink-light">Monthly Revenue Trend</h2>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-full border border-surface-border bg-white px-3 py-1.5 text-sm outline-none dark:border-surface-darkBorder dark:bg-surface-dark"
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        {revenueLoading ? <Skeleton className="h-[280px] w-full" /> : <RevenueChart data={monthlyChartData} />}
      </div>

      {/* Fee records table */}
      <DataTable
        columns={feeColumns}
        data={fees}
        loading={feesLoading}
        rowKey="_id"
        page={feesMeta.page}
        pages={feesMeta.pages}
        total={feesMeta.total}
        onPageChange={setFeePage}
        emptyTitle="No fee records found"
        emptyDescription="Generate a fee record for a student to see it listed here."
        toolbar={
          <>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setFeePage(1);
              }}
              className="rounded-full border border-surface-border bg-white px-3 py-1.5 text-sm outline-none dark:border-surface-darkBorder dark:bg-surface-dark"
            >
              <option value="">All statuses</option>
              {FEE_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="w-full sm:w-56">
              <StudentAutocomplete
                selected={studentFilter}
                onSelect={(s) => {
                  setStudentFilter(s);
                  setFeePage(1);
                }}
                placeholder="Filter by student..."
              />
            </div>
          </>
        }
      />

      {/* Payments section */}
      <div className="space-y-3">
        <h2 className="font-semibold text-ink dark:text-ink-light">Payments</h2>

        {paymentsUnavailable && (
          <div className="card space-y-4 p-5">
            <EmptyState
              icon={FiAlertCircle}
              title="Admin-wide payment listing is not available"
              description="/payments/history is a student-scoped endpoint (it resolves the logged-in user's own Student profile); the API contract has no admin 'list all payments' route yet. Use the lookup below to act on a payment you already have the ID for (e.g. from a notification or receipt link)."
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                value={manualPaymentId}
                onChange={(e) => setManualPaymentId(e.target.value)}
                placeholder="Paste a Payment ID..."
                className="w-full rounded-2xl border border-surface-border bg-white px-4 py-2.5 text-sm outline-none dark:border-surface-darkBorder dark:bg-surface-dark sm:max-w-xs"
              />
              <div className="flex items-center gap-2">
                <button type="button" className="btn-secondary" onClick={() => handleApprove(manualPaymentId)}>
                  Approve
                </button>
                <button type="button" className="btn-secondary" onClick={() => openReject(manualPaymentId)}>
                  Reject
                </button>
                <button type="button" className="btn-secondary" onClick={() => viewReceipt(manualPaymentId)}>
                  View Receipt
                </button>
              </div>
            </div>
          </div>
        )}

        {!paymentsUnavailable && (
          <DataTable
            columns={paymentColumns}
            data={payments}
            loading={paymentsLoading}
            rowKey="_id"
            emptyTitle="No payments found"
            emptyDescription="Payments will appear here once students start paying their fees."
          />
        )}
      </div>

      {/* Generate Fee modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Generate Fee"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleSubmit(onGenerate)} disabled={submitting}>
              {submitting ? 'Generating...' : 'Generate Fee'}
            </button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onGenerate)}>
          <div>
            <label className="label-text">Student</label>
            <StudentAutocomplete selected={modalStudent} onSelect={setModalStudent} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-text">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('amount', { required: 'Amount is required', min: { value: 1, message: 'Amount must be positive' } })}
                className="w-full rounded-2xl border border-surface-border bg-white px-4 py-2.5 text-sm outline-none dark:border-surface-darkBorder dark:bg-surface-dark"
              />
              {errors.amount && <p className="mt-1 text-xs text-danger">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="label-text">Due Date</label>
              <input
                type="date"
                {...register('dueDate', { required: 'Due date is required' })}
                className="w-full rounded-2xl border border-surface-border bg-white px-4 py-2.5 text-sm outline-none dark:border-surface-darkBorder dark:bg-surface-dark"
              />
              {errors.dueDate && <p className="mt-1 text-xs text-danger">{errors.dueDate.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="label-text">Installments</label>
              <input
                type="number"
                min="1"
                {...register('installments', { min: { value: 1, message: 'Min 1' } })}
                className="w-full rounded-2xl border border-surface-border bg-white px-4 py-2.5 text-sm outline-none dark:border-surface-darkBorder dark:bg-surface-dark"
              />
            </div>
            <div>
              <label className="label-text">Discount (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('discount')}
                className="w-full rounded-2xl border border-surface-border bg-white px-4 py-2.5 text-sm outline-none dark:border-surface-darkBorder dark:bg-surface-dark"
              />
            </div>
            <div>
              <label className="label-text">Scholarship (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('scholarship')}
                className="w-full rounded-2xl border border-surface-border bg-white px-4 py-2.5 text-sm outline-none dark:border-surface-darkBorder dark:bg-surface-dark"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Reject payment dialog */}
      <Modal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject Payment"
        size="sm"
        footer={
          <>
            <button type="button" className="btn-secondary" onClick={() => setRejectTarget(null)} disabled={rejecting}>
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmReject}
              disabled={rejecting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-danger text-white font-semibold px-6 py-2.5 shadow-soft hover:brightness-110 active:scale-[0.97] transition-all duration-200 disabled:opacity-50"
            >
              {rejecting ? 'Please wait...' : 'Reject Payment'}
            </button>
          </>
        }
      >
        <label className="label-text">Reason for rejection</label>
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          rows={3}
          placeholder="e.g. Cheque bounced, amount mismatch..."
          className="w-full rounded-2xl border border-surface-border bg-white px-4 py-2.5 text-sm outline-none dark:border-surface-darkBorder dark:bg-surface-dark"
        />
      </Modal>
    </div>
  );
}
