import React, { useState, useEffect, useRef } from 'react';
import { MdClose } from 'react-icons/md';

interface AppComboboxProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  allowCustom?: boolean;
}

export const AppCombobox: React.FC<AppComboboxProps> = ({
  value,
  onChange,
  options = [],
  placeholder = 'Select or type...',
  required = false,
  disabled = false,
  className = '',
  allowCustom = true
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync internal state with external value changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on query
  const filteredOptions = (options || []).filter(o =>
    String(o || '').toLowerCase().includes(inputValue.toLowerCase().trim())
  );

  const showCustomOption = !!(
    allowCustom &&
    inputValue.trim() &&
    !options.some(o => o?.toLowerCase() === inputValue.trim().toLowerCase())
  );

  const totalOptions = filteredOptions.length + (showCustomOption ? 1 : 0);

  // Auto-scroll dropdown to follow highlighted item
  useEffect(() => {
    if (isDropdownOpen && listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${highlightedIndex}"]`) as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isDropdownOpen]);

  const handleSelectOption = (opt: string) => {
    setInputValue(opt);
    onChange(opt);
    setIsDropdownOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setInputValue('');
    onChange('');
    if (!disabled) {
      setIsDropdownOpen(true);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <input
        type="text"
        autoComplete="off"
        disabled={disabled}
        required={required}
        value={inputValue}
        placeholder={placeholder}
        onChange={(e) => {
          if (disabled) return;
          const val = e.target.value;
          setInputValue(val);
          onChange(val);
          setIsDropdownOpen(true);
          setHighlightedIndex(0);
        }}
        onFocus={() => {
          if (!disabled) {
            setIsDropdownOpen(true);
            setHighlightedIndex(0);
          }
        }}
        onBlur={() => {
          setTimeout(() => {
            setIsDropdownOpen(false);
          }, 200);
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!isDropdownOpen) {
              setIsDropdownOpen(true);
              return;
            }
            if (totalOptions > 0) {
              setHighlightedIndex(prev => (prev < totalOptions - 1 ? prev + 1 : 0));
            }
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (totalOptions > 0) {
              setHighlightedIndex(prev => (prev > 0 ? prev - 1 : totalOptions - 1));
            }
          } else if (e.key === 'Enter') {
            e.preventDefault();
            if (showCustomOption && highlightedIndex === filteredOptions.length) {
              handleSelectOption(inputValue.trim());
            } else if (filteredOptions.length > 0) {
              const selected = filteredOptions[highlightedIndex] || filteredOptions[0];
              handleSelectOption(selected);
            } else if (inputValue.trim() && allowCustom) {
              handleSelectOption(inputValue.trim());
            }
          } else if (e.key === 'Tab' || e.key === 'Escape') {
            setIsDropdownOpen(false);
          }
        }}
        className={`w-full rounded-xl border p-2.5 pr-7 text-xs font-semibold outline-none transition ${
          disabled
            ? 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed select-none'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500/30'
        }`}
      />

      {/* Clear (x) button */}
      {!disabled && inputValue && (
        <button
          type="button"
          tabIndex={-1}
          title="Clear"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
        >
          <MdClose className="text-xs" />
        </button>
      )}

      {/* Dropdown Popup */}
      {!disabled && isDropdownOpen && (
        <div
          ref={listRef}
          className="absolute left-0 top-full mt-1 z-[9999999] w-full min-w-[220px] max-h-[220px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A222C] shadow-2xl divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => {
              const isHighlighted = idx === highlightedIndex;
              const isSelected = value?.toLowerCase() === opt.toLowerCase();

              return (
                <div
                  key={`${opt}-${idx}`}
                  data-index={idx}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectOption(opt);
                  }}
                  className={`p-2.5 px-3 cursor-pointer transition text-xs font-semibold flex items-center justify-between ${
                    isHighlighted || isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span className="truncate">{opt}</span>
                  {isSelected && (
                    <span className="text-[10px] text-emerald-600 font-bold">Selected</span>
                  )}
                </div>
              );
            })
          ) : null}

          {/* Custom entry option */}
          {showCustomOption && (
            <div
              data-index={filteredOptions.length}
              onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelectOption(inputValue.trim());
              }}
              className={`p-2.5 px-3 text-xs font-semibold cursor-pointer transition flex items-center justify-between ${
                highlightedIndex === filteredOptions.length
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>+ Use "{inputValue.trim()}"</span>
              <span className="text-[10px] text-slate-400 font-normal">Custom</span>
            </div>
          )}

          {filteredOptions.length === 0 && !showCustomOption && (
            <div className="p-3 text-center text-xs text-slate-400 italic">
              No matching options
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppCombobox;
