import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiCreditCard, FiCalendar, FiDownload } from 'react-icons/fi';
import feesService from '../../services/fees.service';
import paymentsService from '../../services/payments.service';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import DataTable from '../../components/DataTable';
import EmptyState from '../../components/EmptyState';
import { SkeletonCard, SkeletonTable } from '../../components/Skeleton';
import StatusPill from '../../components/Badge';

const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function payableAmount(fee) {
  return Number((fee.amount - (fee.discount || 0) - (fee.scholarship || 0)).toFixed(2));
}

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay')));
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay'));
    document.body.appendChild(script);
  });
}

export default function Fees() {
  const { user } = useAuth();
  const scriptLoadedRef = useRef(false);

  const [dueFees, setDueFees] = useState([]);
  const [loadingDue, setLoadingDue] = useState(true);
  const [payingId, setPayingId] = useState(null);

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [receiptLoadingId, setReceiptLoadingId] = useState(null);

  const fetchDue = useCallback(async () => {
    try {
      setLoadingDue(true);
      const res = await feesService.due();
      setDueFees(res?.data?.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load due fees');
    } finally {
      setLoadingDue(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const res = await paymentsService.history();
      setHistory(res?.data?.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load payment history');
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchDue();
    fetchHistory();
  }, [fetchDue, fetchHistory]);

  const handlePayNow = async (fee) => {
    setPayingId(fee._id);
    try {
      if (!scriptLoadedRef.current) {
        await loadRazorpayScript();
        scriptLoadedRef.current = true;
      }
      if (!window.Razorpay) {
        toast.error('Unable to load payment gateway. Please try again.');
        return;
      }

      const orderRes = await paymentsService.createOrder(fee._id);
      const order = orderRes?.data?.data;
      if (!order?.orderId || !order?.key) {
        toast.error('Could not create payment order.');
        return;
      }

      const rzp = new window.Razorpay({
        key: order.key,
        amount: order.amount,
        currency: order.currency || 'INR',
        order_id: order.orderId,
        name: 'Pinnacle Tuition Classes',
        description: fee.title,
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone,
        },
        theme: { color: '#4F46E5' },
        handler: async (response) => {
          try {
            await paymentsService.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success('Payment successful! Receipt is being generated.');
            fetchDue();
            fetchHistory();
          } catch (err) {
            toast.error(err?.response?.data?.message || 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => setPayingId(null),
        },
      });

      rzp.open();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to start payment');
    } finally {
      setPayingId(null);
    }
  };

  const handleReceipt = async (payment) => {
    setReceiptLoadingId(payment._id);
    try {
      const res = await paymentsService.receipt(payment._id);
      const url = res?.data?.data?.pdfUrl;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('Receipt is not available yet.');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to fetch receipt');
    } finally {
      setReceiptLoadingId(null);
    }
  };

  const totalDue = dueFees.reduce((sum, fee) => sum + payableAmount(fee), 0);
  const nextDueDate = dueFees.length
    ? dueFees.reduce((earliest, fee) => (new Date(fee.dueDate) < new Date(earliest) ? fee.dueDate : earliest), dueFees[0].dueDate)
    : null;

  const historyColumns = [
    { key: 'title', label: 'Fee', render: (row) => row.fee?.title || 'Tuition Fee' },
    { key: 'amount', label: 'Amount', render: (row) => formatCurrency(row.amount) },
    { key: 'method', label: 'Method', render: (row) => <span className="capitalize">{row.method}</span> },
    { key: 'createdAt', label: 'Date', render: (row) => formatDate(row.createdAt) },
    { key: 'status', label: 'Status', render: (row) => <StatusPill status={row.status} /> },
    {
      key: 'receipt',
      label: 'Receipt',
      render: (row) =>
        row.status === 'success' ? (
          <button
            type="button"
            onClick={() => handleReceipt(row)}
            disabled={receiptLoadingId === row._id}
            className="btn-ghost inline-flex items-center gap-1.5 border border-surface-border text-xs dark:border-surface-darkBorder"
          >
            <FiDownload className="h-3.5 w-3.5" />
            {receiptLoadingId === row._id ? 'Opening...' : 'Receipt'}
          </button>
        ) : (
          <span className="text-ink-lightMuted">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl px-1 pb-2 pt-6 sm:px-2">
        <div className="pointer-events-none absolute -top-16 left-10 h-64 w-64 rounded-full bg-warm-glow opacity-40 blur-3xl" />
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink dark:text-ink-light sm:text-3xl">
            Fees &amp; Payments
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted dark:text-ink-lightMuted">
            View your dues, pay online via Razorpay, and track your payment history.
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {loadingDue ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard icon={FiCreditCard} label="Total Amount Due" value={formatCurrency(totalDue)} tone={totalDue > 0 ? 'danger' : 'success'} />
            <StatCard icon={FiCalendar} label="Next Due Date" value={nextDueDate ? formatDate(nextDueDate) : 'No dues'} tone="brand" />
          </>
        )}
      </div>

      <div className="card p-5">
        <h3 className="mb-4 font-semibold text-ink dark:text-ink-light">Pending Fees</h3>
        {loadingDue ? (
          <SkeletonTable rows={3} cols={4} />
        ) : dueFees.length === 0 ? (
          <EmptyState icon={FiCreditCard} title="No dues right now" description="You're all caught up on your fee payments." />
        ) : (
          <div className="space-y-3">
            {dueFees.map((fee) => (
              <div
                key={fee._id}
                className="flex flex-col gap-3 rounded-2xl border border-surface-border p-4 dark:border-surface-darkBorder sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-ink dark:text-ink-light">
                    {fee.title} {fee.installmentNumber > 1 ? `(Installment ${fee.installmentNumber})` : ''}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-muted dark:text-ink-lightMuted">
                    Due {formatDate(fee.dueDate)} · {formatCurrency(payableAmount(fee))}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill status={fee.status} />
                  <button
                    type="button"
                    onClick={() => handlePayNow(fee)}
                    disabled={payingId === fee._id}
                    className="btn-primary whitespace-nowrap"
                  >
                    {payingId === fee._id ? 'Processing...' : 'Pay Now'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-4 font-semibold text-ink dark:text-ink-light">Payment History</h3>
        <DataTable
          columns={historyColumns}
          data={history}
          loading={loadingHistory}
          rowKey="_id"
          emptyTitle="No payments yet"
          emptyDescription="Your successful and pending payments will show up here."
        />
      </div>
    </div>
  );
}
