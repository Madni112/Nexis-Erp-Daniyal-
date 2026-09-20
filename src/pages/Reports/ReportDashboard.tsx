import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/Auth';
import {
  MdSearch,
  MdClear,
  MdTrendingUp,
  MdReceipt,
  MdBarChart,
  MdLocalMall,
  MdInventory,
  MdPauseCircleFilled,
  MdAccountBalanceWallet,
  MdAccountBalance,
  MdBalance,
  MdAssessment,
  MdLayers,
  MdPeople,
  MdStorefront,
  MdFileDownload,
  MdPrint,
  MdAccessTime,
  MdCheckCircle,
  MdArrowForward,
  MdCategory,
  MdCorporateFare,
  MdCardGiftcard,
  MdReceiptLong,
  MdDragIndicator,
  MdRestartAlt,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp
} from 'react-icons/md';
import { exportMultiSheetExcel, ExcelColumn } from '../../utils/excelExport';
import { toast } from 'react-hot-toast';

interface ReportItem {
  id: string;
  title: string;
  category: 'sales' | 'purchases' | 'inventory' | 'accounts' | 'business';
  description: string;
  badge?: string;
  badgeType?: 'new' | 'audited' | 'accrual';
  createdAt?: string; // ISO / YYYY-MM-DD date string
  path: string;
  state?: any;
  icon: any;
}

export const shouldShowBadge = (report: { badge?: string; badgeType?: string; createdAt?: string }): boolean => {
  if (!report.badge) return false;
  if (report.badgeType === 'new') {
    if (!report.createdAt) return true;
    const createdTime = new Date(report.createdAt).getTime();
    const now = Date.now();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    return Math.abs(now - createdTime) <= THIRTY_DAYS_MS;
  }
  return true;
};

const ALL_REPORTS: ReportItem[] = [
  // ── SALES REPORTS ──
  {
    id: 'category-wise-sales',
    title: 'Category-Wise Sales & Volume Report',
    category: 'sales',
    description: 'Header-wise category sales audit, product lines, net volumes, return credits, and revenue share.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-20',
    path: '/Reports/Sales-Report',
    state: { reportType: 'category-sales' },
    icon: MdCategory
  },
  {
    id: 'product-sales-history',
    title: 'Product Sales History Report',
    category: 'sales',
    description: 'Historical sales performance of products, market trends, units sold, returns, rates, and net revenue.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-19',
    path: '/Reports/Sales-Report',
    state: { reportType: 'product-sales-history' },
    icon: MdInventory
  },
  {
    id: 'sale-inv-detail',
    title: 'Sales Invoice Detail Report',
    category: 'sales',
    description: 'Line-level itemization including product items, quantities, UOM, and unit prices.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-17',
    path: '/Reports/Sales-Report',
    state: { reportType: 'invoice' },
    icon: MdReceipt
  },
  {
    id: 'commercial-sale-ledger',
    title: 'Commercial Sales Audit Ledger',
    category: 'sales',
    description: 'Master commercial sales register linked with salesman, carrier fleet & customer accounts.',
    badge: 'AUDITED',
    badgeType: 'audited',
    path: '/Reports/Sales-Report',
    state: { reportType: 'sale' },
    icon: MdTrendingUp
  },
  {
    id: 'sales-query-center',
    title: 'Sales Filter & Parameter Builder',
    category: 'sales',
    description: 'Custom multi-criteria query builder by customer, salesman, date window & categories.',
    path: '/Reports/Sales-Report',
    state: { reportType: 'sales-query' },
    icon: MdAssessment
  },
  {
    id: 'sales-return-ledger',
    title: 'Sales Return & Credit Ledger',
    category: 'sales',
    description: 'Chronological sales returns audit, credit adjustments, and restocked product logs.',
    path: '/Reports/Sales-Report',
    state: { reportType: 'return' },
    icon: MdLayers
  },
  {
    id: 'customer-sales-breakdown',
    title: 'Customer Sales & Volume Analysis',
    category: 'sales',
    description: 'Customer order cycles, top purchasing accounts, and credit settlement statuses.',
    path: '/Reports/Sales-Report',
    state: { reportType: 'customer-sales' },
    icon: MdPeople
  },
  {
    id: 'customer-loyalty-ledger',
    title: 'Customer Financial Statement & Invoice Ledger',
    category: 'sales',
    description: 'Audited chronological statement tracking sales invoices, cash settlements, and running net receivable balances per customer in PKR.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-17',
    path: '/Reports/Sales-Report',
    state: { reportType: 'loyalty' },
    icon: MdReceiptLong
  },

  // ── PURCHASES & PAYABLES ──
  {
    id: 'purchase-ledger',
    title: 'Purchase Invoice Register',
    category: 'purchases',
    description: 'Direct procurement entries and supplier bill liabilities categorized chronologically.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-17',
    path: '/Reports/Purchase-Report',
    state: { reportType: 'purchase' },
    icon: MdLocalMall
  },
  {
    id: 'purchase-query-center',
    title: 'Purchase Parameter Builder',
    category: 'purchases',
    description: 'Filter vendor inward purchases across date brackets, warehouse destinations and payment terms.',
    path: '/Reports/Purchase-Report',
    state: { reportType: 'purchase' },
    icon: MdBarChart
  },
  {
    id: 'vendor-return-ledger',
    title: 'Purchase Returns & Debit Ledger',
    category: 'purchases',
    description: 'Outgoing debit adjustments for damaged or returned supplier merchandise.',
    path: '/Reports/Purchase-Report',
    state: { reportType: 'return' },
    icon: MdCorporateFare
  },

  // ── INVENTORY & WAREHOUSES ──
  {
    id: 'current-stock-balance',
    title: 'Stock Balances & Valuation Registry',
    category: 'inventory',
    description: 'Real-time SKU quantities on hand, warehouse allocations, and unit asset valuations.',
    badge: 'AUDITED',
    badgeType: 'audited',
    path: '/Reports/Stock-Report',
    icon: MdInventory
  },
  {
    id: 'holding-stock-report',
    title: 'Holding Stock & Gatepass Queue',
    category: 'inventory',
    description: 'Reserved quantities allocated on approved delivery challans pending physical dispatch.',
    path: '/Reports/Holding-Report',
    icon: MdPauseCircleFilled
  },
  {
    id: 'warehouse-location-report',
    title: 'Warehouse Bin & Location Ledger',
    category: 'inventory',
    description: 'Product distribution audit broken down across Shop Counter vs Main Warehouse.',
    path: '/Reports/Stock-Report',
    icon: MdStorefront
  },

  // ── ACCOUNTS & TAXES ──
  {
    id: 'customer-balance-detail',
    title: 'Customer Balance Detail Report',
    category: 'accounts',
    description: 'Comprehensive breakdown of customer opening balances, period billing debits, recovery credits, and net closing balances filtered by customer category.',
    badge: 'NEW',
    badgeType: 'new',
    createdAt: '2026-09-18',
    path: '/Reports/Account-Report',
    state: { activeTab: 13 },
    icon: MdAccountBalanceWallet
  },
  {
    id: 'customer-vendor-ledger',
    title: 'Customer & Vendor Account Ledgers',
    category: 'accounts',
    description: 'Detailed debit/credit activity per party account with running closing balances.',
    badge: 'ACCRUAL',
    badgeType: 'accrual',
    path: '/Reports/Account-Report',
    icon: MdAccountBalanceWallet
  },
  {
    id: 'fbr-tax-report',
    title: 'Tax Collected on Sales (FBR Audit)',
    category: 'accounts',
    description: 'Output tax liabilities categorized by FBR retail scenarios and verified invoice tokens.',
    path: '/Reports/Sales-Report',
    state: { reportType: 'invoice' },
    icon: MdAssessment
  },
  {
    id: 'expense-ledger',
    title: 'Operational Expense Statement',
    category: 'accounts',
    description: 'Operating expenditures aggregated across rent, utilities, fuel, and logistics fleets.',
    path: '/Reports/Account-Report',
    icon: MdAccountBalance
  },

  // ── BUSINESS OVERVIEW & EXECUTIVE ──
  {
    id: 'balance-sheet-stat',
    title: 'Balance Sheet Financial Statement',
    category: 'business',
    description: 'Authoritative audit sheet of total assets, liabilities, and owners equity balances.',
    badge: 'AUDITED',
    badgeType: 'audited',
    path: '/Reports/Balance-Sheet',
    icon: MdBalance
  },
  {
    id: 'executive-summary-report',
    title: 'Commercial Executive Summary',
    category: 'business',
    description: 'High-level financial KPIs, sales vs purchase revenue trajectories, and liquid cash flows.',
    path: '/Reports/Balance-Sheet',
    icon: MdTrendingUp
  }
];

const CATEGORY_META = [
  {
    key: 'sales',
    title: 'Sales Reports',
    subtitle: 'Receivables, order cycles & customer ledger metrics',
    icon: MdTrendingUp,
    color: 'emerald'
  },
  {
    key: 'purchases',
    title: 'Purchases & Payables',
    subtitle: 'Vendor commitments, disbursement runs & AP schedules',
    icon: MdLocalMall,
    color: 'blue'
  },
  {
    key: 'inventory',
    title: 'Inventory & Stock',
    subtitle: 'Real-time valuation, physical counts & dispatch queues',
    icon: MdInventory,
    color: 'amber'
  },
  {
    key: 'accounts',
    title: 'Accounts & Taxes',
    subtitle: 'General ledger, statutory tax compliance & voucher trace',
    icon: MdAccountBalanceWallet,
    color: 'purple'
  },
  {
    key: 'business',
    title: 'Business Overview',
    subtitle: 'Executive statements, P&L balance & audit traces',
    icon: MdBalance,
    color: 'teal'
  }
];

const STORAGE_KEY = 'erp_reports_custom_order';
const STORAGE_CAT_KEY = 'erp_reports_category_order';

const getInitialReports = (): ReportItem[] => {
  try {
    const savedOrderJson = localStorage.getItem(STORAGE_KEY);
    if (!savedOrderJson) return ALL_REPORTS;
    const savedIds: string[] = JSON.parse(savedOrderJson);
    if (!Array.isArray(savedIds)) return ALL_REPORTS;

    const reportMap = new Map(ALL_REPORTS.map((r) => [r.id, r]));
    const ordered: ReportItem[] = [];
    savedIds.forEach((id) => {
      const item = reportMap.get(id);
      if (item) {
        ordered.push(item);
        reportMap.delete(id);
      }
    });
    reportMap.forEach((item) => ordered.push(item));
    return ordered;
  } catch (e) {
    return ALL_REPORTS;
  }
};

const getInitialCategories = () => {
  try {
    const saved = localStorage.getItem(STORAGE_CAT_KEY);
    if (!saved) return CATEGORY_META;
    const savedKeys: string[] = JSON.parse(saved);
    if (!Array.isArray(savedKeys)) return CATEGORY_META;

    const catMap = new Map(CATEGORY_META.map((c) => [c.key, c]));
    const ordered: typeof CATEGORY_META = [];
    savedKeys.forEach((key) => {
      const item = catMap.get(key);
      if (item) {
        ordered.push(item);
        catMap.delete(key);
      }
    });
    catMap.forEach((item) => ordered.push(item));
    return ordered;
  } catch (e) {
    return CATEGORY_META;
  }
};

const ReportDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { tenantId, businessName } = useAuth();

  const [reportsList, setReportsList] = useState<ReportItem[]>(getInitialReports);
  const [categoriesList, setCategoriesList] = useState(getInitialCategories);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [exporting, setExporting] = useState(false);
  const [draggedReportId, setDraggedReportId] = useState<string | null>(null);
  const [draggedCatKey, setDraggedCatKey] = useState<string | null>(null);
  const [justDroppedReportId, setJustDroppedReportId] = useState<string | null>(null);
  const [justDroppedCatKey, setJustDroppedCatKey] = useState<string | null>(null);
  const [collapsedCats, setCollapsedCats] = useState<Record<string, boolean>>({});

  // Auto-scroll window when dragging near top or bottom screen edges
  useEffect(() => {
    if (!draggedReportId && !draggedCatKey) return;

    let animationFrameId: number;
    let scrollVelocity = 0;

    const handleGlobalDragOver = (e: DragEvent) => {
      const edgeThreshold = 110;
      const viewportHeight = window.innerHeight;
      const clientY = e.clientY;

      if (clientY < edgeThreshold) {
        // Near top edge: scroll up
        const intensity = (edgeThreshold - clientY) / edgeThreshold;
        scrollVelocity = -Math.max(6, Math.round(intensity * 22));
      } else if (clientY > viewportHeight - edgeThreshold) {
        // Near bottom edge: scroll down
        const intensity = (clientY - (viewportHeight - edgeThreshold)) / edgeThreshold;
        scrollVelocity = Math.max(6, Math.round(intensity * 22));
      } else {
        scrollVelocity = 0;
      }
    };

    const scrollLoop = () => {
      if (scrollVelocity !== 0) {
        window.scrollBy(0, scrollVelocity);
      }
      animationFrameId = requestAnimationFrame(scrollLoop);
    };

    window.addEventListener('dragover', handleGlobalDragOver);
    animationFrameId = requestAnimationFrame(scrollLoop);

    return () => {
      window.removeEventListener('dragover', handleGlobalDragOver);
      cancelAnimationFrame(animationFrameId);
    };
  }, [draggedReportId, draggedCatKey]);

  const toggleCatCollapse = (key: string) => {
    setCollapsedCats((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTabClick = (categoryKey: string) => {
    if (categoryKey === selectedCategory || categoryKey === 'all') {
      setSelectedCategory('all');
      setCollapsedCats({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSelectedCategory(categoryKey);
    setCollapsedCats((prev) => ({
      ...prev,
      [categoryKey]: false,
    }));
  };

  // Filtered reports using reportsList order (filtered by search query across all categories)
  const filteredReports = useMemo(() => {
    return reportsList.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesCategory = item.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCategory) return false;
      }
      return true;
    });
  }, [reportsList, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: reportsList.length };
    reportsList.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return counts;
  }, [reportsList]);

  // Reference to always read latest list order on drag end
  const reportsListRef = React.useRef(reportsList);
  reportsListRef.current = reportsList;

  const categoriesListRef = React.useRef(categoriesList);
  categoriesListRef.current = categoriesList;

  // Real-time report card drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedReportId(id);
  };

  const handleDragEnter = (targetId: string) => {
    if (!draggedReportId || draggedReportId === targetId) return;

    setReportsList((prevList) => {
      const sourceIndex = prevList.findIndex((r) => r.id === draggedReportId);
      const targetIndex = prevList.findIndex((r) => r.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return prevList;

      const updated = [...prevList];
      const [movedItem] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, movedItem);
      return updated;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnd = () => {
    if (draggedReportId) {
      const droppedId = draggedReportId;
      setJustDroppedReportId(droppedId);
      setTimeout(() => setJustDroppedReportId(null), 650);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reportsListRef.current.map((r) => r.id)));
        toast.success('Card arrangement saved!', { id: 'report-order-save', duration: 1200 });
      } catch (err) {
        console.error('Failed to save report order to localStorage', err);
      }
    }
    setDraggedReportId(null);
  };

  // Real-time category container drag and drop handlers
  const handleCatDragStart = (e: React.DragEvent, key: string) => {
    e.dataTransfer.setData('text/plain', key);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedCatKey(key);
  };

  const handleCatDragEnter = (targetKey: string) => {
    if (!draggedCatKey || draggedCatKey === targetKey) return;

    setCategoriesList((prevList) => {
      const sourceIndex = prevList.findIndex((c) => c.key === draggedCatKey);
      const targetIndex = prevList.findIndex((c) => c.key === targetKey);
      if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return prevList;

      const updated = [...prevList];
      const [movedItem] = updated.splice(sourceIndex, 1);
      updated.splice(targetIndex, 0, movedItem);
      return updated;
    });
  };

  const handleCatDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleCatDragEnd = () => {
    if (draggedCatKey) {
      const droppedKey = draggedCatKey;
      setJustDroppedCatKey(droppedKey);
      setTimeout(() => setJustDroppedCatKey(null), 650);

      try {
        localStorage.setItem(STORAGE_CAT_KEY, JSON.stringify(categoriesListRef.current.map((c) => c.key)));
        toast.success('Category container order saved!', { id: 'category-order-save', duration: 1200 });
      } catch (err) {
        console.error('Failed to save category order to localStorage', err);
      }
    }
    setDraggedCatKey(null);
  };

  const handleResetOrder = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_CAT_KEY);
      setReportsList(ALL_REPORTS);
      setCategoriesList(CATEGORY_META);
      setCollapsedCats({});
      setSearchQuery('');
      setSelectedCategory('all');
      toast.success('Reports layout reset to default order.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigate = (report: ReportItem) => {
    const dest = `${tenantId ? `/${tenantId}` : ''}/Reports/view/${report.id}`;
    navigate(dest, { state: report.state || {} });
  };

  const handleBatchExport = async () => {
    try {
      setExporting(true);
      const directoryCols: ExcelColumn[] = [
        { header: 'Report ID', key: 'id', width: 22 },
        { header: 'Report Name', key: 'title', width: 35 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Description', key: 'description', width: 55 },
        { header: 'Audit Status', key: 'badge', width: 16 }
      ];

      const exportData = reportsList.map((r) => ({
        id: r.id.toUpperCase(),
        title: r.title,
        category: r.category.toUpperCase(),
        description: r.description,
        badge: r.badge || 'STANDARD'
      }));

      await exportMultiSheetExcel({
        fileName: `Master_Reports_Directory_${new Date().toISOString().split('T')[0]}.xlsx`,
        companyName: businessName || 'ZOAIB ALI & COMPANY',
        sheets: [
          {
            sheetName: 'Reports Catalog',
            reportTitle: 'Master ERP Reports Directory & Audit Statements Catalog',
            columns: directoryCols,
            data: exportData,
            summaryRow: false,
            theme: 'emerald'
          }
        ]
      });

      toast.success('Master Reports Directory catalog exported successfully!');
    } catch (err: any) {
      toast.error('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs antialiased font-sans pb-16 pt-2">
      {/* ── BREADCRUMB & METADATA BAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] font-mono text-slate-500 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2 uppercase tracking-wider">
          <span>Financial Accounting</span>
          <span>&gt;</span>
          <span>Operational Ledger</span>
          <span>&gt;</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">Standard Reports Hub</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/60 font-semibold text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Ledger Synced Active</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <MdAccessTime size={14} />
            <span>Real-time DB</span>
          </div>
        </div>
      </div>

      {/* ── HEADER BANNER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/50 shadow-inner">
            <MdAssessment size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
                Reports Directory
              </h1>
              <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md text-[11px] border border-emerald-200 dark:border-emerald-800/40">
                {reportsList.length} Available
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
              Drag report cards or whole category boxes to rearrange. Saved automatically in your browser.
            </p>
          </div>
        </div>

        {/* Global Search & Reset Order Controls */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={handleResetOrder}
            title="Reset layout and category positions to default"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs transition cursor-pointer shrink-0 border border-slate-200 dark:border-slate-700"
          >
            <MdRestartAlt size={16} />
            <span className="hidden sm:inline">Reset Layout</span>
          </button>

          <div className="w-full md:w-80 relative">
            <MdSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by name or keyword..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
              >
                <MdClear size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── CATEGORY FILTER TABS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => handleTabClick('all')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap cursor-pointer transition ${
            selectedCategory === 'all'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <MdCategory size={15} />
          <span>All Reports</span>
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
              selectedCategory === 'all' ? 'bg-emerald-800/80 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            {categoryCounts.all}
          </span>
        </button>

        {categoriesList.map((cat) => {
          const CatIcon = cat.icon || MdAssessment;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => handleTabClick(cat.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs whitespace-nowrap cursor-pointer transition ${
                selectedCategory === cat.key
                  ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-500/50'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <CatIcon size={15} />
              <span>{cat.title}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                  selectedCategory === cat.key ? 'bg-emerald-800/80 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {categoryCounts[cat.key] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── EXPAND & DRAG ANIMATION STYLES ── */}
      <style>{`
        @keyframes expandDirectoryContainer {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(20px);
            filter: blur(4px);
          }
          50% {
            filter: blur(0px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0px);
          }
        }
        @keyframes reportCardFadeUp {
          0% {
            opacity: 0;
            transform: translateY(16px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes dropSettle {
          0% {
            transform: scale(0.96) translateY(-2px);
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.45);
          }
          50% {
            transform: scale(1.02) translateY(0);
            box-shadow: 0 12px 28px -4px rgba(16, 185, 129, 0.25);
          }
          100% {
            transform: scale(1) translateY(0);
            box-shadow: none;
          }
        }
        .animate-expand-container {
          animation: expandDirectoryContainer 0.52s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: transform, opacity, filter;
        }
        .animate-card-item {
          animation: reportCardFadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) backwards;
          will-change: transform, opacity;
        }
        .animate-drop-settle {
          animation: dropSettle 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
          z-index: 20;
        }
        .drag-item-transition {
          transition: transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1),
                      opacity 0.45s cubic-bezier(0.2, 0.9, 0.3, 1),
                      box-shadow 0.45s cubic-bezier(0.2, 0.9, 0.3, 1),
                      background-color 0.35s ease,
                      border-color 0.35s ease;
        }
      `}</style>

      {/* ── CATEGORIZED REPORTS DISPLAY (EXPANDABLE DIRECTORY) ── */}
      {selectedCategory !== 'all' ? (
        /* Single Selected Category: Expanded Container */
        (() => {
          const category = categoriesList.find((c) => c.key === selectedCategory);
          if (!category) return null;
          const categoryReports = filteredReports.filter((r) => r.category === category.key);
          const CatBannerIcon = category.icon || MdAssessment;

          return (
            <div
              key={category.key}
              className="w-full flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-emerald-500/80 dark:border-emerald-500/60 shadow-xl shadow-emerald-500/10 dark:shadow-emerald-950/40 overflow-hidden animate-expand-container"
            >
              {/* Category Full-Width Banner Header */}
              <div className="p-5 border-b border-emerald-100 dark:border-emerald-950 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-600 text-white shadow-sm">
                    <CatBannerIcon size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="font-black text-lg text-slate-900 dark:text-white">
                        {category.title}
                      </h2>
                      <span className="font-mono text-xs font-black text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        {categoryReports.length} {categoryReports.length === 1 ? 'Report' : 'Reports'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {category.subtitle}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs border border-slate-200 dark:border-slate-700 transition cursor-pointer self-start sm:self-auto shadow-sm"
                >
                  <span>← Back to All Reports</span>
                </button>
              </div>

              {/* 3 in a row Draggable Reports Grid */}
              <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/30 dark:bg-slate-950/20">
                {categoryReports.map((report, idx) => {
                  const Icon = report.icon || MdAssessment;
                  const isDragging = draggedReportId === report.id;
                  const isJustDropped = justDroppedReportId === report.id;

                  return (
                    <div
                      key={report.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, report.id)}
                      onDragEnter={() => handleDragEnter(report.id)}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleNavigate(report)}
                      style={{ animationDelay: `${idx * 40}ms` }}
                      className={`group relative p-4.5 rounded-xl border bg-white dark:bg-slate-900/90 cursor-pointer flex flex-col justify-between gap-4 select-none animate-card-item drag-item-transition ${
                        isDragging
                          ? 'opacity-30 scale-95 border-dashed border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/30 shadow-inner'
                          : isJustDropped
                          ? 'animate-drop-settle border-emerald-500 ring-2 ring-emerald-500/30'
                          : 'border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500/80 hover:shadow-md hover:-translate-y-0.5'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/50 text-slate-600 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                              <Icon size={18} />
                            </div>
                            <div
                              title="Drag to rearrange"
                              className="text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MdDragIndicator size={18} />
                            </div>
                          </div>

                          {shouldShowBadge(report) && (
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wide border ${
                                report.badgeType === 'new'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                  : report.badgeType === 'audited'
                                  ? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                  : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                              }`}
                            >
                              {report.badge}
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="font-extrabold text-[13px] text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                            {report.title}
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                            {report.description}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        <span>Open Parameter Filter</span>
                        <div className="group-hover:translate-x-1 transition-transform">
                          <MdArrowForward size={15} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()
      ) : (
        /* All Categories Overview with 3 Category Columns (Masonry flow - no vertical gaps) */
        (() => {
          const renderCategoryContainer = (category: typeof CATEGORY_META[0], catIdx: number) => {
            const categoryReports = filteredReports.filter((r) => r.category === category.key);
            if (categoryReports.length === 0 && searchQuery) return null;
            const isCatDragging = draggedCatKey === category.key;
            const isCatJustDropped = justDroppedCatKey === category.key;
            const isCollapsed = Boolean(collapsedCats[category.key]);

            return (
              <div
                id={`category-container-${category.key}`}
                key={category.key}
                draggable={true}
                onDragStart={(e) => handleCatDragStart(e, category.key)}
                onDragEnter={() => handleCatDragEnter(category.key)}
                onDragOver={handleCatDragOver}
                onDragEnd={handleCatDragEnd}
                style={{ animationDelay: `${catIdx * 35}ms` }}
                className={`w-full bg-white dark:bg-slate-900 rounded-2xl border shadow-sm overflow-hidden select-none animate-card-item drag-item-transition ${
                  isCatDragging
                    ? 'opacity-30 scale-[0.99] border-dashed border-emerald-500 shadow-inner'
                    : isCatJustDropped
                    ? 'animate-drop-settle border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:shadow-md'
                }`}
              >
                {/* Category Header with Drag Grip, Icon, Badge & Collapse Control */}
                <div
                  className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between cursor-pointer"
                  onClick={() => toggleCatCollapse(category.key)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      title="Drag entire category section to rearrange"
                      className="text-slate-300 hover:text-slate-600 dark:hover:text-slate-300 cursor-grab active:cursor-grabbing p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MdDragIndicator size={18} />
                    </div>
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shrink-0">
                      {category.icon ? <category.icon size={18} /> : <MdAssessment size={18} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                          {category.title}
                        </h2>
                        <span className="font-mono text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          {categoryReports.length} {categoryReports.length === 1 ? 'Report' : 'Reports'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
                        {category.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      title={isCollapsed ? "Expand category" : "Collapse category"}
                      onClick={() => toggleCatCollapse(category.key)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
                    >
                      <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
                      {isCollapsed ? <MdKeyboardArrowDown size={18} /> : <MdKeyboardArrowUp size={18} />}
                    </button>
                  </div>
                </div>

                {/* Category Grid of Report Cards */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isCollapsed || draggedCatKey ? 'max-h-0 opacity-0 pointer-events-none' : 'max-h-[2500px] opacity-100'
                  }`}
                >
                  <div className="p-4.5 grid grid-cols-1 gap-3 bg-slate-50/20 dark:bg-slate-950/10">
                    {categoryReports.map((report, idx) => {
                      const Icon = report.icon || MdAssessment;
                      const isDragging = draggedReportId === report.id;
                      const isJustDropped = justDroppedReportId === report.id;

                      return (
                        <div
                          key={report.id}
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, report.id)}
                          onDragEnter={(e) => {
                            e.stopPropagation();
                            handleDragEnter(report.id);
                          }}
                          onDragOver={handleDragOver}
                          onDragEnd={handleDragEnd}
                          onClick={() => handleNavigate(report)}
                          style={{ animationDelay: `${idx * 25}ms` }}
                          className={`group relative p-4.5 rounded-xl border bg-white dark:bg-slate-900 cursor-pointer flex flex-col justify-between gap-3.5 select-none animate-card-item drag-item-transition ${
                            isDragging
                              ? 'opacity-30 scale-95 border-dashed border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/30 shadow-inner'
                              : isJustDropped
                              ? 'animate-drop-settle border-emerald-500 ring-2 ring-emerald-500/30'
                              : 'border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500/80 hover:shadow-md hover:-translate-y-0.5'
                          }`}
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/50 text-slate-600 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                                  <Icon size={17} />
                                </div>
                                <div
                                  title="Drag to rearrange"
                                  className="text-slate-300 group-hover:text-slate-500 cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MdDragIndicator size={16} />
                                </div>
                              </div>

                              {shouldShowBadge(report) && (
                                <span
                                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wide border ${
                                    report.badgeType === 'new'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                      : report.badgeType === 'audited'
                                      ? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                      : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                                  }`}
                                >
                                  {report.badge}
                                </span>
                              )}
                            </div>

                            <div>
                              <h3 className="font-extrabold text-[13px] text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                                {report.title}
                              </h3>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                                {report.description}
                              </p>
                            </div>
                          </div>

                          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-slate-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                            <span>Open Filter</span>
                            <div className="group-hover:translate-x-1 transition-transform">
                              <MdArrowForward size={14} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          };

          return (
            <>
              {/* Small screens (< md): Single column */}
              <div className="flex md:hidden flex-col gap-5 animate-expand-container">
                {categoriesList.map((category, catIdx) => renderCategoryContainer(category, catIdx))}
              </div>

              {/* Medium screens (md to lg): 2 columns */}
              <div className="hidden md:grid lg:hidden md:grid-cols-2 gap-5 items-start animate-expand-container">
                <div className="flex flex-col gap-5 w-full">
                  {categoriesList
                    .filter((_, idx) => idx % 2 === 0)
                    .map((cat, idx) => renderCategoryContainer(cat, idx * 2))}
                </div>
                <div className="flex flex-col gap-5 w-full">
                  {categoriesList
                    .filter((_, idx) => idx % 2 !== 0)
                    .map((cat, idx) => renderCategoryContainer(cat, idx * 2 + 1))}
                </div>
              </div>

              {/* Large screens (lg+): 3 columns of category containers */}
              <div className="hidden lg:grid lg:grid-cols-3 gap-5 items-start animate-expand-container">
                <div className="flex flex-col gap-5 w-full">
                  {categoriesList
                    .filter((_, idx) => idx % 3 === 0)
                    .map((cat, idx) => renderCategoryContainer(cat, idx * 3))}
                </div>
                <div className="flex flex-col gap-5 w-full">
                  {categoriesList
                    .filter((_, idx) => idx % 3 === 1)
                    .map((cat, idx) => renderCategoryContainer(cat, idx * 3 + 1))}
                </div>
                <div className="flex flex-col gap-5 w-full">
                  {categoriesList
                    .filter((_, idx) => idx % 3 === 2)
                    .map((cat, idx) => renderCategoryContainer(cat, idx * 3 + 2))}
                </div>
              </div>
            </>
          );
        })()
      )}
      )}

      {/* Empty State */}
      {filteredReports.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <MdSearch size={36} className="mx-auto text-slate-300 mb-2" />
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200">No reports found</h3>
          <p className="text-xs text-slate-400 mt-1">
            No report matching "{searchQuery}" found in the directory.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="mt-4 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer transition"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* ── RECENT BATCH EXPORTS FOOTER ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl">
            <MdFileDownload size={22} />
          </div>
          <div>
            <h4 className="font-black text-xs text-slate-900 dark:text-white">
              Master Operational Batch Export
            </h4>
            <p className="text-[11px] text-slate-500">
              Download the comprehensive catalog and operational audit directory for Excel & external verification.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={exporting}
          onClick={handleBatchExport}
          className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl font-bold cursor-pointer transition shadow-sm disabled:opacity-50 whitespace-nowrap text-xs"
        >
          <MdFileDownload size={16} />
          <span>{exporting ? 'Exporting...' : 'Export Directory (.xlsx)'}</span>
        </button>
      </div>
    </div>
  );
};

export default ReportDashboard;
