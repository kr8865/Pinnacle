import React from 'react';
import Modal from './Modal';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  danger = false,
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={
              danger
                ? 'inline-flex items-center justify-center gap-2 rounded-full bg-danger text-white font-semibold px-6 py-2.5 shadow-soft hover:brightness-110 active:scale-[0.97] transition-all duration-200 disabled:opacity-50'
                : 'btn-primary'
            }
          >
            {loading ? 'Please wait...' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-ink-muted dark:text-ink-lightMuted">{message}</p>
    </Modal>
  );
}
