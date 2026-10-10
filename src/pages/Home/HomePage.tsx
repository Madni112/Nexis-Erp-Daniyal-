import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../Context/supabaseClient';
import { fetchFinancialMetrics, FinancialSummary } from '../../service/financialCalculations';
import Spinner from '../../ui/Spinner';
import {
  MdShoppingCart,
  MdLocalMall,
  MdAddBox,
  MdCompareArrows,
  MdAssessment,
  MdAccountBalanceWallet,
  MdAccountBalance,
  MdTrendingUp,
  MdWarning,
  MdCheckCircle,
  MdPointOfSale,
  MdReceiptLong,
  MdCalendarToday,
  MdArrowForward,
  MdClose,
  MdInventory,
  MdAttachMoney,
  MdOutlineReceipt
} from 'react-icons/md';
import StatCard from '../../ui/StatCard';
import ActionCard from '../../ui/ActionCard';
import { useAuth } from '../../Context/Auth';
import { useThemeColor } from '../../Context/ThemeColor';
import SalesmanDashboard from '../Dashboard/SalesmanDashboard';
import WarehouseDashboard from '../Dashboard/WarehouseDashboard';
import BroadcastBanner from '../../components/Dashboard/BroadcastBanner';

const AdminRoleSwitcher: React.FC<{
  activeView: 'executive' | 'salesman' | 'warehouse';
  onChangeView: (v: 'executive' | 'salesman' | 'warehouse') => void;
}> = ({ activeView, onChangeView }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 px-2">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        Role Dashboard Preview:
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => onChangeView('executive')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeView === 'executive'
              ? 'bg-blue-600 text-white shadow-sm scale-102'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          👑 Executive Overview
        </button>
        <button
          onClick={() => onChangeView('salesman')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeView === 'salesman'
              ? 'bg-blue-600 text-white shadow-sm scale-102'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          🛒 Salesman View
        </button>
        <button
          onClick={() => onChangeView('warehouse')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeView === 'warehouse'
              ? 'bg-orange-600 text-white shadow-sm scale-102'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          📦 Warehouse
        </button>
      </div>
    </div>
  );
};

interface CashTransaction {
  id: string | number;
  date: string;
  type: 'Inflow' | 'Outflow';
  source: string;
  party: string;
  amount: number;
  description: string;
}

interface RecentInvoice {
  id: string | number;
  invoiceNo: string;
  customerName: string;
  date: string;
  amount: number;
  paymentMode: string;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { activeColor } = useThemeColor();
  const [adminView, setAdminView] = useState<'executive' | 'salesman' | 'warehouse'>('executive');

  const userRoleLower = (role || '').toLowerCase();
  let allowedModules: string[] = [];
  try {
    const cached = localStorage.getItem('zac_user_modules');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        allowedModules = parsed.map((s: string) => String(s).toLowerCase().trim());
      }
    }
  } catch (_) {}

  const isAdmin = userRoleLower.includes('admin') || userRoleLower.includes('owner') || userRoleLower.includes('super admin');
  const isSalesman = !isAdmin && (userRoleLower.includes('salesman') || allowedModules.includes('/dashboard/salesman') || allowedModules.includes('salesman-dashboard'));
  const isWarehouse = !isAdmin && !isSalesman && (userRoleLower.includes('warehouse') || allowedModules.includes('/dashboard/warehouse') || allowedModules.includes('warehouse-dashboard'));

  const [metrics, setMetrics] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [urgentLowStock, setUrgentLowStock] = useState<any[]>([]);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [liquidityTab, setLiquidityTab] = useState<'bank' | 'cash'>('bank');
  const [stockModalView, setStockModalView] = useState<'allTime' | 'thisMonth'>('allTime');
  const [activeBreakdownModal, setActiveBreakdownModal] = useState<'cash' | 'bank' | 'receivables' | 'stock' | null>(null);

  useEffect(() => {
    if (!isSalesman && !isWarehouse) {
      loadHomePageData();
    }
  }, [isSalesman, isWarehouse]);

  const loadHomePageData = async () => {
    try {
      setLoading(true);
      const [
        metricsData,
        invoicesRes,
        productsRes,
        openStocksRes,
        purchasesRes,
        salesReturnsRes,
        vouchersRes
      ] = await Promise.all([
        fetchFinancialMetrics(),
        supabase.from('sales_invoices').select('*').order('created_at', { ascending: false }).limit(8),
        supabase.from('products').select('*'),
        supabase.from('opening_stocks').select('*'),
        supabase.from('supplier_purchases').select('*'),
        supabase.from('sales_returns').select('*'),
        supabase.from('financial_vouchers').select('*').order('created_at', { ascending: false })
      ]);

      setMetrics(metricsData);

      // Recent Invoices
      const invs = invoicesRes.data || [];
      setRecentInvoices(
        invs.map((inv: any) => ({
          id: inv.id,
          invoiceNo: inv.invoice_no || inv.invoiceNo || `INV-${inv.id}`,
          customerName: inv.customer_name || inv.customerName || 'Walk-in Customer',
          date: inv.invoice_date || inv.date || new Date(inv.created_at || Date.now()).toLocaleDateString(),
          amount: Number(inv.total_amount || inv.net_amount || inv.netTotal || 0),
          paymentMode: inv.payment_type || inv.paymentMode || 'Credit'
        }))
      );

      // Low Stock Critical Items
      const products = productsRes.data || [];
      const openStocks = openStocksRes.data || [];
      const purchases = purchasesRes.data || [];
      const salesReturns = salesReturnsRes.data || [];

      const lowItems: any[] = [];
      products.forEach((prod: any) => {
        const prodName = String(prod.product_name || '').trim().toLowerCase();
        const minLimit = Number(prod.min_stock || prod.reorder_level || prod.minimum_limit || 10);

        const totalOpening = openStocks
          .filter((os: any) => {
            const osName = String(os.product_name || os.item_name || '').trim().toLowerCase();
            return osName === prodName || (prodName && osName.includes(prodName));
          })
          .reduce((sum: number, os: any) => sum + Number(os.quantity || 0), 0);

        let totalPurchased = 0;
        purchases.forEach((p: any) => {
          const pItems = Array.isArray(p.items) ? p.items : (typeof p.items === 'string' ? JSON.parse(p.items || '[]') : []);
          pItems.forEach((pi: any) => {
            const piName = String(pi.product_name || pi.itemName || '').trim().toLowerCase();
            if (piName === prodName || (prodName && piName.includes(prodName))) {
              totalPurchased += Number(pi.quantity || 0);
            }
          });
        });

        let totalSold = 0;
        invs.forEach((inv: any) => {
          const invItems = Array.isArray(inv.items) ? inv.items : (typeof inv.items === 'string' ? JSON.parse(inv.items || '[]') : []);
          invItems.forEach((ii: any) => {
            const iiName = String(ii.product_name || ii.itemName || '').trim().toLowerCase();
            if (iiName === prodName || (prodName && iiName.includes(prodName))) {
              totalSold += Number(ii.qty || 0);
            }
          });
        });

        let totalReturned = 0;
        salesReturns.forEach((sr: any) => {
          const srItems = Array.isArray(sr.items) ? sr.items : (typeof sr.items === 'string' ? JSON.parse(sr.items || '[]') : []);
          srItems.forEach((sri: any) => {
            const sriName = String(sri.product_name || sri.item_name || '').trim().toLowerCase();
            if (sriName === prodName || (prodName && sriName.includes(prodName))) {
              totalReturned += Number(sri.quantity || 0);
            }
          });
        });

        const currentStock = Math.max(0, totalOpening + totalPurchased - totalSold + totalReturned);
        if (currentStock <= minLimit) {
          lowItems.push({
            id: prod.id,
            name: prod.product_name || 'Item',
            category: prod.category || 'Standard Catalog',
            currentStock,
            minLimit,
            deficit: Math.max(0, minLimit - currentStock),
            unit: prod.unit || 'Units'
          });
        }
      });

      lowItems.sort((a, b) => b.deficit - a.deficit);
      setUrgentLowStock(lowItems.slice(0, 5));

      // Cash Transactions from Vouchers
      const vouchers = vouchersRes.data || [];
      const extractedCash: CashTransaction[] = [];
      vouchers.forEach((v: any) => {
        const vType = String(v.voucher_type || v.type || '').toUpperCase();
        const isCashVoucher = vType.includes('CASH') || vType.includes('RECEIPT') || vType.includes('PAYMENT');
        if (isCashVoucher) {
          const isPayment = vType.includes('PAYMENT') || vType.includes('DEBIT');
          extractedCash.push({
            id: v.id,
            date: v.date || v.voucher_date || new Date(v.created_at || Date.now()).toLocaleDateString(),
            type: isPayment ? 'Outflow' : 'Inflow',
            source: vType,
            party: v.party_name || v.party || v.account_name || 'General Account',
            amount: Number(v.amount || v.total_amount || 0),
            description: v.description || v.remarks || 'Cash settlement'
          });
        }
      });
      setCashTransactions(extractedCash.slice(0, 15));

    } catch (err) {
      console.error('Failed loading home data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (isSalesman) return <SalesmanDashboard />;
  if (isWarehouse) return <WarehouseDashboard />;

  if (adminView === 'salesman') {
    return (
      <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs pb-12">
        <AdminRoleSwitcher activeView={adminView} onChangeView={setAdminView} />
        <SalesmanDashboard />
      </div>
    );
  }

  if (adminView === 'warehouse') {
    return (
      <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs pb-12">
        <AdminRoleSwitcher activeView={adminView} onChangeView={setAdminView} />
        <WarehouseDashboard />
      </div>
    );
  }

  if (loading || !metrics) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs pb-12">
      {/* Role Dashboard Switcher */}
      <AdminRoleSwitcher activeView={adminView} onChangeView={setAdminView} />

      {/* Xenith WhatsApp Broadcast Hero Banner */}
      <BroadcastBanner />

      {/* Operations Portal Header & Link to Deep Analytics */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Operations & Quick Actions Hub</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Instant business operations, WhatsApp messaging, billing & fiscal pulse</p>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white font-bold shadow-md transition-transform hover:scale-102"
            style={{ backgroundColor: activeColor.primary }}
          >
            <MdAssessment size={16} />
            <span>Open BI Analytics</span>
            <MdArrowForward size={14} />
          </button>
          <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-3 py-2 rounded-xl font-bold text-slate-600 dark:text-slate-300 shadow-sm flex items-center gap-1.5">
            <MdCalendarToday className="text-primary" />
            <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Primary Action Tiles (Xenith Palette) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ActionCard
          title="SALES"
          subtitle="Customer Bill"
          Icon={MdShoppingCart}
          style={{ background: `linear-gradient(135deg, ${activeColor.primary}, ${activeColor.primaryDark})` }}
          onClick={() => navigate('/sales/invoice/list')}
        />
        <ActionCard
          title="PURCHASES"
          subtitle="Buy New Product"
          Icon={MdLocalMall}
          bgGradient="bg-gradient-to-br from-amber-600 to-amber-800"
          onClick={() => navigate('/Purchase/Purchases/list')}
        />
        <ActionCard
          title="PRODUCTS"
          subtitle="Items List"
          Icon={MdAddBox}
          bgGradient="bg-gradient-to-br from-teal-600 to-cyan-800"
          onClick={() => navigate('/Administration/Products/list')}
        />
        <ActionCard
          title="SALE RETURN"
          subtitle="Customer Return"
          Icon={MdCompareArrows}
          bgGradient="bg-gradient-to-br from-slate-700 to-slate-900"
          onClick={() => navigate('/Sales/Sales-Return/List')}
        />
      </div>

      {/* Secondary Fast Action Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/sales/invoice/list')}
          className="group cursor-pointer p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 hover:border-blue-500/50 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fast Action</span>
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 mt-0.5">Today's Sale</h4>
            <p className="text-[11px] font-mono font-bold text-slate-900 dark:text-white mt-1">Rs. {(metrics.todaysSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <MdTrendingUp size={18} />
          </div>
        </div>

        <div
          onClick={() => navigate('/Sales/History')}
          className="group cursor-pointer p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 hover:border-emerald-500/50 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fast Action</span>
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 mt-0.5">This Month Sales</h4>
            <p className="text-[11px] font-mono font-bold text-slate-900 dark:text-white mt-1">Rs. {(metrics.thisMonthSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <MdShoppingCart size={18} />
          </div>
        </div>

        <div
          onClick={() => navigate('/Reports/Stock-Report')}
          className="group cursor-pointer p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 hover:border-amber-500/50 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fast Action</span>
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 mt-0.5">Stock Report</h4>
            <p className="text-[11px] font-mono font-bold text-slate-900 dark:text-white mt-1">{(metrics.totalStockUnits || 0).toLocaleString()} Total Units</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <MdInventory size={18} />
          </div>
        </div>

        <div
          onClick={() => navigate('/crm/customer-due-list')}
          className="group cursor-pointer p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 hover:border-purple-500/50 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
        >
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fast Action</span>
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 mt-0.5">Customer Due List</h4>
            <p className="text-[11px] font-mono font-bold text-slate-900 dark:text-white mt-1">Send WhatsApp</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <MdReceiptLong size={18} />
          </div>
        </div>
      </div>

      {/* Fiscal Pulse / Key Financial Metrics */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Real-Time Fiscal Position
          </h2>
          <span className="text-[11px] text-slate-400">Click cards for breakdown</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Cash In Hand"
            value={metrics.cashBalance}
            Icon={MdAccountBalanceWallet}
            thisMonthValue={metrics.thisMonthCashInflow}
            thisMonthLabel="This Month"
            iconStyle={{ background: `linear-gradient(135deg, ${activeColor.primary}, ${activeColor.primaryHover})` }}
            onClick={() => {
              setLiquidityTab('cash');
              setActiveBreakdownModal('cash');
            }}
          />
          <StatCard
            title="Bank Balances"
            value={metrics.totalBankBalance}
            Icon={MdAccountBalance}
            thisMonthValue={metrics.thisMonthBankInflow}
            thisMonthLabel="This Month"
            bgColor="bg-gradient-to-br from-teal-600 to-cyan-700"
            onClick={() => {
              setLiquidityTab('bank');
              setActiveBreakdownModal('bank');
            }}
          />
          <StatCard
            title="Stock Assets Value"
            value={metrics.inventoryAssetValue}
            Icon={MdInventory}
            thisMonthValue={metrics.inventoryAssetValue}
            thisMonthLabel="Total Assets"
            bgColor="bg-gradient-to-br from-amber-500 to-amber-700"
            onClick={() => setActiveBreakdownModal('stock')}
          />
          <StatCard
            title="Net Receivables"
            value={metrics.totalReceivables}
            Icon={MdAttachMoney}
            thisMonthValue={metrics.thisMonthReceivables}
            thisMonthLabel="This Month"
            bgColor="bg-gradient-to-br from-blue-500 to-indigo-700"
            onClick={() => setActiveBreakdownModal('receivables')}
          />
        </div>
      </div>

      {/* Quick Operations Hub Split: Recent Invoices & Urgent Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Invoices Table */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <MdOutlineReceipt size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs">Recent Billing Transactions</h3>
                  <p className="text-[10px] text-slate-400">Latest customer invoices generated</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/Sales/History')}
                className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>View All</span>
                <MdArrowForward size={12} />
              </button>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/60 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="py-2 px-1">Invoice #</th>
                    <th className="py-2 px-2">Customer</th>
                    <th className="py-2 px-2">Date</th>
                    <th className="py-2 px-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition">
                      <td className="py-2.5 px-1 font-mono font-bold text-blue-600 dark:text-blue-400">{inv.invoiceNo}</td>
                      <td className="py-2.5 px-2 font-medium text-slate-700 dark:text-slate-200 truncate max-w-[150px]">{inv.customerName}</td>
                      <td className="py-2.5 px-2 text-slate-400 font-mono text-[11px]">{inv.date}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900 dark:text-white">Rs. {inv.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  {recentInvoices.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">No recent invoices recorded</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
            <button
              onClick={() => navigate('/sales/new-invoice')}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold text-xs inline-flex items-center gap-1.5 transition"
            >
              <MdShoppingCart size={13} />
              <span>Create New Bill</span>
            </button>
            <button
              onClick={() => navigate('/POS')}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs inline-flex items-center gap-1.5 transition"
            >
              <MdPointOfSale size={13} />
              <span>Open POS Terminal</span>
            </button>
          </div>
        </div>

        {/* Urgent Low Stock Alerts */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                  <MdWarning size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs">Low Stock Thresholds</h3>
                  <p className="text-[10px] text-slate-400">Items requiring procurement replenishment</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/Reports/StockReport')}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Full Audit</span>
                <MdArrowForward size={12} />
              </button>
            </div>

            <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
              {urgentLowStock.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">{item.name}</h4>
                    <span className="text-[10px] text-slate-400">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      {item.currentStock} / {item.minLimit} {item.unit}
                    </span>
                    <p className="text-[10px] text-rose-500 font-semibold mt-0.5">Deficit: -{item.deficit}</p>
                  </div>
                </div>
              ))}
              {urgentLowStock.length === 0 && (
                <div className="py-8 text-center text-slate-400 flex flex-col items-center gap-1">
                  <MdCheckCircle className="text-emerald-500 text-xl" />
                  <span>All product inventories are within safe levels</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
            <button
              onClick={() => navigate('/Purchase/New-Purchase')}
              className="w-full px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <MdLocalMall size={14} />
              <span>Purchase Stock Reorder</span>
            </button>
          </div>
        </div>

      </div>

      {/* QUICK BREAKDOWN POPUP MODAL */}
      {activeBreakdownModal && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  {activeBreakdownModal === 'cash' && 'Cash In Hand & Transactions'}
                  {activeBreakdownModal === 'bank' && 'Bank Account Balances'}
                  {activeBreakdownModal === 'stock' && 'Stock Valuation Summary'}
                  {activeBreakdownModal === 'receivables' && 'Net Receivables Ledger'}
                </h3>
              </div>
              <button
                onClick={() => setActiveBreakdownModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <MdClose size={18} />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {activeBreakdownModal === 'bank' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-500">Bank / Account Title</span>
                    <span className="text-xs font-semibold text-slate-500">Net Balance</span>
                  </div>
                  {metrics.bankAccounts && metrics.bankAccounts.length > 0 ? (
                    metrics.bankAccounts.map((b: any, i: number) => (
                      <div key={i} className="flex justify-between items-center py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{b.accountTitle}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Acc: {b.accountNumber || 'Primary'}</p>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          Rs. {Number(b.netBalance || 0).toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-6 text-slate-400">No bank accounts registered</p>
                  )}
                </div>
              )}

              {activeBreakdownModal === 'cash' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-500">Recent Cash Inflow / Outflow</span>
                    <span className="text-xs font-semibold text-slate-500">Amount</span>
                  </div>
                  {cashTransactions.length > 0 ? (
                    cashTransactions.map((tx: any, i: number) => (
                      <div key={i} className="flex justify-between items-center py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${tx.type === 'Inflow' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{tx.party}</p>
                          </div>
                          <p className="text-[10px] text-slate-400">{tx.description} • {tx.date}</p>
                        </div>
                        <span className={`text-xs font-mono font-bold ${tx.type === 'Inflow' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {tx.type === 'Inflow' ? '+' : '-'} Rs. {Number(tx.amount || 0).toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-6 text-slate-400">No recent cash transactions</p>
                  )}
                </div>
              )}

              {activeBreakdownModal === 'stock' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Total Stock Units</p>
                      <p className="text-lg font-black text-slate-800 dark:text-white mt-1">{(metrics.totalStockUnits || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Estimated Stock Asset Value</p>
                      <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1">Rs. {Number(metrics.inventoryAssetValue || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveBreakdownModal(null);
                      navigate('/Reports/Stock-Report');
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-sm transition"
                  >
                    Open Detailed Stock Report
                  </button>
                </div>
              )}

              {activeBreakdownModal === 'receivables' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">Total Outstanding Receivables</p>
                      <p className="text-xl font-black text-blue-900 dark:text-blue-200 mt-0.5">Rs. {Number(metrics.totalReceivables || 0).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveBreakdownModal(null);
                        navigate('/crm/customer-due-list');
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition"
                    >
                      Open Customer Due List
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
