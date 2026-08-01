import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  FiCalendar, FiDollarSign, FiTrendingUp, FiUsers, FiEdit3, FiUserPlus,
  FiFileText, FiFile,
} from 'react-icons/fi';
import reportsService from '../../services/reports.service';

const REPORT_TYPES = [
  {
    type: 'attendance',
    label: 'Attendance Report',
    description: 'Daily attendance records across courses, with present/absent/leave breakdowns.',
    icon: FiCalendar,
    tone: 'brand',
  },
  {
    type: 'fee',
    label: 'Fee Report',
    description: 'Fee schedules, dues and collection status for every enrolled student.',
    icon: FiDollarSign,
    tone: 'warning',
  },
  {
    type: 'revenue',
    label: 'Revenue Report',
    description: 'Monthly revenue analytics from all successful payments.',
    icon: FiTrendingUp,
    tone: 'success',
  },
  {
    type: 'student',
    label: 'Student Report',
    description: 'Full student directory with admission, course and contact details.',
    icon: FiUsers,
    tone: 'info',
  },
  {
    type: 'assignment',
    label: 'Assignment Report',
    description: 'Assignment submissions, grading status and marks across courses.',
    icon: FiEdit3,
    tone: 'coral',
  },
  {
    type: 'admission',
    label: 'Admission Report',
    description: 'New admissions, approvals and rejections over time.',
    icon: FiUserPlus,
    tone: 'brand',
  },
];

const tints = {
  brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-300',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info',
  coral: 'bg-accent-coral/10 text-accent-coral',
};

const EXT = { excel: 'xlsx', pdf: 'pdf' };

export default function Reports() {
  const [loadingKey, setLoadingKey] = useState(null);

  const handleExport = async (type, format) => {
    const key = `${type}-${format}`;
    setLoadingKey(key);
    try {
      const res = await reportsService.export(type, format);
      const blob = new Blob([res.data], {
        type: res.headers?.['content-type'] || 'application/octet-stream',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report.${EXT[format] || format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`${type[0].toUpperCase()}${type.slice(1)} report downloaded`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Something went wrong');
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pt-6">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink dark:text-ink-light sm:text-3xl">
          Reports & Exports
        </h1>
        <p className="mt-1.5 text-sm text-ink-muted dark:text-ink-lightMuted">
          Generate and download detailed reports across every module.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_TYPES.map((report, i) => {
          const excelKey = `${report.type}-excel`;
          const pdfKey = `${report.type}-pdf`;
          return (
            <motion.div
              key={report.type}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="card flex flex-col gap-4 p-6"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tints[report.tone]}`}>
                <report.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-ink dark:text-ink-light">
                  {report.label}
                </h3>
                <p className="mt-1.5 text-sm text-ink-muted dark:text-ink-lightMuted">
                  {report.description}
                </p>
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={loadingKey === excelKey}
                  onClick={() => handleExport(report.type, 'excel')}
                  className="btn-secondary flex-1"
                >
                  <FiFileText className="h-4 w-4" />
                  {loadingKey === excelKey ? 'Exporting...' : 'Export Excel'}
                </button>
                <button
                  type="button"
                  disabled={loadingKey === pdfKey}
                  onClick={() => handleExport(report.type, 'pdf')}
                  className="btn-primary flex-1"
                >
                  <FiFile className="h-4 w-4" />
                  {loadingKey === pdfKey ? 'Exporting...' : 'Export PDF'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
