import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../ui/Spinner';
import { useTenant } from '../../context/TenantContext';
import { isoDay } from '../../utils/dateRange';
import {
  Employee,
  saveEmployee,
  updateEmployee,
  syncEmployeeCOA
} from '../../services/hr.service';
import {
  MdArrowBack,
  MdPerson,
  MdWork,
  MdSave,
  MdClose,
  MdArrowDropDown,
  MdAdd
} from 'react-icons/md';

const DEFAULT_DESIGNATIONS = [
  'Manager',
  'Salesman',
  'Accountant',
  'Driver',
  'Warehouse Staff',
  'Helper',
  'Staff',
  'Officer'
];

const AddEmployee: React.FC = () => {
  const { tenantSlug, branchId } = useTenant();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract edit employee if passed via route state
  const editData = location.state?.employee as Employee | undefined;
  const isEditMode = !!editData;

  const [loading, setLoading] = useState(false);
  const [designations, setDesignations] = useState<{ id?: number; name: string }[]>([]);
  const [coaAccounts, setCoaAccounts] = useState<any[]>([]);
  const [showDesigDropdown, setShowDesigDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const desigDropdownRef = useRef<HTMLDivElement>(null);
  const activeOptionRef = useRef<HTMLDivElement>(null);

  // Simple Form State
  const [formData, setFormData] = useState({
    name: editData?.name || '',
    fatherName: editData?.fatherName || '',
    cnic: editData?.cnic || '',
    phone: editData?.phone || '',
    city: editData?.city || '',
    address: editData?.address || '',
    code: editData?.code || '',
    departmentId: editData?.departmentId || null,
    departmentName: editData?.departmentName || '',
    designationId: editData?.designationId || null,
    designationName: editData?.designationName || '',
    status: editData?.status || 'Active',
    joiningDate: editData?.joiningDate || isoDay(),
    basicSalary: editData?.basicSalary || 0,
    accountCode: (editData as any)?.account_code || (editData as any)?.accountCode || ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Handle click outside to close designation dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (desigDropdownRef.current && !desigDropdownRef.current.contains(e.target as Node)) {
        setShowDesigDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll active option into view
  useEffect(() => {
    if (activeOptionRef.current) {
      activeOptionRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const fetchInitialData = async () => {
    try {
      const [desigRes, empRes, coaRes] = await Promise.all([
        supabase.from('hr_designations').select('id, name').order('name'),
        supabase.from('hr_employees').select('designation_name'),
        supabase.from('chart_of_accounts').select('*')
      ]);

      const baseList = desigRes.data || [];
      const empDesigs = (empRes.data || [])
        .map((e: any) => (e.designation_name || '').trim())
        .filter(Boolean);

      const uniqueNames = new Set<string>();
      const combined: { id?: number; name: string }[] = [];

      // 1. Add Default Designations
      DEFAULT_DESIGNATIONS.forEach((name) => {
        uniqueNames.add(name.toLowerCase());
        combined.push({ name });
      });

      // 2. Add from hr_designations table
      baseList.forEach((d) => {
        if (d.name && !uniqueNames.has(d.name.toLowerCase())) {
          uniqueNames.add(d.name.toLowerCase());
          combined.push(d);
        }
      });

      // 3. Add from hr_employees table
      empDesigs.forEach((name) => {
        if (!uniqueNames.has(name.toLowerCase())) {
          uniqueNames.add(name.toLowerCase());
          combined.push({ name });
        }
      });

      setDesignations(combined);

      if (coaRes.data) {
        setCoaAccounts(coaRes.data);
        if (isEditMode && editData) {
          const directCode = (editData.accountCode || (editData as any).account_code || '').trim();
          if (directCode) {
            setFormData((prev) => ({
              ...prev,
              accountCode: directCode
            }));
          }
        } else if (!formData.accountCode) {
          // Collect all assigned 2030-xxx numbers from Chart of Accounts, DB Employees, and Local Cache
          const usedNumbers = new Set<number>();
          const employeeList: any[] = empRes.data || [];

          // 1. From chart of accounts
          (coaRes.data || []).forEach((a: any) => {
            const code = String(a.account_code || '').trim();
            const match = code.match(/^2030-(\d+)$/);
            if (match) {
              usedNumbers.add(parseInt(match[1], 10));
            }
          });

          // 2. From database employees
          employeeList.forEach((e: any) => {
            const code = String(e.account_code || e.accountCode || '').trim();
            const match = code.match(/^2030-(\d+)$/);
            if (match) {
              usedNumbers.add(parseInt(match[1], 10));
            }
          });

          // 3. From local storage cache
          try {
            const raw = localStorage.getItem('zac_hr_employees');
            if (raw) {
              const cached = JSON.parse(raw);
              if (Array.isArray(cached)) {
                cached.forEach((e: any) => {
                  const code = String(e.account_code || e.accountCode || '').trim();
                  const match = code.match(/^2030-(\d+)$/);
                  if (match) {
                    usedNumbers.add(parseInt(match[1], 10));
                  }
                });
              }
            }
          } catch (_) {}

          // Find first unused sequential number starting from 1 (2030-001, 2030-002, ...)
          let nextNum = 1;
          while (usedNumbers.has(nextNum)) {
            nextNum++;
          }

          setFormData((prev) => ({
            ...prev,
            accountCode: `2030-${String(nextNum).padStart(3, '0')}`
          }));
        }
      }
    } catch (_) {
      // Graceful fallback
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDeleteCustomDesignation = async (
    e: React.MouseEvent,
    desigName: string,
    id?: number
  ) => {
    e.stopPropagation();
    try {
      if (id) {
        await supabase.from('hr_designations').delete().eq('id', id);
      } else {
        await supabase.from('hr_designations').delete().ilike('name', desigName);
      }

      setDesignations((prev) =>
        prev.filter((d) => d.name.toLowerCase() !== desigName.toLowerCase())
      );

      if (formData.designationName.toLowerCase() === desigName.toLowerCase()) {
        setFormData((prev) => ({ ...prev, designationName: '', designationId: null }));
      }

      toast.success(`Removed "${desigName}" from designations list`);
    } catch (err: any) {
      toast.error('Failed to remove designation: ' + err.message);
    }
  };

  const isDefaultDesignation = (name: string) => {
    return DEFAULT_DESIGNATIONS.some(
      (def) => def.toLowerCase() === (name || '').trim().toLowerCase()
    );
  };

  const filteredDesignations = useMemo(() => {
    const q = (formData.designationName || '').toLowerCase().trim();
    if (!q) return designations;
    return designations.filter((d) => d.name.toLowerCase().includes(q));
  }, [designations, formData.designationName]);

  const typedDesig = (formData.designationName || '').trim();
  const hasExactDesigMatch = useMemo(() => {
    return designations.some((d) => d.name.toLowerCase() === typedDesig.toLowerCase());
  }, [designations, typedDesig]);

  const showAddPrompt = typedDesig && !hasExactDesigMatch;

  // Unified list of options for keyboard navigation
  const dropdownOptions = useMemo(() => {
    const list: { isAdd?: boolean; name: string; id?: number }[] = [];
    if (showAddPrompt) {
      list.push({ isAdd: true, name: typedDesig });
    }
    filteredDesignations.forEach((d) => {
      list.push({ isAdd: false, name: d.name, id: d.id });
    });
    return list;
  }, [showAddPrompt, typedDesig, filteredDesignations]);

  const handleSelectOption = (option: { isAdd?: boolean; name: string; id?: number }) => {
    if (option.isAdd) {
      setDesignations((prev) => [{ name: option.name }, ...prev]);
      setFormData((prev) => ({
        ...prev,
        designationName: option.name,
        designationId: null
      }));
      toast.success(`Added "${option.name}" to designations`);
    } else {
      setFormData((prev) => ({
        ...prev,
        designationName: option.name,
        designationId: option.id || null
      }));
    }
    setShowDesigDropdown(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!showDesigDropdown) {
        setShowDesigDropdown(true);
        setHighlightedIndex(0);
      } else if (dropdownOptions.length > 0) {
        setHighlightedIndex((prev) => (prev < dropdownOptions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!showDesigDropdown) {
        setShowDesigDropdown(true);
        setHighlightedIndex(dropdownOptions.length - 1);
      } else if (dropdownOptions.length > 0) {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : dropdownOptions.length - 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showDesigDropdown && dropdownOptions.length > 0) {
        const selected = dropdownOptions[highlightedIndex] || dropdownOptions[0];
        if (selected) {
          handleSelectOption(selected);
        }
      } else if (typedDesig) {
        setShowDesigDropdown(false);
      }
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setShowDesigDropdown(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Employee Full Name is required');
      return;
    }

    try {
      setLoading(true);

      const cleanCode = formData.accountCode.trim();
      if (cleanCode) {
        // 1. Check if the code already belongs to another account in Chart of Accounts
        const existingCOA = coaAccounts.find(
          (a) => String(a.account_code || '').trim().toLowerCase() === cleanCode.toLowerCase()
        );

        const currentEditName = (editData?.name || '').trim().toLowerCase();
        const currentEditCode = (editData?.accountCode || (editData as any)?.account_code || '').trim().toLowerCase();

        if (existingCOA) {
          const accTitle = (existingCOA.account_title || '').trim();
          const isSelf =
            isEditMode &&
            (currentEditCode === cleanCode.toLowerCase() ||
              accTitle.toLowerCase() === currentEditName);

          if (!isSelf) {
            const catCode =
              existingCOA.control_code ||
              existingCOA.category_code ||
              existingCOA.sub_category_code ||
              'Salaries Payable';
            toast(
              `This Chart of Account '${cleanCode}' already exists for '${accTitle || 'Existing Account'}' in '${catCode}' category code.`,
              {
                icon: '⚠️',
                duration: 5000,
                style: {
                  borderRadius: '8px',
                  background: '#1e293b',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: '500'
                }
              }
            );
            setLoading(false);
            return;
          }
        }
      }

      const empPayload: any = {
        ...formData,
        id: editData?.id,
        branchId: branchId || 1,
        basicSalary: Number(formData.basicSalary) || 0,
        gross: Number(formData.basicSalary) || 0,
        net: Number(formData.basicSalary) || 0,
        isActive: true
      };

      // 1. Save or Update Employee
      if (isEditMode && editData) {
        await updateEmployee(empPayload as Employee, tenantSlug);
      } else {
        await saveEmployee(empPayload as Employee, tenantSlug);
      }

      // 2. Auto-save new designation to database so it stays in the list
      const cleanDesig = (formData.designationName || '').trim();
      if (cleanDesig) {
        const exists = designations.some(
          (d) => d.name.toLowerCase() === cleanDesig.toLowerCase()
        );
        if (!exists) {
          try {
            await supabase.from('hr_designations').insert([{ name: cleanDesig }]);
          } catch (_) {}
        }
      }

      // 3. Link or update single Chart of Account Code in place
      if (cleanCode) {
        const empName = formData.name.trim();
        const oldCode = (editData?.accountCode || (editData as any)?.account_code || '').trim();
        await syncEmployeeCOA(empName, cleanCode, oldCode);
      }

      toast.success(
        isEditMode
          ? `Employee "${formData.name}" updated successfully!`
          : `Employee "${formData.name}" registered successfully!`
      );

      navigate('/Human-Resources/Employees');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save employee profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/Human-Resources/Employees')}
            className="p-2 rounded-lg border border-stroke bg-white dark:border-strokedark dark:bg-boxdark hover:bg-gray-100 dark:hover:bg-meta-4 transition shadow-xs cursor-pointer text-black dark:text-white"
            title="Back to Employees"
          >
            <MdArrowBack size={20} />
          </button>
          <div>
            <h3 className="text-xl font-bold text-black dark:text-white">
              {isEditMode ? `Edit Employee — ${editData?.name}` : 'Add New Employee'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Enter employee profile, job details, and salary
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/Human-Resources/Employees')}
          className="px-4 py-2 text-xs font-semibold rounded border border-stroke dark:border-strokedark text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4 transition cursor-pointer"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── CARD 1: PERSONAL INFORMATION ── */}
        <div className="rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:p-6">
          <div className="flex items-center gap-2 border-b border-stroke pb-3 mb-4 dark:border-strokedark">
            <div className="p-1.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <MdPerson size={18} />
            </div>
            <h4 className="font-semibold text-black dark:text-white text-sm">Personal Information</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Full Name */}
            <div>
              <label className="block font-bold text-black dark:text-white mb-1">
                Full Name <span className="text-meta-1">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter full name"
                className="w-full rounded border border-stroke dark:border-strokedark px-3 py-2 bg-transparent text-black dark:text-white outline-none focus:border-primary"
              />
            </div>

            {/* Father Name */}
            <div>
              <label className="block font-bold text-black dark:text-white mb-1">
                Father / Husband Name
              </label>
              <input
                type="text"
                value={formData.fatherName}
                onChange={(e) => handleInputChange('fatherName', e.target.value)}
                placeholder="Enter father / husband name"
                className="w-full rounded border border-stroke dark:border-strokedark px-3 py-2 bg-transparent text-black dark:text-white outline-none focus:border-primary"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block font-bold text-black dark:text-white mb-1">Phone / Mobile #</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="0300-1234567"
                className="w-full rounded border border-stroke dark:border-strokedark px-3 py-2 bg-transparent text-black dark:text-white outline-none focus:border-primary"
              />
            </div>

            {/* CNIC */}
            <div>
              <label className="block font-bold text-black dark:text-white mb-1">CNIC / ID #</label>
              <input
                type="text"
                value={formData.cnic}
                onChange={(e) => handleInputChange('cnic', e.target.value)}
                placeholder="35201-1234567-1"
                className="w-full rounded border border-stroke dark:border-strokedark px-3 py-2 bg-transparent text-black dark:text-white outline-none focus:border-primary font-mono"
              />
            </div>

            {/* City */}
            <div>
              <label className="block font-bold text-black dark:text-white mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="e.g. Lahore, Karachi"
                className="w-full rounded border border-stroke dark:border-strokedark px-3 py-2 bg-transparent text-black dark:text-white outline-none focus:border-primary"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block font-bold text-black dark:text-white mb-1">Residential Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Address / area"
                className="w-full rounded border border-stroke dark:border-strokedark px-3 py-2 bg-transparent text-black dark:text-white outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* ── CARD 2: JOB, SALARY & ACCOUNT ── */}
        <div className="rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:p-6">
          <div className="flex items-center gap-2 border-b border-stroke pb-3 mb-4 dark:border-strokedark">
            <div className="p-1.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <MdWork size={18} />
            </div>
            <h4 className="font-semibold text-black dark:text-white text-sm">Job & Salary Details</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Employee # */}
            <div>
              <label className="block font-bold text-black dark:text-white mb-1">
                Employee # / Code
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                placeholder="Enter employee # / code"
                className="w-full rounded border border-stroke dark:border-strokedark px-3 py-2 bg-transparent text-black dark:text-white outline-none focus:border-primary font-mono font-bold"
              />
            </div>

            {/* Joining Date */}
            <div>
              <label className="block font-bold text-black dark:text-white mb-1">Joining Date</label>
              <input
                type="date"
                value={formData.joiningDate}
                onChange={(e) => handleInputChange('joiningDate', e.target.value)}
                className="w-full rounded border border-stroke dark:border-strokedark px-3 py-2 bg-transparent text-black dark:text-white outline-none focus:border-primary"
              />
            </div>

            {/* Designation / Role with Full Keyboard Navigation & Remove */}
            <div className="relative" ref={desigDropdownRef}>
              <label className="block font-bold text-black dark:text-white mb-1">
                Designation / Role
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.designationName}
                  onFocus={() => {
                    setShowDesigDropdown(true);
                    setHighlightedIndex(0);
                  }}
                  onChange={(e) => {
                    handleInputChange('designationName', e.target.value);
                    setShowDesigDropdown(true);
                    setHighlightedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Salesman, Accountant, Manager, Driver"
                  className="w-full rounded border border-stroke dark:border-strokedark px-3 py-2 pr-8 bg-transparent text-black dark:text-white outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowDesigDropdown((prev) => !prev);
                    setHighlightedIndex(0);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white cursor-pointer p-0.5"
                >
                  <MdArrowDropDown size={20} />
                </button>
              </div>

              {/* Suggestions Dropdown Menu */}
              {showDesigDropdown && dropdownOptions.length > 0 && (
                <div className="absolute left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-md border border-stroke bg-white py-1 shadow-lg dark:border-strokedark dark:bg-boxdark animate-fade-in">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-stroke dark:border-strokedark">
                    Select or Type Custom (Use &uarr; &darr; &crarr;)
                  </div>
                  {dropdownOptions.map((opt, index) => {
                    const isHighlighted = index === highlightedIndex;
                    const isCustom = !opt.isAdd && !isDefaultDesignation(opt.name);

                    if (opt.isAdd) {
                      return (
                        <div
                          key="add-prompt"
                          ref={isHighlighted ? activeOptionRef : null}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectOption(opt);
                          }}
                          onClick={() => handleSelectOption(opt)}
                          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold cursor-pointer border-b border-stroke dark:border-strokedark transition ${
                            isHighlighted
                              ? 'bg-primary text-white'
                              : 'text-primary bg-primary/5 hover:bg-primary/10 dark:bg-primary/15 dark:hover:bg-primary/25'
                          }`}
                        >
                          <MdAdd size={16} />
                          <span>Add &ldquo;{opt.name}&rdquo;</span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={opt.id ? `d-${opt.id}` : `name-${opt.name}-${index}`}
                        ref={isHighlighted ? activeOptionRef : null}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectOption(opt);
                        }}
                        onClick={() => handleSelectOption(opt)}
                        className={`flex items-center justify-between px-3 py-2 text-xs cursor-pointer group transition ${
                          isHighlighted
                            ? 'bg-primary text-white font-bold'
                            : 'hover:bg-gray-100 dark:hover:bg-meta-4/40 text-black dark:text-white'
                        }`}
                      >
                        <span className="font-medium">{opt.name}</span>
                        {isCustom ? (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCustomDesignation(e, opt.name, opt.id)}
                            className={`p-1 rounded transition cursor-pointer ${
                              isHighlighted
                                ? 'text-white/80 hover:text-white hover:bg-white/20'
                                : 'text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                            }`}
                            title={`Delete custom designation "${opt.name}"`}
                          >
                            <MdClose size={14} />
                          </button>
                        ) : (
                          <span
                            className={`text-[10px] ${
                              isHighlighted ? 'text-white/70' : 'text-gray-400 opacity-60'
                            }`}
                          >
                            default
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Basic Salary */}
            <div>
              <label className="block font-bold text-black dark:text-white mb-1">
                Basic Monthly Salary (Rs.)
              </label>
              <input
                type="number"
                min="0"
                value={formData.basicSalary}
                onChange={(e) => handleInputChange('basicSalary', e.target.value)}
                placeholder="0"
                className="w-full rounded border border-stroke dark:border-strokedark px-3 py-2 bg-transparent text-black dark:text-white outline-none focus:border-primary font-mono text-sm font-semibold"
              />
            </div>

            {/* Chart of Account Code */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-black dark:text-white mb-1">
                Chart of Account Code (Salaries Payable)
              </label>
              <input
                type="text"
                value={formData.accountCode}
                onChange={(e) => handleInputChange('accountCode', e.target.value)}
                placeholder="e.g. 2030-001"
                className="w-full rounded border border-stroke dark:border-strokedark px-3 py-2 bg-transparent text-emerald-600 dark:text-emerald-400 font-mono font-bold text-sm outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* ── ACTION FOOTER ── */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/Human-Resources/Employees')}
            className="px-6 py-2.5 rounded text-xs font-semibold border border-stroke dark:border-strokedark text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white px-8 py-2.5 rounded text-xs font-bold hover:bg-opacity-90 transition disabled:opacity-50 flex items-center gap-2 shadow-sm cursor-pointer"
          >
            {loading ? (
              <>
                <Spinner />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <MdSave size={16} />
                <span>{isEditMode ? 'Update Employee' : 'Save Employee'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEmployee;
