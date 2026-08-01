import React, { useEffect, useState } from 'react';
import { FiSearch, FiChevronLeft, FiChevronRight, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import useDebounce from '../hooks/useDebounce';
import { SkeletonTable } from './Skeleton';
import EmptyState from './EmptyState';

/**
 * Generic paginated / sortable / searchable data table.
 *
 * columns: [{ key, label, sortable?, render?: (row) => node, className? }]
 * data: array of rows for the current page (server-paginated)
 * rowKey: string field name or fn(row) => key
 */
export default function DataTable({
  columns,
  data = [],
  loading = false,
  rowKey = 'id',
  page = 1,
  pages = 1,
  total = 0,
  onPageChange,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  sortKey,
  sortDir = 'asc',
  onSortChange,
  toolbar,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your filters or search term.',
  onRowClick,
}) {
  const [term, setTerm] = useState(searchValue || '');
  const debounced = useDebounce(term, 400);

  useEffect(() => {
    onSearchChange?.(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const getKey = (row, i) => (typeof rowKey === 'function' ? rowKey(row) : row[rowKey] ?? i);

  const handleSort = (col) => {
    if (!col.sortable || !onSortChange) return;
    const nextDir = sortKey === col.key && sortDir === 'asc' ? 'desc' : 'asc';
    onSortChange(col.key, nextDir);
  };

  return (
    <div className="card overflow-hidden">
      {(onSearchChange || toolbar) && (
        <div className="flex flex-col gap-3 border-b border-surface-border p-4 dark:border-surface-darkBorder sm:flex-row sm:items-center sm:justify-between">
          {onSearchChange && (
            <div className="flex w-full items-center gap-2 rounded-full border border-surface-border bg-white px-4 py-2 dark:border-surface-darkBorder dark:bg-surface-dark sm:max-w-xs">
              <FiSearch className="h-4 w-4 shrink-0 text-ink-lightMuted" />
              <input
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-sm outline-none placeholder:text-ink-lightMuted"
              />
            </div>
          )}
          {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-surface-border text-xs uppercase tracking-wide text-ink-lightMuted dark:border-surface-darkBorder">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-semibold ${col.sortable ? 'cursor-pointer select-none' : ''} ${col.className || ''}`}
                  onClick={() => handleSort(col)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortDir === 'asc' ? <FiChevronUp className="h-3 w-3" /> : <FiChevronDown className="h-3 w-3" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          {!loading && data.length > 0 && (
            <tbody className="divide-y divide-surface-border dark:divide-surface-darkBorder">
              {data.map((row, i) => (
                <tr
                  key={getKey(row, i)}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03] ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3.5 text-ink dark:text-ink-light ${col.className || ''}`}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>

        {loading && <div className="p-4"><SkeletonTable rows={6} cols={columns.length} /></div>}

        {!loading && data.length === 0 && (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        )}
      </div>

      {!loading && data.length > 0 && onPageChange && (
        <div className="flex items-center justify-between gap-3 border-t border-surface-border px-4 py-3 dark:border-surface-darkBorder">
          <span className="text-xs text-ink-muted dark:text-ink-lightMuted">
            Page {page} of {pages || 1} {total ? `· ${total} total` : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="btn-ghost h-9 w-9 border border-surface-border disabled:opacity-40 dark:border-surface-darkBorder"
            >
              <FiChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => onPageChange(page + 1)}
              className="btn-ghost h-9 w-9 border border-surface-border disabled:opacity-40 dark:border-surface-darkBorder"
            >
              <FiChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
