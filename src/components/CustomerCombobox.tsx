import React, { useState, useEffect, useRef } from 'react';
import { MdClose, MdPersonAdd } from 'react-icons/md';
import { supabase } from '../Context/supabaseClient';
import { toast } from 'react-hot-toast';

export interface CustomerComboboxItem {
  id?: string | number;
  name: string;
  phone?: string;
  source?: string;
}

interface CustomerComboboxProps {
  value: string;
  phone?: string;
  onChange: (customerName: string, phone?: string) => void;
  options: CustomerComboboxItem[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  onCustomerCreated?: (newCustomer: CustomerComboboxItem) => void;
}

export const CustomerCombobox: React.FC<CustomerComboboxProps> = ({
  value,
  phone = '',
  onChange,
  options,
  placeholder = 'Search customer or enter project...',
  required = false,
  className = '',
  onCustomerCreated
}) => {
  const [customerInput, setCustomerInput] = useState(value || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll dropdown container to follow highlighted item
  useEffect(() => {
    if (isDropdownOpen && listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${highlightedIndex}"]`) as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isDropdownOpen]);

  // Sync internal state with external value changes
  useEffect(() => {
    setCustomerInput(value || '');
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

  const filteredOptions = options.filter(c =>
    (c.name || '').toLowerCase().includes(customerInput.toLowerCase().trim())
  );

  const showAddOption = !!(
    customerInput.trim() &&
    !options.some(c => c.name?.toLowerCase() === customerInput.trim().toLowerCase())
  );

  const totalOptions = filteredOptions.length + (showAddOption ? 2 : 0);

  const handleSelectOption = (item: CustomerComboboxItem) => {
    setCustomerInput(item.name);
    onChange(item.name, item.phone || '');
    setIsDropdownOpen(false);
  };

  const handleSelectCustom = (customName: string) => {
    setCustomerInput(customName);
    const match = options.find(c => c.name.toLowerCase() === customName.toLowerCase().trim());
    onChange(customName, match?.phone || '');
    setIsDropdownOpen(false);
  };

  const handleSaveToDatabase = async (name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;

    try {
      const payload: any = {
        customerName: cleanName,
        customername: cleanName,
        primaryPhone: phone || '',
        phone: phone || '',
        company: 'CRM / Walk-in'
      };

      const { data, error } = await supabase
        .from('customers')
        .insert([payload])
        .select();

      if (error) {
        toast.error('Failed to save to database: ' + error.message);
        return;
      }

      toast.success(`Customer "${cleanName}" permanently registered!`);
      const newOption: CustomerComboboxItem = {
        id: data?.[0]?.id,
        name: cleanName,
        phone: phone || '',
        source: 'Registered Customer'
      };
      if (onCustomerCreated) {
        onCustomerCreated(newOption);
      }
      setCustomerInput(cleanName);
      onChange(cleanName, phone);
      setIsDropdownOpen(false);
    } catch (err: any) {
      toast.error('Error saving customer: ' + err.message);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <input
        type="text"
        autoComplete="off"
        value={customerInput}
        required={required}
        onChange={(e) => {
          const val = e.target.value;
          setCustomerInput(val);
          onChange(val);
          setIsDropdownOpen(true);
          setHighlightedIndex(0);

          // If exact match found, populate phone
          const match = options.find(c => c.name?.toLowerCase() === val.toLowerCase().trim());
          if (match && match.phone) {
            onChange(val, match.phone);
          }
        }}
        onFocus={() => {
          setIsDropdownOpen(true);
          setHighlightedIndex(0);
        }}
        onBlur={() => {
          // Commit whatever was typed so free typing works smoothly
          if (customerInput.trim()) {
            const match = options.find(c => c.name?.toLowerCase() === customerInput.toLowerCase().trim());
            onChange(customerInput.trim(), match?.phone || '');
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
              handleSelectCustom(customerInput.trim());
            } else if (showAddOption && highlightedIndex === filteredOptions.length + 1) {
              handleSaveToDatabase(customerInput.trim());
            } else if (filteredOptions.length > 0) {
              const selected = filteredOptions[highlightedIndex] || filteredOptions[0];
              handleSelectOption(selected);
            } else if (customerInput.trim()) {
              handleSelectCustom(customerInput.trim());
            }
          } else if (e.key === 'Tab' || e.key === 'Escape') {
            setIsDropdownOpen(false);
          }
        }}
        className="w-full border border-stroke rounded-lg p-2.5 pr-8 bg-transparent dark:border-strokedark outline-none focus:border-emerald-600 text-black dark:text-white font-semibold text-xs h-[42px]"
        placeholder={placeholder}
      />

      {/* Clear (x) button when a value exists */}
      {customerInput && (
        <button
          type="button"
          title="Clear Customer"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCustomerInput('');
            onChange('', '');
            setIsDropdownOpen(true);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
        >
          <MdClose className="text-sm" />
        </button>
      )}

      {/* Searchable Dropdown Popup */}
      {isDropdownOpen && (
        <div ref={listRef} className="absolute left-0 top-full mt-1.5 z-[999999] w-full min-w-[240px] max-h-[250px] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A222C] shadow-2xl divide-y divide-slate-100 dark:divide-slate-800 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
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
                  className={`p-2.5 px-3 cursor-pointer transition text-xs font-bold flex items-center justify-between group ${
                    isHighlighted || isSelected
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex flex-col truncate mr-2">
                    <span className="truncate">{item.name}</span>
                    {item.phone && (
                      <span className="text-[10px] text-slate-400 font-normal font-mono">
                        {item.phone}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.source && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        {item.source}
                      </span>
                    )}
                    {isSelected && (
                      <span className="text-[10px] text-emerald-600 font-semibold">Selected</span>
                    )}
                  </div>
                </div>
              );
            })
          ) : null}

          {/* Inline + Add custom option or register permanently in database */}
          {showAddOption && (
            <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
              <div
                data-index={filteredOptions.length}
                onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
                className={`p-2.5 px-3 text-xs font-semibold cursor-pointer transition flex items-center justify-between ${
                  highlightedIndex === filteredOptions.length
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectCustom(customerInput.trim());
                }}
              >
                <span>+ Use "{customerInput.trim()}" for this form</span>
                <span className="text-[10px] text-slate-400 font-normal">Form Only</span>
              </div>

              <div
                data-index={filteredOptions.length + 1}
                onMouseEnter={() => setHighlightedIndex(filteredOptions.length + 1)}
                className={`p-2.5 px-3 text-xs font-bold cursor-pointer transition flex items-center justify-between ${
                  highlightedIndex === filteredOptions.length + 1
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold'
                    : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSaveToDatabase(customerInput.trim());
                }}
              >
                <span className="flex items-center gap-1.5">
                  <MdPersonAdd size={15} />
                  <span>Register "{customerInput.trim()}" in Database</span>
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                  Permanent
                </span>
              </div>
            </div>
          )}

          {filteredOptions.length === 0 && !showAddOption && (
            <div className="p-3 text-center text-xs text-slate-400 italic">
              Start typing to search or enter customer...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerCombobox;
