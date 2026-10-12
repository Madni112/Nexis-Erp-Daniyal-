import React, { useState, useEffect, useRef } from 'react';
import { MdClose, MdPlaylistAdd } from 'react-icons/md';

export interface ProductComboboxItem {
  id?: string | number;
  name: string;
  rate: number;
  category?: string;
  sub_category?: string;
  scenario_name?: string;
  item_type?: string;
  uom?: string;
  pcs_per_box?: number;
}

interface ProductComboboxProps {
  value: string;
  onChange: (productName: string, rate?: number) => void;
  options: ProductComboboxItem[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  onRequestAddProduct?: (typedName: string) => void;
  customLabel?: (val: string) => string;
}

export const ProductCombobox: React.FC<ProductComboboxProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select product or type custom...',
  required = false,
  className = '',
  onRequestAddProduct,
  customLabel
}) => {
  const [itemInput, setItemInput] = useState(value || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync internal state with external value changes
  useEffect(() => {
    setItemInput(value || '');
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
  const filteredOptions = options.filter(p =>
    (p.name || '').toLowerCase().includes(itemInput.toLowerCase().trim())
  );

  const showAddOption = !!(
    itemInput.trim() &&
    !options.some(p => p.name?.toLowerCase() === itemInput.trim().toLowerCase())
  );

  const totalOptions = filteredOptions.length + (showAddOption ? 2 : 0);

  // Auto-scroll dropdown to follow highlighted item
  useEffect(() => {
    if (isDropdownOpen && listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${highlightedIndex}"]`) as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isDropdownOpen]);

  const handleSelectOption = (item: ProductComboboxItem) => {
    setItemInput(item.name);
    onChange(item.name, item.rate);
    setIsDropdownOpen(false);
  };

  const handleSelectCustom = (customName: string) => {
    setItemInput(customName);
    onChange(customName);
    setIsDropdownOpen(false);
  };

  const handleTriggerRegisterModal = (customName: string) => {
    setIsDropdownOpen(false);
    if (onRequestAddProduct) {
      onRequestAddProduct(customName);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <input
        type="text"
        autoComplete="off"
        value={itemInput}
        required={required}
        onChange={(e) => {
          const val = e.target.value;
          setItemInput(val);
          onChange(val);
          setIsDropdownOpen(true);
          setHighlightedIndex(0);

          // If exact match found, populate rate
          const match = options.find(p => p.name?.toLowerCase() === val.toLowerCase().trim());
          if (match && match.rate > 0) {
            onChange(val, match.rate);
          }
        }}
        onFocus={() => {
          setIsDropdownOpen(true);
          setHighlightedIndex(0);
        }}
        onBlur={() => {
          if (itemInput.trim()) {
            onChange(itemInput.trim());
          }
          setTimeout(() => {
            setIsDropdownOpen(false);
          }, 200);
        }}
        onKeyDown={(e) => {
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
            if (showAddOption && highlightedIndex === filteredOptions.length) {
              handleSelectCustom(itemInput.trim());
            } else if (showAddOption && highlightedIndex === filteredOptions.length + 1) {
              handleTriggerRegisterModal(itemInput.trim());
            } else if (filteredOptions.length > 0) {
              const selected = filteredOptions[highlightedIndex] || filteredOptions[0];
              handleSelectOption(selected);
            } else if (itemInput.trim()) {
              handleSelectCustom(itemInput.trim());
            }
          } else if (e.key === 'Tab' || e.key === 'Escape') {
            setIsDropdownOpen(false);
          }
        }}
        className="w-full px-2.5 py-1.5 pr-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
        placeholder={placeholder}
      />

      {/* Clear (x) button when input has value */}
      {itemInput && (
        <button
          type="button"
          title="Clear Item"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setItemInput('');
            onChange('', 0);
            setIsDropdownOpen(true);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
        >
          <MdClose className="text-xs" />
        </button>
      )}

      {/* Searchable Dropdown Popup */}
      {isDropdownOpen && (
        <div
          ref={listRef}
          className="absolute left-0 top-full mt-1 z-[999999] w-full min-w-[260px] max-h-[220px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A222C] shadow-2xl divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((item, idx) => {
              const isHighlighted = idx === highlightedIndex;
              const isSelected = value?.toLowerCase() === item.name.toLowerCase();

              return (
                <div
                  key={`${item.name}-${idx}`}
                  data-index={idx}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelectOption(item);
                  }}
                  className={`p-2 px-2.5 cursor-pointer transition text-xs font-semibold flex items-center justify-between group ${
                    isHighlighted || isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex flex-col truncate mr-2">
                    <span className="truncate">{item.name}</span>
                    {item.category && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        {item.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.rate > 0 && (
                      <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
                        Rs. {item.rate.toLocaleString()}
                      </span>
                    )}
                    {isSelected && (
                      <span className="text-[10px] text-emerald-600 font-bold">Selected</span>
                    )}
                  </div>
                </div>
              );
            })
          ) : null}

          {/* Inline + Add custom option or open modal to register in Item List */}
          {showAddOption && (
            <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              <div
                data-index={filteredOptions.length}
                onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
                className={`p-2 px-2.5 text-xs font-semibold cursor-pointer transition flex items-center justify-between ${
                  highlightedIndex === filteredOptions.length
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelectCustom(itemInput.trim());
                }}
              >
                <span>{customLabel ? customLabel(itemInput.trim()) : `+ Use "${itemInput.trim()}" as custom item`}</span>
                <span className="text-[10px] text-slate-400 font-normal">Custom Line</span>
              </div>

              <div
                data-index={filteredOptions.length + 1}
                onMouseEnter={() => setHighlightedIndex(filteredOptions.length + 1)}
                className={`p-2 px-2.5 text-xs font-bold cursor-pointer transition flex items-center justify-between ${
                  highlightedIndex === filteredOptions.length + 1
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold'
                    : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleTriggerRegisterModal(itemInput.trim());
                }}
              >
                <span className="flex items-center gap-1.5">
                  <MdPlaylistAdd size={16} />
                  <span>Register "{itemInput.trim()}" in Item List</span>
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                  Open Add Modal
                </span>
              </div>
            </div>
          )}

          {filteredOptions.length === 0 && !showAddOption && (
            <div className="p-3 text-center text-xs text-slate-400 italic">
              Start typing to search or enter item...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductCombobox;
