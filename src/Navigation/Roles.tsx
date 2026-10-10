import {
  Home,
  LayoutDashboard,
  Users,
  UserPlus,
  UserCheck,
  Briefcase,
  FileText,
  FileCheck,
  AlertCircle,
  CalendarClock,
  History,
  ShoppingCart,
  Receipt,
  FilePlus,
  ClipboardList,
  Tag,
  Truck,
  Send,
  Undo2,
  CreditCard,
  ShoppingBag,
  PackageCheck,
  BookOpen,
  Building2,
  Layers,
  Folder,
  FolderTree,
  Sparkles,
  Ruler,
  Scale,
  MapPin,
  Car,
  Landmark,
  BookMarked,
  Coins,
  Store,
  Clock,
  PauseCircle,
  Barcode,
  Warehouse,
  Boxes,
  ArrowLeftRight,
  SlidersHorizontal,
  ClipboardCheck,
  Calendar,
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  CalendarCheck2,
  Banknote,
  ListPlus,
  CalendarOff,
  HandCoins,
  ShieldCheck,
  PackageSearch,
  UploadCloud,
  Building,
  Plus
} from 'lucide-react';

import HoldingReport from '../pages/Reports/Holding Report/HoldingReport';
import HoldingReportPrint from '../pages/Reports/Holding Report/HoldingReportPrint';
import Brands from '../pages/Administration/Brands';
import HomePage from '../pages/Home/HomePage';
import Dashboard from '../pages/Dashboard/Dashboard';
import SalesmanDashboard from '../pages/Dashboard/SalesmanDashboard';
import WarehouseDashboard from '../pages/Dashboard/WarehouseDashboard';
import NewInvoice from '../pages/Sales/Invoice/NewInvoice';
import SalesHistory from '../pages/Sales/Invoice/SalesHistory';
import PrintInvoice from '../pages/Sales/Invoice/PrintInvoice';
import AddCustomer from '../pages/Sales/Customers/AddCustomer';
import CustomerHistory from '../pages/Sales/Customers/CustomerHistory';
import AddSalesman from '../pages/Sales/Salesman/AddSalesman';
import SalesmanHistory from '../pages/Sales/Salesman/SalesmanHistory';
import AddCompany from '../pages/Administration/AddCompany';
import DeliveryChallanHistory from '../pages/Sales/Delivery Challan/DeliveryChallanHistory';
import ShopDispatchQueue from '../pages/Sales/Delivery Challan/ShopDispatchQueue';
import AddDeliveryChallan from '../pages/Sales/Delivery Challan/AddDeliveryChallan';
import PrintChallan from '../pages/Sales/Delivery Challan/PrintChallan';
import SalesReturnList from '../pages/Sales/Sales Return/SalesReturnList';
import AddSalesReturn from '../pages/Sales/Sales Return/AddSalesReturn';
import PrintSalesReturn from '../pages/Sales/Sales Return/PrintSalesReturn';
import ProductList from '../pages/Administration/Products/ProductList';
import AddProduct from '../pages/Administration/Products/AddProduct';
import BulkProductUpload from '../pages/Administration/Products/BulkProductUpload';
import Categories from '../pages/Administration/Categories';
import UomManager from '../pages/Administration/UomManager';
import SurfaceFinish from '../pages/Administration/SurfaceFinish';
import LocationList from '../pages/Administration/Location/LocationList';
import AddLocation from '../pages/Administration/Location/AddLocation';
import TransportationList from '../pages/Administration/Transportation/TransportationList';
import AddTransportation from '../pages/Administration/Transportation/AddTransportation';
import StockTransferList from '../pages/Administration/Stock Transfer/StockTransferList';
import AddStockTransfer from '../pages/Administration/Stock Transfer/AddStockTransfer';
import ChartOfAccountList from '../pages/Registration/Chart of Account/ChartOfAccountList';
import AddChartOfAccount from '../pages/Registration/Chart of Account/AddChartOfAccount';
import VoucherList from '../pages/Registration/Vouchers/VoucherList';
import AddVoucher from '../pages/Registration/Vouchers/AddVoucher';
import BankAccountList from '../pages/Registration/Bank Account/BankAccountList';
import AddBank from '../pages/Registration/Bank Account/AddBankAccount';
import AddOpeningStock from '../pages/Registration/Opening Stock/AddOpeningStock';
import OpeningStockList from '../pages/Registration/Opening Stock/OpeningStockList';
import AddInvoiceReceipt from '../pages/Registration/Invoice Receipt/AddInvoiceReceipt';
import InvoiceReceiptList from '../pages/Registration/Invoice Receipt/InvoiceReceiptList';
import PrintInvoiceReceipt from '../pages/Registration/Invoice Receipt/PrintInvoiceReceipt';
import AddMultiInvoiceReceipt from '../pages/Registration/Multi Invoice Receipt/AddMultiInvoiceReceipt';
import AddPurchases from '../pages/Purchase/Purchase/AddPurchases';
import PurchaseList from '../pages/Purchase/Purchase/PurchaseList';
import PrintPurchase from '../pages/Purchase/Purchase/PrintPurchase';
import GRNList from '../pages/Purchase/GRN/GRNList';
import AddGRN from '../pages/Purchase/GRN/AddGRN';
import InwardChallanList from '../pages/Purchase/Inward Challan/InwardChallanList';
import VerifyInward from '../pages/Purchase/Inward Challan/VerifyInward';
import ReturnChallanList from '../pages/Warehouse/Return Challan/ReturnChallanList';
import VerifyReturnChallan from '../pages/Warehouse/Return Challan/VerifyReturnChallan';
import VendorList from '../pages/Purchase/Vendor/VendorList';
import AddVendor from '../pages/Purchase/Vendor/AddVendor';
import PurchaseReceiptList from '../pages/Purchase/Purchase Receipt/PurchaseReceiptList';
import AddPurchaseReceipt from '../pages/Purchase/Purchase Receipt/AddPurchaseReceipt';
import PrintPurchaseReceipt from '../pages/Purchase/Purchase Receipt/PrintPurchaseReceipt';
import PurchaseReturnList from '../pages/Purchase/Purchase Return/PurchaseReturnList';
import AddPurchaseReturn from '../pages/Purchase/Purchase Return/AddPurchaseReturn';
import PrintPurchaseReturn from '../pages/Purchase/Purchase Return/PrintPurchaseReturn';
import PurchaseReturnReceiptList from '../pages/Purchase/Purchase Return Receipt/PurchaseReturnReceiptList';
import AddPurchaseReturnReceipt from '../pages/Purchase/Purchase Return Receipt/AddPurchaseReturnReceipt';
import PrintPurchaseReturnReceipt from '../pages/Purchase/Purchase Return Receipt/PrintPurchaseReturnReceipt';
import ReportDashboard from '../pages/Reports/ReportDashboard';
import SalesReport from '../pages/Reports/Sales Report/SalesReport';
import PurchaseReport from '../pages/Reports/Purchase Report/PurchaseReports';
import StockReport from '../pages/Reports/Stock Report/StockReport';
import AccountReport from '../pages/Reports/Account Report/AccountReport';
import SaleReportPrint from '../pages/Reports/Sales Report/SaleReportPrint';
import SaleReturnReceiptList from '../pages/Sales/Sales Return Receipt/SaleReturnReceiptList';
import SaleReturnReceiptAdd from '../pages/Sales/Sales Return Receipt/SalesReturnReceiptAdd';
import PrintSalesReturnReceipt from '../pages/Sales/Sales Return Receipt/PrintSalesReturnReceipt';
import PurchaseReportPrint from '../pages/Reports/Purchase Report/PurchaseReportPrint';
import StockReportPrint from '../pages/Reports/Stock Report/StockReportPrint';
import AccountReportPrint from '../pages/Reports/Account Report/AccountReportPrint';
import BalanceSheet from '../pages/Reports/BalanceSheet';
import DedicatedReportFilter from '../pages/Reports/DedicatedReportFilter';
import { EmployeesPage } from '../pages/Human Resources/Employees';
import AddEmployee from '../pages/Human Resources/AddEmployee';
import { AttendanceSheetPage } from '../pages/Human Resources/AttendanceSheet';
import { SalarySheetPage } from '../pages/Human Resources/SalarySheet';
import { SalaryStructurePage } from '../pages/Human Resources/SalaryStructure';
import { PayHeadsPage } from '../pages/Human Resources/PayHeads';
import { LeavePage } from '../pages/Human Resources/Leave';
import { LoansPage } from '../pages/Human Resources/Loans';

// Xenith Complete Page Suite
import WarehouseTerminal from '../pages/Inventory/WarehouseTerminal';
import StockAdjustments from '../pages/Inventory/StockAdjustments';
import StockAudits from '../pages/Inventory/StockAudits';
import AdjustmentTypes from '../pages/Inventory/AdjustmentTypes';
import StockLedger from '../pages/Inventory/StockLedger';
import ScheduledValuations from '../pages/Inventory/ScheduledValuations';
import CustomerDueList from '../pages/CRM/CustomerDueList';
import Leads from '../pages/CRM/Leads';
import Quotations from '../pages/CRM/Quotations';
import FollowUps from '../pages/CRM/FollowUps';
import RecoveryHistory from '../pages/CRM/RecoveryHistory';
import SalesOrders from '../pages/Sales/SalesOrders';
import CustomerPriceList from '../pages/Sales/CustomerPriceList';
import PurchaseOrders from '../pages/Purchase/PurchaseOrders';
import SupplierQuotations from '../pages/Purchase/SupplierQuotations';
import VendorLedger from '../pages/Purchase/VendorLedger';
import SubCategories from '../pages/Administration/SubCategories';
import TileDimensions from '../pages/Administration/TileDimensions';
import DriversDirectory from '../pages/Administration/DriversDirectory';
import JournalVouchers from '../pages/Registration/JournalVouchers';
import BankReconciliation from '../pages/Registration/BankReconciliation';
import TrialBalance from '../pages/Registration/TrialBalance';
import PosTerminal from '../pages/POS/PosTerminal';
import PosRegister from '../pages/POS/PosRegister';
import PosHoldOrders from '../pages/POS/PosHoldOrders';
import BarcodeGenerator from '../pages/POS/BarcodeGenerator';

export const adminRoutes = [
  {
    path: '/',
    component: <HomePage />,
    label: 'Home',
    icon: Home,
  },
  {
    path: '/dashboard',
    component: <Dashboard />,
    label: 'Dashboard',
    icon: LayoutDashboard,
    hideFromSidebar: true,
  },
  {
    path: '/Dashboard/Salesman',
    component: <SalesmanDashboard />,
    label: 'Salesman Dashboard',
    icon: Store,
    hideFromSidebar: true,
  },
  {
    path: '/Dashboard/Warehouse',
    component: <WarehouseDashboard />,
    label: 'Warehouse Dashboard',
    icon: Warehouse,
    hideFromSidebar: true,
  },

  // 1. CRM
  {
    label: 'CRM',
    icon: Users,
    children: [
      {
        path: '/crm/leads',
        component: <Leads />,
        label: 'Leads & Inquiries',
        icon: UserPlus
      },
      {
        path: '/crm/quotations',
        component: <Quotations />,
        label: 'Quotations',
        icon: FileText
      },
      {
        path: '/Sales/Customers/List',
        component: <CustomerHistory />,
        label: 'Customers',
        icon: Users
      },
      {
        path: '/Sales/Customers/Add',
        component: <AddCustomer />,
        label: 'Add Customer',
        icon: UserPlus,
        hideFromSidebar: true
      },
      {
        path: '/Sales/Salesman/List',
        component: <SalesmanHistory />,
        label: 'Salesmen',
        icon: Briefcase
      },
      {
        path: '/Sales/Salesman/Add',
        component: <AddSalesman />,
        label: 'Add Salesman',
        icon: UserPlus,
        hideFromSidebar: true
      },
      {
        path: '/crm/due-list',
        component: <CustomerDueList />,
        label: 'Customer Due List',
        icon: AlertCircle
      },
      {
        path: '/crm/follow-ups',
        component: <FollowUps />,
        label: 'Follow-ups',
        icon: CalendarClock
      },
      {
        path: '/crm/recovery-history',
        component: <RecoveryHistory />,
        label: 'Recovery History',
        icon: History
      }
    ]
  },

  // 2. SALES
  {
    label: 'SALES',
    icon: ShoppingCart,
    children: [
      {
        path: '/Sales/Invoice/List',
        component: <SalesHistory />,
        label: 'Sales Invoices',
        icon: Receipt
      },
      {
        path: '/Sales/Invoice/New',
        component: <NewInvoice />,
        label: 'New Invoice',
        icon: FilePlus,
        hideFromSidebar: true
      },
      {
        path: '/sales/orders',
        component: <SalesOrders />,
        label: 'Sales Orders',
        icon: ClipboardList
      },
      {
        path: '/sales/price-lists',
        component: <CustomerPriceList />,
        label: 'Customer Price Lists',
        icon: Tag
      },
      {
        path: '/Sales/Delivery-Challan/List',
        component: <DeliveryChallanHistory />,
        label: 'Delivery Challans',
        icon: Truck
      },
      {
        path: '/Sales/Delivery-Challan/Add',
        component: <AddDeliveryChallan />,
        label: 'Add Challan',
        icon: Plus,
        hideFromSidebar: true
      },
      {
        path: '/Sales/Shop-Dispatch/List',
        component: <ShopDispatchQueue />,
        label: 'Shop Dispatch Queue',
        icon: Send
      },
      {
        path: '/Sales/Sales-Return/List',
        component: <SalesReturnList />,
        label: 'Sales Return',
        icon: Undo2
      },
      {
        path: '/Sales/Sales-Return/Add',
        component: <AddSalesReturn />,
        label: 'Add Sales Return',
        icon: Plus,
        hideFromSidebar: true
      },
      {
        path: '/Sales/Sales-Return-Receipt/List',
        component: <SaleReturnReceiptList />,
        label: 'Return Receipts',
        icon: FileCheck
      },
      {
        path: '/Registration/InvoiceReceipt/List',
        component: <InvoiceReceiptList />,
        label: 'Invoice Receipts',
        icon: CreditCard
      }
    ]
  },

  // 3. PURCHASE
  {
    label: 'PURCHASE',
    icon: ShoppingBag,
    children: [
      {
        path: '/Purchase/Purchases/List',
        component: <PurchaseList />,
        label: 'Supplier Purchases',
        icon: ShoppingBag
      },
      {
        path: '/Purchase/Purchases/Add',
        component: <AddPurchases />,
        label: 'New Purchase',
        icon: FilePlus,
        hideFromSidebar: true
      },
      {
        path: '/purchase/orders',
        component: <PurchaseOrders />,
        label: 'Purchase Orders',
        icon: ClipboardList
      },
      {
        path: '/purchase/quotations',
        component: <SupplierQuotations />,
        label: 'Supplier Quotations',
        icon: FileText
      },
      {
        path: '/Purchase/GRN/List',
        component: <GRNList />,
        label: 'Goods Receiving Note (GRN)',
        icon: PackageCheck
      },
      {
        path: '/Purchase/GRN/Add',
        component: <AddGRN />,
        label: 'Add GRN',
        icon: Plus,
        hideFromSidebar: true
      },
      {
        path: '/Purchase/Inward-Challan/List',
        component: <InwardChallanList />,
        label: 'Inward Challans',
        icon: Truck
      },
      {
        path: '/Purchase/Purchase-Return/List',
        component: <PurchaseReturnList />,
        label: 'Purchase Returns',
        icon: Undo2
      },
      {
        path: '/Purchase/Purchase-Return-Receipt/List',
        component: <PurchaseReturnReceiptList />,
        label: 'Purchase Return Receipts',
        icon: FileCheck
      },
      {
        path: '/Purchase/Purchase-Receipt/List',
        component: <PurchaseReceiptList />,
        label: 'Vendor Payment Receipts',
        icon: CreditCard
      },
      {
        path: '/purchase/vendor-ledger',
        component: <VendorLedger />,
        label: 'Vendor Ledger',
        icon: BookOpen
      },
      {
        path: '/Purchase/Vendor/List',
        component: <VendorList />,
        label: 'Suppliers / Vendors',
        icon: Building2
      },
      {
        path: '/Purchase/Vendor/Add',
        component: <AddVendor />,
        label: 'Add Vendor',
        icon: Plus,
        hideFromSidebar: true
      }
    ]
  },

  // 4. CLASSIFICATION
  {
    label: 'CLASSIFICATION',
    icon: Layers,
    children: [
      {
        path: '/Administration/Categories/List',
        component: <Categories />,
        label: 'Categories',
        icon: Folder
      },
      {
        path: '/administration/subcategories',
        component: <SubCategories />,
        label: 'Sub-Categories',
        icon: FolderTree
      },
      {
        path: '/Administration/Surface-Finish',
        component: <SurfaceFinish />,
        label: 'Brands / Surface Finish',
        icon: Sparkles
      },
      {
        path: '/administration/tile-dimensions',
        component: <TileDimensions />,
        label: 'Tile Dimensions Matrix',
        icon: Ruler
      },
      {
        path: '/Administration/UOM/List',
        component: <UomManager />,
        label: 'Units of Measure (UOM)',
        icon: Scale
      },
      {
        path: '/Administration/Locations/List',
        component: <LocationList />,
        label: 'Locations / Warehouses',
        icon: MapPin
      },
      {
        path: '/Administration/Locations/Add',
        component: <AddLocation />,
        label: 'Add Location',
        icon: Plus,
        hideFromSidebar: true
      },
      {
        path: '/Administration/Transportation/List',
        component: <TransportationList />,
        label: 'Transportation & Couriers',
        icon: Truck
      },
      {
        path: '/administration/drivers',
        component: <DriversDirectory />,
        label: 'Drivers & Fleet Directory',
        icon: Car
      }
    ]
  },

  // 5. ACCOUNTS
  {
    label: 'ACCOUNTS',
    icon: Landmark,
    children: [
      {
        path: '/Registration/Chart-of-Account/List',
        component: <ChartOfAccountList />,
        label: 'Chart of Accounts',
        icon: FolderTree
      },
      {
        path: '/Registration/Chart-of-Account/Add',
        component: <AddChartOfAccount />,
        label: 'Add Account',
        icon: Plus,
        hideFromSidebar: true
      },
      {
        path: '/Registration/Vouchers/List',
        component: <VoucherList />,
        label: 'Financial Vouchers',
        icon: Receipt
      },
      {
        path: '/Registration/Vouchers/Add',
        component: <AddVoucher />,
        label: 'Add Voucher',
        icon: Plus,
        hideFromSidebar: true
      },
      {
        path: '/registration/journal-vouchers',
        component: <JournalVouchers />,
        label: 'Journal Vouchers (JV)',
        icon: BookMarked
      },
      {
        path: '/Registration/Bank-Account/BankAccountList',
        component: <BankAccountList />,
        label: 'Bank Accounts',
        icon: Landmark
      },
      {
        path: '/registration/bank-reconciliation',
        component: <BankReconciliation />,
        label: 'Bank Reconciliation (BRS)',
        icon: FileCheck
      },
      {
        path: '/registration/trial-balance',
        component: <TrialBalance />,
        label: 'Trial Balance',
        icon: Scale
      },
      {
        path: '/Registration/Multi-Invoice-Receipt/Add',
        component: <AddMultiInvoiceReceipt />,
        label: 'Multi-Invoice Receipt',
        icon: Layers
      },
      {
        path: '/Inventory/OpeningStock/List',
        component: <OpeningStockList />,
        label: 'Opening Stock Balance',
        icon: Coins
      }
    ]
  },

  // 6. POS
  {
    label: 'POS',
    icon: Store,
    children: [
      {
        path: '/pos/terminal',
        component: <PosTerminal />,
        label: 'POS Terminal',
        icon: Store
      },
      {
        path: '/pos/register',
        component: <PosRegister />,
        label: 'POS Shift Register',
        icon: Clock
      },
      {
        path: '/pos/hold-orders',
        component: <PosHoldOrders />,
        label: 'Hold Orders Queue',
        icon: PauseCircle
      },
      {
        path: '/pos/barcode-generator',
        component: <BarcodeGenerator />,
        label: 'Barcode Generator',
        icon: Barcode
      }
    ]
  },

  // 7. INVENTORY
  {
    label: 'INVENTORY',
    icon: Warehouse,
    children: [
      {
        path: '/inventory/warehouse-terminal',
        component: <WarehouseTerminal />,
        label: 'Warehouse Terminal',
        icon: Warehouse
      },
      {
        path: '/Administration/Products/List',
        component: <ProductList />,
        label: 'Item Master',
        icon: Boxes
      },
      {
        path: '/Administration/StockTransfer/List',
        component: <StockTransferList />,
        label: 'Stock Movements',
        icon: ArrowLeftRight
      },
      {
        path: '/inventory/stock-adjustments',
        component: <StockAdjustments />,
        label: 'Stock Adjustments',
        icon: SlidersHorizontal
      },
      {
        path: '/inventory/stock-audits',
        component: <StockAudits />,
        label: 'Stock Audits',
        icon: ClipboardCheck
      },
      {
        path: '/inventory/adjustment-types',
        component: <AdjustmentTypes />,
        label: 'Adjustment Types',
        icon: Tag
      },
      {
        path: '/inventory/stock-ledger',
        component: <StockLedger />,
        label: 'Stock Ledger',
        icon: BookOpen
      },
      {
        path: '/inventory/scheduled-valuations',
        component: <ScheduledValuations />,
        label: 'Scheduled Valuations',
        icon: Calendar
      }
    ]
  },

  // 8. REPORTS
  {
    label: 'REPORTS',
    icon: BarChart3,
    children: [
      {
        path: '/Reports/Reports-Dashboard',
        component: <ReportDashboard />,
        label: 'Reports Dashboard',
        icon: LayoutDashboard
      },
      {
        path: '/Reports/Stock-Report',
        component: <StockReport />,
        label: 'Stock Report',
        icon: Boxes
      },
      {
        path: '/Reports/Sales-Report',
        component: <SalesReport />,
        label: 'Sales Report',
        icon: TrendingUp
      },
      {
        path: '/Reports/Purchase-Report',
        component: <PurchaseReport />,
        label: 'Purchase Report',
        icon: ShoppingBag
      },
      {
        path: '/Reports/Account-Report',
        component: <AccountReport />,
        label: 'Account Ledger Report',
        icon: BookOpen
      },
      {
        path: '/Reports/Holding-Report',
        component: <HoldingReport />,
        label: 'Holding Report',
        icon: Layers
      },
      {
        path: '/Reports/Balance-Sheet',
        component: <BalanceSheet />,
        label: 'Balance Sheet & P&L',
        icon: FileSpreadsheet
      }
    ]
  },

  // 9. HUMAN RESOURCE
  {
    label: 'HUMAN RESOURCE',
    icon: UserCheck,
    children: [
      {
        path: '/Human-Resources/Employees',
        component: <EmployeesPage />,
        label: 'Employees Directory',
        icon: Users
      },
      {
        path: '/Human-Resources/Employees/Add',
        component: <AddEmployee />,
        label: 'Add Employee',
        icon: UserPlus,
        hideFromSidebar: true
      },
      {
        path: '/Human-Resources/Attendance',
        component: <AttendanceSheetPage />,
        label: 'Attendance Sheet',
        icon: CalendarCheck2
      },
      {
        path: '/Human-Resources/Salary-Sheet',
        component: <SalarySheetPage />,
        label: 'Salary Sheet',
        icon: Banknote
      },
      {
        path: '/Human-Resources/Salary-Structure',
        component: <SalaryStructurePage />,
        label: 'Salary Structure',
        icon: Coins
      },
      {
        path: '/Human-Resources/Pay-Heads',
        component: <PayHeadsPage />,
        label: 'Pay Heads',
        icon: ListPlus
      },
      {
        path: '/Human-Resources/Leaves',
        component: <LeavePage />,
        label: 'Leave Management',
        icon: CalendarOff
      },
      {
        path: '/Human-Resources/Loans',
        component: <LoansPage />,
        label: 'Loans & Advances',
        icon: HandCoins
      }
    ]
  },

  // 10. ADMINISTRATION
  {
    label: 'ADMINISTRATION',
    icon: ShieldCheck,
    children: [
      {
        path: '/company',
        component: <AddCompany />,
        label: 'Company Profile',
        icon: Building
      },
      {
        path: '/Administration/Products/List',
        component: <ProductList />,
        label: 'Product Catalog',
        icon: PackageSearch
      },
      {
        path: '/Administration/Products/Add',
        component: <AddProduct />,
        label: 'Add Product',
        icon: Plus,
        hideFromSidebar: true
      },
      {
        path: '/Administration/Products/Bulk-Upload',
        component: <BulkProductUpload />,
        label: 'Bulk Product Upload',
        icon: UploadCloud
      }
    ]
  },

  // Print & Hidden Sub-routes
  { path: '/Sales/Invoice/Print/:id', component: <PrintInvoice />, hideFromSidebar: true },
  { path: '/sales/invoice/print/:id', component: <PrintInvoice />, hideFromSidebar: true },
  { path: '/Sales/Delivery-Challan/Print/:id', component: <PrintChallan />, hideFromSidebar: true },
  { path: '/sales/delivery-challan/print/:id', component: <PrintChallan />, hideFromSidebar: true },
  { path: '/Sales/Sales-Return/Print/:id', component: <PrintSalesReturn />, hideFromSidebar: true },
  { path: '/sales/sales-return/print/:id', component: <PrintSalesReturn />, hideFromSidebar: true },
  { path: '/Purchase/Purchases/Print/:id', component: <PrintPurchase />, hideFromSidebar: true },
  { path: '/purchase/purchases/print/:id', component: <PrintPurchase />, hideFromSidebar: true },
  { path: '/Purchase/Inward-Challan/Verify/:id', component: <VerifyInward />, hideFromSidebar: true },
  { path: '/Warehouse/Return-Challan/Verify/:id', component: <VerifyReturnChallan />, hideFromSidebar: true },
  { path: '/Purchase/Purchase-Return/Print/:id', component: <PrintPurchaseReturn />, hideFromSidebar: true },
  { path: '/purchase/purchase-return/print/:id', component: <PrintPurchaseReturn />, hideFromSidebar: true },
  { path: '/Purchase/Purchase-Return-Receipt/Print/:id', component: <PrintPurchaseReturnReceipt />, hideFromSidebar: true },
  { path: '/purchase/purchase-return-receipt/print/:id', component: <PrintPurchaseReturnReceipt />, hideFromSidebar: true },
  { path: '/Purchase/Purchase-Receipt/Print/:id', component: <PrintPurchaseReceipt />, hideFromSidebar: true },
  { path: '/purchase/purchase-receipt/print/:id', component: <PrintPurchaseReceipt />, hideFromSidebar: true },
  { path: '/Sales/Sales-Return-Receipt/Print/:id', component: <PrintSalesReturnReceipt />, hideFromSidebar: true },
  { path: '/sales/sales-return-receipt/print/:id', component: <PrintSalesReturnReceipt />, hideFromSidebar: true },
  { path: '/Registration/InvoiceReceipt/Print/:id', component: <PrintInvoiceReceipt />, hideFromSidebar: true },
  { path: '/Sales/InvoiceReceipt/Print/:id', component: <PrintInvoiceReceipt />, hideFromSidebar: true },
  { path: '/Reports/Sales-Report/Print', component: <SaleReportPrint />, hideFromSidebar: true },
  { path: '/Reports/Purchase-Report/Print', component: <PurchaseReportPrint />, hideFromSidebar: true },
  { path: '/Reports/Stock-Report/Print', component: <StockReportPrint />, hideFromSidebar: true },
  { path: '/Reports/Account-Report/Print', component: <AccountReportPrint />, hideFromSidebar: true },
  { path: '/Reports/Holding-Report/Print', component: <HoldingReportPrint />, hideFromSidebar: true }
];

export const salesmanRoutes = adminRoutes;
export const warehouseRoutes = adminRoutes;
