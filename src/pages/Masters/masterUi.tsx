import React, { useState, useEffect } from 'react';
import { Search, X, ArrowUpDown, ArrowUp, ArrowDown, Download, Trash2, AlertCircle, ChevronDown } from 'lucide-react';
import { exportTableToCsv, exportTableToExcel, ExportColumn } from '../../utils/exportTable';

export interface SortState {
  key: string;
  dir: 'asc' | 'desc';
}

export interface RegisterStat {
  label: string;
  value: string | number;
  title?: string;
  tone?: 'ok' | 'warn' | 'bad' | 'info';
}

/**
 * Statistics Summary Strip
 */
export const StatStrip: React.FC<{ stats?: RegisterStat[] }> = ({ stats = [] }) => {
  const list = Array.isArray(stats) ? stats : [];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 mb-4">
      {list.map((s, idx) => {
        let toneBg = 'bg-white dark:bg-boxdark border-stroke dark:border-strokedark';
        let textTone = 'text-black dark:text-white';
        if (s.tone === 'ok') {
          toneBg = 'bg-teal-50/70 border-teal-200 dark:bg-teal-950/30 dark:border-teal-800';
          textTone = 'text-teal-700 dark:text-teal-400';
        } else if (s.tone === 'warn') {
          toneBg = 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800';
          textTone = 'text-amber-700 dark:text-amber-400';
        } else if (s.tone === 'bad') {
          toneBg = 'bg-red-50/70 border-red-200 dark:bg-red-950/30 dark:border-red-800';
          textTone = 'text-red-700 dark:text-red-400';
        } else if (s.tone === 'info') {
          toneBg = 'bg-blue-50/70 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800';
          textTone = 'text-blue-700 dark:text-blue-400';
        }

        return (
          <div
            key={idx}
            title={s.title}
            className={`rounded-lg border p-3 shadow-sm transition-all duration-200 ${toneBg}`}
          >
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
              {s.label}
            </div>
            <div className={`mt-1 text-lg font-bold truncate ${textTone}`}>
              {s.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Search Box with clear button
 */
export const SearchBox: React.FC<{
  value?: string;
  onChange?: (val: string) => void;
  onSearch?: (val: string) => void;
  placeholder?: string;
}> = ({ value = '', onChange, onSearch, placeholder = 'Search...' }) => {
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    onChange?.(e.target.value);
    onSearch?.(e.target.value);
  };

  const handleClear = () => {
    setText('');
    onChange?.('');
    onSearch?.('');
  };

  return (
    <div className="relative flex-1 min-w-[200px] max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        value={text}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full rounded-md border border-stroke bg-white py-2 pl-9 pr-8 text-sm text-black outline-none transition focus:border-primary dark:border-strokedark dark:bg-boxdark dark:text-white dark:focus:border-primary"
      />
      {text && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

/**
 * Status Filter Pills
 */
export const StatusPills: React.FC<{
  options?: { label: string; value: string; count?: number }[];
  counts?: { label: string; value: string; count?: number }[];
  value: string;
  onChange: (val: string) => void;
}> = ({ options, counts, value, onChange }) => {
  const items = Array.isArray(options) ? options : Array.isArray(counts) ? counts : [];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              active
                ? 'bg-primary text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-meta-4 dark:text-gray-300 dark:hover:bg-opacity-80'
            }`}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  active ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700 dark:bg-boxdark dark:text-gray-300'
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

/**
 * Tab Navigation Strip
 */
export const TabStrip: React.FC<{
  tabs?: string[];
  activeTab?: string;
  active?: string;
  value?: string;
  onChange?: (tab: string) => void;
  onTabChange?: (tab: string) => void;
}> = ({ tabs = [], activeTab, active, value, onChange, onTabChange }) => {
  const current = activeTab || active || value || tabs[0] || '';
  const handler = (t: string) => {
    onChange?.(t);
    onTabChange?.(t);
  };

  return (
    <div className="flex border-b border-stroke dark:border-strokedark mb-5 overflow-x-auto">
      {tabs.map(t => {
        const isActive = current === t;
        return (
          <button
            key={t}
            type="button"
            onClick={() => handler(t)}
            className={`border-b-2 py-2.5 px-4 text-sm font-semibold transition-colors whitespace-nowrap ${
              isActive
                ? 'border-primary text-primary dark:text-white'
                : 'border-transparent text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
};

/**
 * Text Area Input or Container
 */
export const Area: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => {
  return (
    <textarea
      {...props}
      className={`w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-3 text-sm text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary ${
        props.className || ''
      }`}
    />
  );
};

/**
 * Form Field Wrapper
 */
export const Field: React.FC<{
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, required, hint, error, children, className = '' }) => {
  return (
    <div className={`mb-3 ${className}`}>
      <label className="mb-1.5 block text-xs font-semibold text-black dark:text-white">
        {label} {required && <span className="text-meta-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">{hint}</p>}
      {error && <p className="mt-1 text-[11px] text-meta-1">{error}</p>}
    </div>
  );
};

/**
 * Styled Text Input
 */
export const Text: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => {
  return (
    <input
      {...props}
      className={`w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-3 text-sm text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary ${
        props.className || ''
      }`}
    />
  );
};

/**
 * Styled Select Dropdown
 */
export const Pick: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => {
  return (
    <select
      {...props}
      className={`w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-3 text-sm text-black outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary ${
        props.className || ''
      }`}
    >
      {props.children}
    </select>
  );
};

/**
 * Searchable Pick component (Rich autocomplete dropdown with keyboard navigation & sub-label tags)
 */
export const SearchPick: React.FC<{
  options?: { value?: any; id?: any; label?: string; name?: string; sub?: string }[];
  value?: any;
  valueId?: any;
  valueLabel?: string;
  onChange?: (val: any) => void;
  onPick?: (opt: { id?: any; label?: string; sub?: string; name?: string } | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}> = ({
  options = [],
  value,
  valueId,
  valueLabel,
  onChange,
  onPick,
  placeholder = 'Search by name or code...',
  className = '',
  disabled = false,
}) => {
  const items = React.useMemo(() => (Array.isArray(options) ? options : []), [options]);
  const selectedValue = valueId !== undefined && valueId !== null ? valueId : value;

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selectedItem = React.useMemo(() => {
    if (selectedValue === undefined || selectedValue === null || selectedValue === '') return null;
    return (
      items.find((opt) => {
        const optVal = opt.id !== undefined ? opt.id : opt.value;
        return String(optVal) === String(selectedValue);
      }) || null
    );
  }, [items, selectedValue]);

  const displayLabel = valueLabel || selectedItem?.label || selectedItem?.name || '';
  const displaySub = selectedItem?.sub || '';

  const filteredItems = React.useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase().trim();
    return items.filter((opt) => {
      const label = String(opt.label || opt.name || '').toLowerCase();
      const sub = String(opt.sub || '').toLowerCase();
      const val = String(opt.id !== undefined ? opt.id : opt.value || '').toLowerCase();
      return label.includes(q) || sub.includes(q) || val.includes(q);
    });
  }, [items, query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, isOpen]);

  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (opt: { id?: any; value?: any; label?: string; name?: string; sub?: string } | null) => {
    if (!opt) {
      onChange?.('');
      onPick?.(null);
    } else {
      const optVal = opt.id !== undefined ? opt.id : opt.value;
      onChange?.(optVal);
      onPick?.({
        id: optVal,
        label: opt.label || opt.name || String(optVal),
        name: opt.name || opt.label || String(optVal),
        sub: opt.sub,
      });
    }
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + (filteredItems.length || 1)) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        handleSelect(filteredItems[highlightedIndex] || filteredItems[0]);
      }
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setIsOpen(false);
      setQuery('');
    }
  };

  return (
    <div
      className={`relative ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }
        }}
        tabIndex={disabled ? -1 : 0}
        className={`w-full rounded border-[1.5px] border-stroke bg-transparent py-2 px-3 text-sm text-black outline-none transition flex items-center justify-between min-h-[38px] select-none ${
          disabled
            ? 'bg-whiter dark:bg-form-input cursor-not-allowed'
            : 'cursor-pointer hover:border-primary focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary'
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0 pr-1">
          {displayLabel ? (
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="font-semibold text-black dark:text-white truncate text-xs sm:text-sm">
                {displayLabel}
              </span>
              {displaySub && (
                <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 dark:bg-primary/20 px-1.5 py-0.5 rounded">
                  {displaySub}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500 font-normal truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedValue !== undefined && selectedValue !== null && selectedValue !== '' && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(null);
              }}
              className="p-1 text-gray-400 hover:text-rose-500 rounded-full transition cursor-pointer"
              title="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-primary' : ''
            }`}
          />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-[99999] w-full min-w-[260px] rounded-lg border border-stroke dark:border-strokedark bg-white dark:bg-[#1A222C] shadow-2xl p-2 space-y-1.5">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type name, code, or designation..."
              className="w-full pl-8 pr-2.5 py-1.5 rounded-md border border-stroke dark:border-strokedark bg-slate-50 dark:bg-slate-900 text-xs text-black dark:text-white font-medium outline-none focus:border-primary"
            />
          </div>

          <div ref={listRef} className="max-h-56 overflow-y-auto divide-y divide-stroke/60 dark:divide-strokedark/60 scrollbar-thin">
            {filteredItems.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-400">
                No matching employee found
              </div>
            ) : (
              filteredItems.map((opt, i) => {
                const optVal = opt.id !== undefined ? opt.id : opt.value;
                const isSelected = String(optVal) === String(selectedValue);
                const isHighlighted = i === highlightedIndex;
                const optLabel = opt.label || opt.name || String(optVal);

                return (
                  <div
                    key={i}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    onClick={() => handleSelect(opt)}
                    className={`py-2 px-2.5 rounded-md cursor-pointer text-xs flex items-center justify-between gap-2 transition ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-bold'
                        : isHighlighted
                        ? 'bg-slate-100 dark:bg-slate-800/80 text-black dark:text-white'
                        : 'text-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="font-semibold truncate">
                      {optLabel}
                    </span>
                    {opt.sub && (
                      <span className="font-mono text-[10px] font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-boxdark-2 border border-stroke dark:border-strokedark px-1.5 py-0.5 rounded shrink-0">
                        {opt.sub}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Checkbox component
 */
export const Check: React.FC<{
  label?: string;
  checked?: boolean;
  onChange?: ((checked: boolean) => void) | React.ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
  className?: string;
}> = ({ label, checked = false, onChange, disabled = false, className = '' }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (typeof onChange === 'function') {
      (onChange as any)(e.target.checked);
    }
  };

  return (
    <label className={`inline-flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-black dark:text-white ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        className="h-4 w-4 rounded border-stroke text-primary focus:ring-primary dark:border-strokedark dark:bg-boxdark"
      />
      {label && <span>{label}</span>}
    </label>
  );
};

/**
 * Date Window Range Filter
 */
export const DateWindow: React.FC<{
  from?: string;
  to?: string;
  fromDate?: string;
  toDate?: string;
  onFromChange?: (v: string) => void;
  onToChange?: (v: string) => void;
  onChange?: (from: string, to: string) => void;
  className?: string;
}> = ({
  from,
  to,
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  onChange,
  className = '',
}) => {
  const currentFrom = from !== undefined ? from : fromDate || '';
  const currentTo = to !== undefined ? to : toDate || '';

  const handleFrom = (v: string) => {
    onFromChange?.(v);
    onChange?.(v, currentTo);
  };

  const handleTo = (v: string) => {
    onToChange?.(v);
    onChange?.(currentFrom, v);
  };

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <div className="flex items-center gap-1">
        <span className="text-gray-500 dark:text-gray-400">From:</span>
        <input
          type="date"
          value={currentFrom}
          onChange={(e) => handleFrom(e.target.value)}
          className="rounded border border-stroke bg-white px-2 py-1 text-xs text-black dark:border-strokedark dark:bg-boxdark dark:text-white"
        />
      </div>
      <div className="flex items-center gap-1">
        <span className="text-gray-500 dark:text-gray-400">To:</span>
        <input
          type="date"
          value={currentTo}
          onChange={(e) => handleTo(e.target.value)}
          className="rounded border border-stroke bg-white px-2 py-1 text-xs text-black dark:border-strokedark dark:bg-boxdark dark:text-white"
        />
      </div>
    </div>
  );
};

/**
 * Delete Confirmation Modal
 */
export const DeleteConfirm: React.FC<{
  open?: boolean;
  isOpen?: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}> = ({
  open = true,
  isOpen = true,
  title = 'Delete Record',
  message = 'Are you sure you want to delete this record? This action cannot be undone.',
  onConfirm,
  onCancel,
  loading = false
}) => {
  const isShown = open && isOpen;
  if (!isShown) return null;

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-stroke bg-white p-6 shadow-xl dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center gap-3 text-meta-1">
          <AlertCircle className="h-6 w-6" />
          <h3 className="text-lg font-bold text-black dark:text-white">{title}</h3>
        </div>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded border border-stroke px-4 py-2 text-xs font-semibold text-black transition hover:bg-gray-100 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded bg-meta-1 px-4 py-2 text-xs font-semibold text-white transition hover:bg-opacity-90"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Sortable Table Header Cell
 */
export const SortHeader: React.FC<{
  label: string;
  sortKey: string;
  sort: SortState | null;
  onSort: (key: string) => void;
  align?: 'left' | 'center' | 'right';
  className?: string;
}> = ({ label, sortKey, sort, onSort, align = 'left', className = '' }) => {
  const isSorted = sort?.key === sortKey;
  const alignCls = align === 'right' ? 'justify-end text-right' : align === 'center' ? 'justify-center text-center' : 'justify-start text-left';

  return (
    <th
      onClick={() => onSort(sortKey)}
      className={`cursor-pointer select-none py-3 px-3 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-gray-100 dark:text-white dark:hover:bg-meta-4 ${className}`}
    >
      <div className={`flex items-center gap-1.5 ${alignCls}`}>
        <span>{label}</span>
        {isSorted ? (
          sort.dir === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5 text-primary" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 text-primary" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100" />
        )}
      </div>
    </th>
  );
};

/**
 * Numeric Cell with format
 */
export const NumCell: React.FC<{
  value: number | string;
  prefix?: string;
  className?: string;
}> = ({ value, prefix = '', className = '' }) => {
  const num = typeof value === 'number' ? value.toLocaleString() : value;
  return (
    <td className={`py-3 px-3 text-right text-xs font-medium text-black dark:text-white ${className}`}>
      {prefix}{num}
    </td>
  );
};

/**
 * Action Icon Button
 */
export const IconAction: React.FC<{
  icon?: React.ReactNode;
  children?: React.ReactNode;
  title?: string;
  onClick?: (e?: any) => void;
  tone?: 'primary' | 'danger' | 'success' | 'default';
  disabled?: boolean;
}> = ({ icon, children, title, onClick, tone = 'default', disabled = false }) => {
  let color = 'text-gray-500 hover:text-black dark:hover:text-white';
  if (tone === 'primary') color = 'text-primary hover:text-primary/80';
  if (tone === 'danger') color = 'text-meta-1 hover:text-red-700';
  if (tone === 'success') color = 'text-meta-3 hover:text-green-700';

  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`p-1.5 rounded transition hover:bg-gray-100 dark:hover:bg-meta-4 cursor-pointer ${color} ${
        disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
      }`}
    >
      {icon || children}
    </button>
  );
};

/**
 * List Header Toolbar
 */
export const ListToolbar: React.FC<{
  title?: string;
  count?: number;
  onAdd?: () => void;
  addLabel?: string;
  search?: string;
  onSearchChange?: (s: string) => void;
  searchPlaceholder?: string;
  actions?: React.ReactNode;
  exportColumns?: ExportColumn[];
  exportData?: any[];
  exportFilename?: string;
}> = ({
  title,
  count,
  onAdd,
  addLabel = 'Add New',
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  actions,
  exportColumns,
  exportData,
  exportFilename = 'export'
}) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
      {title && (
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-black dark:text-white">{title}</h2>
          {count !== undefined && (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 dark:bg-meta-4 dark:text-gray-200">
              {count}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 ml-auto">
        {onSearchChange && (
          <SearchBox
            value={search}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
          />
        )}

        {actions}

        {exportColumns && exportData && (
          <ExportPair
            columns={exportColumns}
            data={exportData}
            filename={exportFilename}
          />
        )}

        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-4 text-center text-xs font-semibold text-white transition hover:bg-opacity-90"
          >
            + {addLabel}
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Form Footer
 */
export const FormFooter: React.FC<{
  onCancel?: () => void;
  onClose?: () => void;
  onSave?: () => void;
  onSubmit?: () => void;
  saving?: boolean;
  disabled?: boolean;
  saveLabel?: string;
  submitLabel?: string;
  className?: string;
}> = ({
  onCancel,
  onClose,
  onSave,
  onSubmit,
  saving = false,
  disabled = false,
  saveLabel,
  submitLabel = 'Save',
  className = '',
}) => {
  const handleCancel = onCancel || onClose;
  const handleSave = onSave || onSubmit;
  const label = saveLabel || submitLabel;

  return (
    <div className={`mt-6 flex items-center justify-end gap-3 border-t border-stroke pt-4 dark:border-strokedark ${className}`}>
      {handleCancel && (
        <button
          type="button"
          onClick={handleCancel}
          disabled={saving}
          className="rounded border border-stroke px-5 py-2 text-xs font-semibold text-black transition hover:bg-gray-100 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
        >
          Cancel
        </button>
      )}
      <button
        type={handleSave ? 'button' : 'submit'}
        onClick={handleSave}
        disabled={saving || disabled}
        className="inline-flex items-center justify-center rounded bg-primary px-6 py-2 text-xs font-semibold text-white transition hover:bg-opacity-90 disabled:opacity-50"
      >
        {saving ? 'Saving...' : label}
      </button>
    </div>
  );
};

/**
 * Export Excel and CSV Buttons Pair
 */
export const ExportPair: React.FC<{
  columns?: ExportColumn[];
  data?: any[];
  rows?: any[];
  filename?: string;
  title?: string;
  subtitle?: string;
  landscape?: boolean;
  footer?: any;
}> = ({ columns = [], data, rows, filename = 'export' }) => {
  const exportData = Array.isArray(data) ? data : Array.isArray(rows) ? rows : [];
  const cols = Array.isArray(columns) ? columns : [];

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        title="Export Excel (.xlsx)"
        onClick={() => exportTableToExcel(cols, exportData, `${filename}.xlsx`)}
        className="inline-flex items-center gap-1 rounded border border-stroke bg-white px-2.5 py-1.5 text-xs font-semibold text-black transition hover:bg-gray-100 dark:border-strokedark dark:bg-boxdark dark:text-white dark:hover:bg-meta-4"
      >
        <Download className="h-3.5 w-3.5 text-meta-3" />
        <span>Excel</span>
      </button>
      <button
        type="button"
        title="Export CSV (.csv)"
        onClick={() => exportTableToCsv(cols, exportData, `${filename}.csv`)}
        className="inline-flex items-center gap-1 rounded border border-stroke bg-white px-2.5 py-1.5 text-xs font-semibold text-black transition hover:bg-gray-100 dark:border-strokedark dark:bg-boxdark dark:text-white dark:hover:bg-meta-4"
      >
        <Download className="h-3.5 w-3.5 text-primary" />
        <span>CSV</span>
      </button>
    </div>
  );
};

/**
 * Empty Table State
 */
export const TableEmpty: React.FC<{
  message?: string;
  colSpan?: number;
}> = ({ message = 'No records found matching criteria', colSpan = 8 }) => {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center text-xs text-gray-500 dark:text-gray-400">
        <div className="flex flex-col items-center justify-center gap-2">
          <AlertCircle className="h-8 w-8 text-gray-300 dark:text-gray-600" />
          <span>{message}</span>
        </div>
      </td>
    </tr>
  );
};
