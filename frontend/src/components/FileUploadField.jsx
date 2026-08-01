import React, { useRef, useState } from 'react';
import { FiUploadCloud, FiFile, FiX } from 'react-icons/fi';

export default function FileUploadField({
  label,
  accept,
  onChange,
  error,
  required,
  hint,
  multiple = false,
}) {
  const inputRef = useRef(null);
  const [fileNames, setFileNames] = useState([]);

  const handleChange = (e) => {
    const files = Array.from(e.target.files || []);
    setFileNames(files.map((f) => f.name));
    onChange?.(multiple ? files : files[0]);
  };

  const clear = () => {
    setFileNames([]);
    if (inputRef.current) inputRef.current.value = '';
    onChange?.(multiple ? [] : null);
  };

  return (
    <div>
      {label && (
        <label className="label-text">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border-2 border-dashed px-4 py-3 transition-colors ${
          error
            ? 'border-danger/50 bg-danger/5'
            : 'border-surface-border dark:border-surface-darkBorder hover:border-brand-500/50 hover:bg-brand-500/5'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <FiUploadCloud className="h-5 w-5 shrink-0 text-brand-500" />
          <span className="truncate text-sm text-ink-muted dark:text-ink-lightMuted">
            {fileNames.length ? fileNames.join(', ') : 'Click to upload or drag file here'}
          </span>
        </div>
        {fileNames.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clear();
            }}
            className="btn-ghost h-7 w-7 shrink-0"
          >
            <FiX className="h-4 w-4" />
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={handleChange}
        />
      </div>
      {hint && !error && <p className="mt-1 text-xs text-ink-lightMuted">{hint}</p>}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function FilePill({ name, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1 text-xs text-brand-600 dark:text-brand-300">
      <FiFile className="h-3 w-3" />
      {name}
      {onRemove && (
        <button type="button" onClick={onRemove}>
          <FiX className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
