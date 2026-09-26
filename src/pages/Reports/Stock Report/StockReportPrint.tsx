import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { MdPrint, MdArrowBack, MdFileDownload, MdTableChart, MdViewList, MdWarning, MdCheckCircle, MdErrorOutline, MdFormatListBulleted } from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import { useAuth } from '../../../Context/Auth';
import { exportToExcel, ExcelColumn } from '../../../utils/excelExport';
import ReportPagination from '../../../components/ReportPagination';

const StockReportPrint = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { businessName, tenantId } = useAuth();
    const [loading, setLoading] = useState(true);

    const [reportRows, setReportRows] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<number | 'all'>(25);
    const [isPrinting, setIsPrinting] = useState(false);

    const config = location.state || { tab: 1, filters: {} };
    const { tab: activeTab, filters = {} } = config;
    const [activeViewMode, setActiveViewMode] = useState<'summary' | 'detailed'>(
        filters.viewMode === 'detailed' ? 'detailed' : 'summary'
    );
    const [activeStatusContainerTab, setActiveStatusContainerTab] = useState<string>('out_of_stock');

    useEffect(() => {
        const originalTitle = document.title;
        document.title = 'NHT ENTERPRISES (Noor Horizon Technologies)';

        const handleBeforePrint = () => setIsPrinting(true);
        const handleAfterPrint = () => setIsPrinting(false);

        window.addEventListener('beforeprint', handleBeforePrint);
        window.addEventListener('afterprint', handleAfterPrint);

        return () => {
            document.title = originalTitle;
            window.removeEventListener('beforeprint', handleBeforePrint);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, activeStatusContainerTab, activeViewMode, JSON.stringify(filters)]);

    const statusGroups = useMemo(() => {
        const outOfStock: any[] = [];
        const lowStock: any[] = [];
        const inStock: any[] = [];

        reportRows.forEach((row: any) => {
            const qty = Number(row.computed_true_stock !== undefined ? row.computed_true_stock : row.current_stock || 0);
            if (qty <= 0) {
                outOfStock.push(row);
            } else if (qty <= 10) {
                lowStock.push(row);
            } else {
                inStock.push(row);
            }
        });

        const calcValuation = (list: any[]) => list.reduce((sum, r) => {
            const q = Number(r.computed_true_stock !== undefined ? r.computed_true_stock : r.current_stock || 0);
            const rate = Number(r.retail_price || r.sale_price || r.purchase_price || r.price || 0);
            return sum + Number(r.calculated_valuation !== undefined ? r.calculated_valuation : (q * rate));
        }, 0);

        const calcQty = (list: any[]) => list.reduce((sum, r) => {
            return sum + Number(r.computed_true_stock !== undefined ? r.computed_true_stock : r.current_stock || 0);
        }, 0);

        return [
            {
                key: 'out_of_stock',
                title: 'Out of Stock (Depleted Inventory)',
                subtitle: 'Immediate Procurement Required • 0 or Negative Physical Stock Balance',
                badgeText: 'OUT OF STOCK',
                badgeClass: 'bg-red-100 text-red-800 border-red-300',
                containerBorder: 'border-red-400',
                headerBg: 'bg-red-50 text-red-950 border-red-200',
                headerAccent: 'text-red-700',
                icon: MdErrorOutline,
                items: outOfStock,
                totalQty: calcQty(outOfStock),
                totalValuation: calcValuation(outOfStock)
            },
            {
                key: 'low_stock',
                title: 'Low Stock Alert (Approaching Depletion)',
                subtitle: 'Critical Buffer Zone (1 to 10 Units Remaining) • Reorder Recommended',
                badgeText: 'LOW STOCK ALERT',
                badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
                containerBorder: 'border-amber-400',
                headerBg: 'bg-amber-50 text-amber-950 border-amber-200',
                headerAccent: 'text-amber-700',
                icon: MdWarning,
                items: lowStock,
                totalQty: calcQty(lowStock),
                totalValuation: calcValuation(lowStock)
            },
            {
                key: 'in_stock',
                title: 'In Stock (Healthy Inventory Balances)',
                subtitle: 'Sufficient Available Stock (> 10 Units on Hand) • Ready for Active Sales',
                badgeText: 'HEALTHY / IN STOCK',
                badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                containerBorder: 'border-emerald-400',
                headerBg: 'bg-emerald-50 text-emerald-950 border-emerald-200',
                headerAccent: 'text-emerald-700',
                icon: MdCheckCircle,
                items: inStock,
                totalQty: calcQty(inStock),
                totalValuation: calcValuation(inStock)
            }
        ];
    }, [reportRows]);

    const activeDisplayRows = useMemo(() => {
        if (activeViewMode === 'detailed' && activeTab !== 4 && activeStatusContainerTab !== 'all') {
            const grp = statusGroups.find(g => g.key === activeStatusContainerTab);
            return grp ? grp.items : reportRows;
        }
        return reportRows;
    }, [activeViewMode, activeTab, activeStatusContainerTab, statusGroups, reportRows]);

    const paginatedRows = useMemo(() => {
        if (isPrinting || pageSize === 'all') return activeDisplayRows;
        const limit = typeof pageSize === 'number' ? pageSize : 25;
        const start = (currentPage - 1) * limit;
        return activeDisplayRows.slice(start, start + limit);
    }, [activeDisplayRows, currentPage, pageSize, isPrinting]);

    const startIndex = (currentPage - 1) * (pageSize === 'all' ? 0 : (pageSize as number));

    useEffect(() => {
        const compileTrueDynamicStockDataset = async () => {
            try {
                setLoading(true);

                // Handling Stock Transfer Statement (Tab 4) separately
                if (activeTab === 4) {
                    let transferQuery = supabase.from('stock_transfers').select('*').order('created_at', { ascending: false });
                    const { data: transfers, error: transferError } = await transferQuery;
                    if (transferError) throw transferError;

                    const dateFromClean = filters.dateFrom ? String(filters.dateFrom).trim() : '';
                    const dateToClean = filters.dateTo ? String(filters.dateTo).trim() : '';
                    const targetLocations = (filters.location || []).map((l: string) => l.trim().toLowerCase());
                    const targetEmployees = (filters.employee || []).map((e: string) => e.trim().toLowerCase());
                    const targetProducts = (filters.product || []).map((p: string) => p.trim().toLowerCase());

                    const filteredTransfers = (transfers || []).filter((t: any) => {
                        const tDate = String(t.transfer_date || t.created_at || '').split('T')[0].split(' ')[0];
                        if (dateFromClean && tDate < dateFromClean) return false;
                        if (dateToClean && tDate > dateToClean) return false;

                        if (targetLocations.length > 0) {
                            const fromLoc = String(t.from_location || '').trim().toLowerCase();
                            const toLoc = String(t.to_location || '').trim().toLowerCase();
                            if (!targetLocations.includes(fromLoc) && !targetLocations.includes(toLoc)) return false;
                        }

                        if (targetEmployees.length > 0) {
                            const emp = String(t.employee || t.created_by || '').trim().toLowerCase();
                            if (!targetEmployees.some((te: string) => emp.includes(te))) return false;
                        }

                        if (targetProducts.length > 0) {
                            const itemsArray = Array.isArray(t.items) ? t.items : JSON.parse(t.items || '[]');
                            const hasProd = itemsArray.some((i: any) => {
                                const iName = String(i.itemName || i.product_name || i.item_name || '').trim().toLowerCase();
                                return targetProducts.some((tp: string) => iName.includes(tp));
                            });
                            if (!hasProd) return false;
                        }

                        return true;
                    });

                    setReportRows(filteredTransfers);
                    return;
                }

                // 1. Fetch base product list mapping
                let prodQuery = supabase.from('products').select('*');

                if (filters.bin && filters.bin.length > 0) prodQuery = prodQuery.in('bin', filters.bin);
                if (filters.parentCategory && filters.parentCategory.length > 0) {
                    const pList = filters.parentCategory.map((p: string) => `"${p}"`).join(',');
                    prodQuery = prodQuery.or(`sub_sub_category.in.(${pList}),category.in.(${pList})`);
                }
                if (filters.subCategory && filters.subCategory.length > 0) {
                    prodQuery = prodQuery.in('sub_category', filters.subCategory);
                }
                if (filters.subSubCategory && filters.subSubCategory.length > 0) {
                    const leafList = filters.subSubCategory.map((l: string) => `"${l}"`).join(',');
                    prodQuery = prodQuery.or(`category.in.(${leafList}),sub_sub_category.in.(${leafList})`);
                }

                const { data: baseProducts, error: prodError } = await prodQuery;
                if (prodError) throw prodError;

                // 2. We only fetch raw tables for Tab 8 now. Tabs 1-3 use the RPC.
                let openStocks: any = [], purchases: any = [], sales: any = [], pReturns: any = [], sReturns: any = [];
                if (activeTab === 8) {
                    const [os, p, s, pr, sr] = await Promise.all([
                        supabase.from('opening_stocks').select('*'),
                        supabase.from('supplier_purchases').select('*'),
                        supabase.from('sales_invoices').select('*'),
                        supabase.from('purchase_returns').select('*'),
                        supabase.from('sales_returns').select('*')
                    ]);
                    openStocks = os.data; purchases = p.data; sales = s.data; pReturns = pr.data; sReturns = sr.data;
                }

                const asOfDateClean = (activeTab === 3 && filters.asOfDate) ? String(filters.asOfDate).trim() : '';
                const dateFromClean = filters.dateFrom ? String(filters.dateFrom).trim() : '';
                const dateToClean = asOfDateClean || (filters.dateTo ? String(filters.dateTo).trim() : '');

                const parseDateStr = (item: any, dateFields: string[]) => {
                    for (const f of dateFields) {
                        if (item[f]) {
                            const str = String(item[f]).trim();
                            if (str.includes('T')) return str.split('T')[0];
                            if (str.includes(' ')) return str.split(' ')[0];
                            return str;
                        }
                    }
                    return '';
                };

                // Use first location if multiple selected since RPC doesn't support array easily, or 'All' if empty
                const rpcLoc = (filters.location && filters.location.length > 0) ? filters.location[0] : 'All';
                const { data: stockData, error: stockError } = await supabase.rpc('calculate_dynamic_stock', {
                    p_location: String(rpcLoc),
                    p_start_date: dateFromClean || null,
                    p_end_date: dateToClean || null
                });
                
                if (stockError) {
                    console.error("RPC Error:", stockError);
                    toast.error(stockError.message || "Failed to compile stock data.");
                }

                // Map results back to products
                const stockMap = new Map();
                (stockData || []).forEach((row: any) => {
                    stockMap.set(String(row.product_name).toLowerCase(), row);
                });

                const calculatedAggregatedRows = (baseProducts || []).map(product => {
                    const name = String(product.product_name || '').trim().toLowerCase();
                    const stock = stockMap.get(name) || { opening_stock: 0, prior_in: 0, prior_out: 0, period_in: 0, period_out: 0 };
                    
                    const computedOpening = Number(stock.opening_stock) + Number(stock.prior_in) - Number(stock.prior_out);
                    const netActivity = Number(stock.period_in) - Number(stock.period_out);
                    const trueRemainingStock = computedOpening + netActivity;

                    return {
                        ...product,
                        computed_opening: computedOpening,
                        period_stock_in: Number(stock.period_in),
                        period_stock_out: Number(stock.period_out),
                        net_activity: netActivity,
                        computed_true_stock: trueRemainingStock,
                        calculated_valuation: trueRemainingStock * Number(product.retail_price || product.sale_price || 0)
                    };
                });

                // --- 📍 TAB 8 SPECIFIC: PER-LOCATION DYNAMIC TRANSACTION LEDGER BREAKDOWN ---
                if (activeTab === 8) {
                    const { data: dbLocs } = await supabase.from('inventory_locations').select('name');
                    const registeredLocs = (dbLocs && dbLocs.length > 0)
                        ? dbLocs.map(l => String(l.name).trim())
                        : ['Market', 'Latifabad', 'Main Warehouse'];
                    const { data: transfers } = await supabase.from('stock_transfers').select('*');

                    const locationRows: any[] = [];
                    const targetLocFilter = Array.isArray(filters.location) && filters.location.length > 0 
                        ? filters.location.map((l: string) => l.trim().toLowerCase()) 
                        : [];

                    for (const product of (baseProducts || [])) {
                        const name = String(product.product_name || '').trim().toLowerCase();
                        const rate = Number(product.retail_price || product.sale_price || product.price || 0);

                        const locationStockMap: { [loc: string]: number } = {};

                        const getNormalizedLocName = (rawLoc: string) => {
                            if (!rawLoc) return registeredLocs[0] || 'Market';
                            const clean = String(rawLoc).trim();
                            const matched = registeredLocs.find(l => l.toLowerCase() === clean.toLowerCase());
                            return matched || clean;
                        };

                        // 1. Opening Stock
                        (openStocks || []).forEach((os: any) => {
                            const osName = String(os.product_name || os.item_name || os.itemName || '').trim().toLowerCase();
                            if (osName === name || osName.includes(name)) {
                                const loc = getNormalizedLocName(os.location || os.target_warehouse || os.warehouse_name);
                                const qty = Number(os.quantity || os.qty || 0);
                                locationStockMap[loc] = (locationStockMap[loc] || 0) + qty;
                            }
                        });

                        // 2. Purchases (Stock In)
                        (purchases || []).forEach((p: any) => {
                            if (String(p.status).toLowerCase() !== 'cancel' && String(p.status).toLowerCase() !== 'deleted') {
                                const loc = getNormalizedLocName(p.target_warehouse || p.location);
                                const items = Array.isArray(p.items) ? p.items : JSON.parse(p.items || '[]');
                                items.forEach((i: any) => {
                                    const iName = String(i.product_name || i.itemName || i.item_name || '').trim().toLowerCase();
                                    if (iName === name || iName.includes(name)) {
                                        const qty = Number(i.qty || i.quantity || 0);
                                        locationStockMap[loc] = (locationStockMap[loc] || 0) + qty;
                                    }
                                });
                            }
                        });

                        // 3. Sales Returns (Stock In)
                        (sReturns || []).forEach((sr: any) => {
                            if (String(sr.status).toLowerCase() !== 'cancel') {
                                const loc = getNormalizedLocName(sr.dispatch_warehouse || sr.location);
                                const items = Array.isArray(sr.items) ? sr.items : JSON.parse(sr.items || '[]');
                                items.forEach((i: any) => {
                                    const iName = String(i.product_name || i.itemName || i.item_name || '').trim().toLowerCase();
                                    if (iName === name || iName.includes(name)) {
                                        const qty = Number(i.qty || i.quantity || 0);
                                        locationStockMap[loc] = (locationStockMap[loc] || 0) + qty;
                                    }
                                });
                            }
                        });

                        // 4. Stock Transfers (Movement between locations)
                        (transfers || []).forEach((t: any) => {
                            if (String(t.status).toLowerCase() !== 'cancelled') {
                                const fromLoc = getNormalizedLocName(t.from_location);
                                const toLoc = getNormalizedLocName(t.to_location);
                                const items = Array.isArray(t.items) ? t.items : JSON.parse(t.items || '[]');
                                items.forEach((i: any) => {
                                    const iName = String(i.product_name || i.itemName || i.item_name || '').trim().toLowerCase();
                                    if (iName === name || iName.includes(name)) {
                                        const qty = Number(i.qty || i.quantity || 0);
                                        locationStockMap[fromLoc] = (locationStockMap[fromLoc] || 0) - qty;
                                        locationStockMap[toLoc] = (locationStockMap[toLoc] || 0) + qty;
                                    }
                                });
                            }
                        });

                        // 5. Sales Invoices (Stock Out)
                        (sales || []).forEach((s: any) => {
                            const statusClean = String(s.sale_status || '').trim().toLowerCase();
                            if (statusClean !== 'cancel' && statusClean !== 'deleted') {
                                const loc = getNormalizedLocName(s.dispatch_warehouse || s.location);
                                const items = Array.isArray(s.items) ? s.items : JSON.parse(s.items || '[]');
                                items.forEach((i: any) => {
                                    const iName = String(i.product_name || i.itemName || i.item_name || '').trim().toLowerCase();
                                    if (iName === name || iName.includes(name)) {
                                        const qty = Number(i.qty || i.quantity || 0);
                                        locationStockMap[loc] = (locationStockMap[loc] || 0) - qty;
                                    }
                                });
                            }
                        });

                        // 6. Purchase Returns (Stock Out)
                        (pReturns || []).forEach((pr: any) => {
                            if (String(pr.status).toLowerCase() !== 'cancel') {
                                const loc = getNormalizedLocName(pr.source_warehouse || pr.location);
                                const items = Array.isArray(pr.items) ? pr.items : JSON.parse(pr.items || '[]');
                                items.forEach((i: any) => {
                                    const iName = String(i.product_name || i.itemName || i.item_name || '').trim().toLowerCase();
                                    if (iName === name || iName.includes(name)) {
                                        const qty = Number(i.qty || i.quantity || 0);
                                        locationStockMap[loc] = (locationStockMap[loc] || 0) - qty;
                                    }
                                });
                            }
                        });

                        const activeLocations = Object.keys(locationStockMap);
                        if (activeLocations.length === 0) {
                            activeLocations.push(registeredLocs[0] || 'Market');
                            locationStockMap[activeLocations[0]] = Number(product.current_stock || product.stock || 0);
                        }

                        for (const locName of activeLocations) {
                            const qty = locationStockMap[locName] || 0;
                            if (targetLocFilter.length === 0 || targetLocFilter.includes(locName.toLowerCase())) {
                                locationRows.push({
                                    ...product,
                                    id: `${product.id}_${locName}`,
                                    warehouse_location: locName,
                                    computed_true_stock: qty,
                                    calculated_valuation: qty * rate
                                });

                                // warehouse_inventory retired — formula-based stock is source of truth
                            }
                        }
                    }

                    const applyStockSort = (list: any[]) => {
                        const sb = filters.sortBy || 'name_asc';
                        return [...list].sort((a: any, b: any) => {
                            if (sb === 'name_asc') return (a.product_name || '').localeCompare(b.product_name || '');
                            if (sb === 'name_desc') return (b.product_name || '').localeCompare(a.product_name || '');
                            if (sb === 'qty_desc') {
                                const qA = Number(a.computed_true_stock ?? a.current_stock ?? a.stock ?? 0);
                                const qB = Number(b.computed_true_stock ?? b.current_stock ?? b.stock ?? 0);
                                return qB - qA;
                            }
                            if (sb === 'qty_asc') {
                                const qA = Number(a.computed_true_stock ?? a.current_stock ?? a.stock ?? 0);
                                const qB = Number(b.computed_true_stock ?? b.current_stock ?? b.stock ?? 0);
                                return qA - qB;
                            }
                            if (sb === 'amount_desc') {
                                const vA = Number(a.calculated_valuation ?? ((a.computed_true_stock ?? a.current_stock ?? 0) * (a.cost_price ?? a.retail_price ?? 0)));
                                const vB = Number(b.calculated_valuation ?? ((b.computed_true_stock ?? b.current_stock ?? 0) * (b.cost_price ?? b.retail_price ?? 0)));
                                return vB - vA;
                            }
                            if (sb === 'amount_asc') {
                                const vA = Number(a.calculated_valuation ?? ((a.computed_true_stock ?? a.current_stock ?? 0) * (a.cost_price ?? a.retail_price ?? 0)));
                                const vB = Number(b.calculated_valuation ?? ((b.computed_true_stock ?? b.current_stock ?? 0) * (b.cost_price ?? b.retail_price ?? 0)));
                                return vA - vB;
                            }
                            return (a.product_name || '').localeCompare(b.product_name || '');
                        });
                    };

                    let finalLocPool = locationRows;
                    if (filters.product && filters.product.length > 0) {
                        finalLocPool = finalLocPool.filter(p => filters.product.includes(p.product_name));
                    }
                    setReportRows(applyStockSort(finalLocPool));
                    setLoading(false);
                    return;
                }

                let finalFilteredPool = calculatedAggregatedRows;

                if (filters.product && filters.product.length > 0) {
                    finalFilteredPool = finalFilteredPool.filter(p => filters.product.includes(p.product_name));
                }

                const applyStockSort = (list: any[]) => {
                    const sb = filters.sortBy || 'name_asc';
                    return [...list].sort((a: any, b: any) => {
                        if (sb === 'name_asc') return (a.product_name || '').localeCompare(b.product_name || '');
                        if (sb === 'name_desc') return (b.product_name || '').localeCompare(a.product_name || '');
                        if (sb === 'qty_desc') {
                            const qA = Number(a.computed_true_stock ?? a.current_stock ?? a.stock ?? 0);
                            const qB = Number(b.computed_true_stock ?? b.current_stock ?? b.stock ?? 0);
                            return qB - qA;
                        }
                        if (sb === 'qty_asc') {
                            const qA = Number(a.computed_true_stock ?? a.current_stock ?? a.stock ?? 0);
                            const qB = Number(b.computed_true_stock ?? b.current_stock ?? b.stock ?? 0);
                            return qA - qB;
                        }
                        if (sb === 'amount_desc') {
                            const vA = Number(a.calculated_valuation ?? ((a.computed_true_stock ?? a.current_stock ?? 0) * (a.cost_price ?? a.retail_price ?? 0)));
                            const vB = Number(b.calculated_valuation ?? ((b.computed_true_stock ?? b.current_stock ?? 0) * (b.cost_price ?? b.retail_price ?? 0)));
                            return vB - vA;
                        }
                        if (sb === 'amount_asc') {
                            const vA = Number(a.calculated_valuation ?? ((a.computed_true_stock ?? a.current_stock ?? 0) * (a.cost_price ?? a.retail_price ?? 0)));
                            const vB = Number(b.calculated_valuation ?? ((b.computed_true_stock ?? b.current_stock ?? 0) * (b.cost_price ?? b.retail_price ?? 0)));
                            return vA - vB;
                        }
                        return (a.product_name || '').localeCompare(b.product_name || '');
                    });
                };

                setReportRows(applyStockSort(finalFilteredPool));
            } catch (err: any) {
                toast.error('Dynamic inventory matching trace failed: ' + err.message);
            } finally {
                setLoading(false);
            }
        };
        compileTrueDynamicStockDataset();
    }, [activeTab, filters]);

    const [exporting, setExporting] = useState(false);

    const handleExportExcel = async () => {
        try {
            setExporting(true);
            const tabTitles: Record<number, string> = {
                1: 'Stock Activity Report',
                2: 'Stock Balance Report',
                3: 'Stock Status Report',
                4: 'Stock Transfer Statement',
                5: 'Stock Detail With Price',
                6: 'Product Catalog Specs',
                7: 'Stock Status Detail',
                8: 'Per Location Stock Ledger'
            };

            const tabTitle = tabTitles[activeTab] || 'Stock Report';
            const filterMeta = {
                'Report Tab': tabTitle,
                'Brand': filters.bin?.length > 0 ? filters.bin.join(', ') : 'All',
                'Category': [filters.parentCategory?.join(', '), filters.subCategory?.join(', '), filters.subSubCategory?.join(', ')].filter(c => c && c.length > 0).join(' / ') || 'All',
                'Product': filters.product?.length > 0 ? filters.product.join(', ') : 'All',
                'Location': filters.location?.length > 0 ? filters.location.join(', ') : 'All',
                'Date Window': filters.dateFrom || filters.dateTo ? `${filters.dateFrom || 'Start'} to ${filters.dateTo || 'End'}` : 'All Time'
            };

            let columns: ExcelColumn[] = [];
            let exportData: any[] = [];

            if (activeTab === 1) {
                columns = [
                    { header: 'S#', key: 'idx', width: 8, alignment: 'center' },
                    { header: 'Product Item Name', key: 'product_name', width: 28 },

                    { header: 'Brand / Category', key: 'category', width: 16 },
                    { header: 'Opening Stock', key: 'computed_opening', width: 16, type: 'number' },
                    { header: 'Stock In', key: 'period_stock_in', width: 14, type: 'number' },
                    { header: 'Stock Out', key: 'period_stock_out', width: 14, type: 'number' },
                    { header: 'Net Movement', key: 'net_activity', width: 16, type: 'number' },
                    { header: 'Ending Stock', key: 'computed_true_stock', width: 16, type: 'number' },
                    { header: 'Valuation (Rs.)', key: 'calculated_valuation', width: 20, type: 'currency' }
                ];
                exportData = reportRows.map((r, i) => ({ idx: i + 1, ...r }));
            } else if (activeTab === 4) {
                columns = [
                    { header: 'S#', key: 'idx', width: 8, alignment: 'center' },
                    { header: 'Transfer Date', key: 'date', width: 16, type: 'date' },
                    { header: 'Transfer ID', key: 'transfer_no', width: 16 },
                    { header: 'Origin Warehouse', key: 'from_location', width: 20 },
                    { header: 'Target Warehouse', key: 'to_location', width: 20 },
                    { header: 'Handler Employee', key: 'employee', width: 18 },
                    { header: 'Total Quantity', key: 'total_quantity', width: 16, type: 'number' }
                ];
                exportData = reportRows.map((r, i) => ({
                    idx: i + 1,
                    date: r.transfer_date || String(r.created_at || '').split('T')[0],
                    transfer_no: r.transfer_no || `TR-${r.id}`,
                    from_location: r.from_location,
                    to_location: r.to_location,
                    employee: r.employee || r.created_by || 'Officer',
                    total_quantity: Number(r.total_quantity || 0)
                }));
            } else {
                columns = [
                    { header: 'S#', key: 'idx', width: 8, alignment: 'center' },
                    { header: 'Product Item Name', key: 'product_name', width: 28 },

                    { header: 'Brand / Category', key: 'category', width: 16 },
                    { header: 'UOM', key: 'uom', width: 12 },
                    { header: 'Current Stock', key: 'current_stock', width: 16, type: 'number' },
                    { header: 'Unit Rate (Rs.)', key: 'price', width: 16, type: 'currency' },
                    { header: 'Valuation (Rs.)', key: 'valuation', width: 20, type: 'currency' }
                ];
                exportData = reportRows.map((r, i) => {
                    const stk = Number(r.computed_true_stock !== undefined ? r.computed_true_stock : r.current_stock || 0);
                    const prc = Number(r.retail_price || r.sale_price || r.price || 0);
                    return {
                        idx: i + 1,
                        product_name: r.product_name,
                        category: `${r.bin || 'N/A'} / ${r.category || '-'}`,
                        uom: r.uom || 'Pcs',
                        current_stock: stk,
                        price: prc,
                        valuation: stk * prc
                    };
                });
            }

            await exportToExcel({
                fileName: `Stock_Report_Tab${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`,
                sheetName: tabTitle.substring(0, 30),
                companyName: businessName || 'ZOAIB ALI & COMPANY',
                reportTitle: `Master Dynamic Inventory - ${tabTitle}`,
                filterSummary: filterMeta,
                columns,
                data: exportData,
                theme: 'emerald'
            });

            toast.success('Excel workbook exported successfully!');
        } catch (err: any) {
            console.error(err);
            toast.error('Export failed: ' + err.message);
        } finally {
            setExporting(false);
        }
    };

    const handleShareWhatsApp = () => {
        const lines = [
            `📊 *${businessName || 'ZOAIB ALI & COMPANY'}*`,
            `📦 *Stock Valuation & Inventory Summary*`,
            `━━━━━━━━━━━━━━━━━━━━━`,
            `📑 *SKU Products Tracked:* ${reportRows.length}`,
            `📅 *Generated:* ${new Date().toISOString().split('T')[0]}`,
            `━━━━━━━━━━━━━━━━━━━━━`,
            `_Automated ERP Inventory Ledger_`
        ];
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
    };

    if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

    return (
        <div className="w-full bg-white text-black p-6 space-y-6 text-xs min-h-screen print:p-0 print:m-0 print:bg-white print:text-black print:min-h-0 print:h-auto">
            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          @page { size: auto; margin: 12mm 10mm 12mm 10mm; }
          body, html { height: auto !important; min-height: 0 !important; overflow: visible !important; background: white !important; }
          body * { visibility: hidden !important; }
          .print-root-container, .print-root-container * { visibility: visible !important; }
          .print-root-container { position: static !important; width: 100% !important; height: auto !important; min-height: 0 !important; overflow: visible !important; background: white !important; padding: 0 !important; margin: 0 !important; }
          aside, header, nav, footer, .print-hidden-element, button { display: none !important; visibility: hidden !important; }
          table { page-break-inside: auto !important; }
          tr, td, th { page-break-inside: avoid !important; break-inside: avoid !important; }
          thead { display: table-header-group !important; }
          tfoot { display: table-footer-group !important; }
        }
      `}} />

            <div className="print-root-container w-full bg-white p-4 space-y-6 print:p-0 print:space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-3 rounded border print-hidden-element print:hidden">
                    <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 font-bold hover:underline cursor-pointer"><MdArrowBack size={16} /> Back to Report Filter</button>
                    
                    {/* View Switcher Toggle */}
                    {activeTab !== 4 && (
                        <div className="flex bg-slate-200 p-0.5 rounded-lg border border-slate-300">
                            <button
                                type="button"
                                onClick={() => setActiveViewMode('summary')}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                                    activeViewMode === 'summary' ? 'bg-white text-primary shadow-xs font-black' : 'text-slate-600 hover:text-black'
                                }`}
                            >
                                <MdTableChart size={14} /> Standard View
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveViewMode('detailed')}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                                    activeViewMode === 'detailed' ? 'bg-white text-primary shadow-xs font-black' : 'text-slate-600 hover:text-black'
                                }`}
                            >
                                <MdViewList size={14} /> Grouped Status Containers
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            disabled={exporting}
                            onClick={handleExportExcel}
                            className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white py-1.5 px-3.5 rounded font-bold cursor-pointer transition shadow-sm disabled:opacity-50"
                        >
                            <MdFileDownload size={16} /> {exporting ? 'Exporting...' : 'Export Excel'}
                        </button>
                        <button type="button" onClick={() => window.print()} className="flex items-center gap-1.5 bg-primary text-white py-1.5 px-4 rounded font-black cursor-pointer hover:bg-opacity-90 transition shadow-sm"><MdPrint size={16} /> Print Report</button>
                    </div>
                </div>

                <div className="text-center space-y-1 py-4 border-b border-double border-slate-300">
                    <h1 className="text-xl font-black uppercase tracking-widest font-serif">ZOAIB ALI & COMPANY</h1>
                    <p className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Master Dynamic Inventory Valuation & Real-Time Stock Balance Ledger</p>

                    <div className="text-[10px] pt-1 font-mono flex justify-between px-2 text-gray-600">
                        <span>Workbook Subtype: <b className="text-black uppercase underline">
                            {activeTab === 1 && 'Stock Activity Report'}
                            {activeTab === 2 && 'Stock Balance Report'}
                            {activeTab === 3 && 'Stock Status Report'}
                            {activeTab === 4 && 'Stock Transfer Statement'}
                            {activeTab === 5 && 'Detailed Pricing Metrics Sheet'}
                            {activeTab === 6 && 'Core Product Specification Log'}
                            {activeTab === 7 && 'Status Detail Valuation Ledger'}
                            {activeTab === 8 && 'Location Stock Breakdown Statement'}
                        </b></span>
                        {(activeTab === 1 || activeTab === 4) && filters.dateFrom && filters.dateTo && (
                            <span className="font-bold text-primary">
                                Date Period: {filters.dateFrom} to {filters.dateTo}
                            </span>
                        )}
                        <span>
                            {(activeTab === 3 || activeTab === 8) && filters.asOfDate
                                ? `Audit Evaluation Date (As Of): ${filters.asOfDate}`
                                : `Live Audit Evaluation Date: ${new Date().toLocaleDateString()}`}
                        </span>
                    </div>
                </div>

                <ReportPagination
                    totalCount={activeDisplayRows.length}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(newSize) => {
                        setPageSize(newSize);
                        setCurrentPage(1);
                    }}
                />

                <div className="w-full overflow-x-auto">
                    {/* --- 📑 DETAILED VIEW: GROUPED STOCK AVAILABILITY STATUS CONTAINERS --- */}
                    {activeViewMode === 'detailed' && activeTab !== 4 ? (
                        <div className="space-y-6">
                            {/* Screen-Only Container Tabs */}
                            <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-slate-100/90 rounded-xl border border-slate-200 print-hidden-element print:hidden">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[11px] font-black text-slate-500 uppercase px-2 font-mono">Status Container Tabs:</span>
                                    {statusGroups.map((group) => {
                                        const Icon = group.icon;
                                        const isActive = activeStatusContainerTab === group.key;
                                        return (
                                            <button
                                                key={group.key}
                                                type="button"
                                                onClick={() => setActiveStatusContainerTab(group.key)}
                                                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                                    isActive
                                                        ? `${group.headerBg} border-2 ${group.containerBorder} shadow-sm font-black scale-[1.02]`
                                                        : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs'
                                                }`}
                                            >
                                                <Icon className={`w-4 h-4 ${isActive ? group.headerAccent : 'text-slate-400'}`} />
                                                <span>{group.title.split('(')[0].trim()}</span>
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                                                    isActive ? 'bg-white/90 border border-slate-300 text-slate-900' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {group.items.length} SKUs
                                                </span>
                                            </button>
                                        );
                                    })}
                                    <button
                                        type="button"
                                        onClick={() => setActiveStatusContainerTab('all')}
                                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                            activeStatusContainerTab === 'all'
                                                ? 'bg-slate-800 text-white shadow-sm font-black border-2 border-slate-900'
                                                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
                                        }`}
                                    >
                                        <MdFormatListBulleted size={15} />
                                        <span>All Containers</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                                            activeStatusContainerTab === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                            {statusGroups.reduce((acc, g) => acc + g.items.length, 0)} SKUs
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {statusGroups.map((group) => {
                                const Icon = group.icon;
                                const isVisibleOnScreen = activeStatusContainerTab === 'all' || activeStatusContainerTab === group.key;
                                return (
                                    <div
                                        key={group.key}
                                        className={`border-2 ${group.containerBorder} rounded-lg overflow-hidden shadow-xs bg-white ${
                                            isVisibleOnScreen ? 'block' : 'hidden'
                                        } print:block print:mb-8 print:break-inside-avoid`}
                                    >
                                        {/* Status Container Header Banner */}
                                        <div className={`${group.headerBg} p-3 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-2 font-mono`}>
                                            <div className="flex items-center gap-2.5">
                                                <Icon className={`w-5 h-5 ${group.headerAccent} shrink-0`} />
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-sans font-black text-sm uppercase tracking-wide text-slate-900">{group.title}</span>
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${group.badgeClass}`}>
                                                            {group.badgeText}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-gray-600 font-mono mt-0.5">{group.subtitle}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-mono font-bold flex-wrap">
                                                <span className="bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-800">
                                                    <b>{group.items.length}</b> SKUs
                                                </span>
                                                <span className="bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-900">
                                                    Total Units: <b>{group.totalQty.toLocaleString()}</b>
                                                </span>
                                                <span className="bg-white px-2 py-0.5 rounded border border-slate-300 text-emerald-800 font-black">
                                                    Total Valuation: <b>Rs. {group.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
                                                </span>
                                            </div>
                                        </div>

                                        {/* Container Table */}
                                        {group.items.length === 0 ? (
                                            <div className="py-8 text-center text-gray-400 italic font-mono text-xs bg-gray-50/50">
                                                No products currently categorized under {group.title}.
                                            </div>
                                        ) : (
                                            <table className="w-full table-auto border border-collapse border-slate-300 text-[11px] font-sans text-left">
                                                <thead className="bg-slate-50 border-b border-slate-300 font-black uppercase text-black font-mono text-[10px]">
                                                    <tr>
                                                        <th rowSpan={2} className="p-2 border border-slate-300 text-center w-12">Index</th>
                                                        <th rowSpan={2} className="p-2 border border-slate-300">Product Stock Asset Identifier</th>
                                                        <th rowSpan={2} className="p-2 border border-slate-300 w-28">Location</th>
                                                        <th rowSpan={2} className="p-2 border border-slate-300 text-center w-20">Brand</th>
                                                        <th colSpan={3} className="p-1.5 border border-slate-300 text-center bg-slate-100 font-extrabold tracking-wider">Category Classification</th>
                                                        <th rowSpan={2} className="p-2 border border-slate-300 text-right pr-2">Unit Rate (Rs.)</th>
                                                        <th rowSpan={2} className="p-2 border border-slate-300 text-right pr-2">Remaining Qty</th>
                                                        <th rowSpan={2} className="p-2 border border-slate-300 text-right pr-3">Asset Valuation (Rs.)</th>
                                                    </tr>
                                                    <tr>
                                                        <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Parent</th>
                                                        <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Sub</th>
                                                        <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Leaf</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {((activeStatusContainerTab === group.key && !isPrinting && pageSize !== 'all') ? paginatedRows : group.items).map((row, idx) => {
                                                        const qty = Number(row.computed_true_stock !== undefined ? row.computed_true_stock : row.current_stock || 0);
                                                        const rate = Number(row.retail_price || row.sale_price || row.purchase_price || row.price || 0);
                                                        const val = Number(row.calculated_valuation !== undefined ? row.calculated_valuation : (qty * rate));
                                                        const loc = row.warehouse_location || (filters.location && filters.location !== 'All' ? filters.location : 'Main Facility');
                                                        const displayIdx = (!isPrinting && pageSize !== 'all' && activeStatusContainerTab === group.key)
                                                            ? (currentPage - 1) * (typeof pageSize === 'number' ? pageSize : 25) + idx + 1
                                                            : idx + 1;

                                                        return (
                                                            <tr key={row.id || idx} className="border-b border-slate-300 hover:bg-gray-50 font-semibold font-mono text-xs">
                                                                <td className="p-2 border border-slate-300 text-center text-gray-400">{displayIdx}</td>
                                                                <td className="p-2 border border-slate-300 font-bold text-black font-sans uppercase">{row.product_name}</td>
                                                                <td className="p-2 border border-slate-300 font-sans text-gray-700 font-bold">{loc}</td>
                                                                <td className="p-2 border border-slate-300 font-sans text-purple-700 font-bold text-center">{row.bin || '-'}</td>
                                                                <td className="p-2 border border-slate-300 font-sans text-slate-800">{row.sub_sub_category || '-'}</td>
                                                                <td className="p-2 border border-slate-300 font-sans text-slate-700">{row.sub_category || '-'}</td>
                                                                <td className="p-2 border border-slate-300 font-sans text-slate-600">{row.category || '-'}</td>
                                                                <td className="p-2 border border-slate-300 text-right pr-2 font-mono text-gray-700">
                                                                    {rate > 0 ? `Rs. ${rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                                                                </td>
                                                                <td className={`p-2 border border-slate-300 text-right pr-2 font-black ${qty <= 0 ? 'text-red-700' : qty <= 10 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                                                    {qty.toLocaleString()} {row.uom || 'PC'}
                                                                </td>
                                                                <td className="p-2 border border-slate-300 text-right pr-3 font-mono font-bold text-slate-900">
                                                                    {val > 0 ? `Rs. ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                                <tfoot>
                                                    {!isPrinting && pageSize !== 'all' && activeStatusContainerTab === group.key && (
                                                        <tr className="bg-amber-50/80 border-t border-amber-200 font-bold font-mono text-xs text-amber-950">
                                                            <td colSpan={7} className="p-2 border border-slate-300 text-right uppercase tracking-wider">
                                                                Page Subtotal (This Page):
                                                            </td>
                                                            <td className="p-2 border border-slate-300 text-right pr-2 font-mono">-</td>
                                                            <td className="p-2 border border-slate-300 text-right pr-2 font-black text-primary">
                                                                {paginatedRows.reduce((sum, r) => sum + Number(r.computed_true_stock !== undefined ? r.computed_true_stock : r.current_stock || 0), 0).toLocaleString()}
                                                            </td>
                                                            <td className="p-2 border border-slate-300 text-right pr-3 text-success font-black">
                                                                Rs. {paginatedRows.reduce((sum, r) => {
                                                                    const q = Number(r.computed_true_stock !== undefined ? r.computed_true_stock : r.current_stock || 0);
                                                                    const rate = Number(r.retail_price || r.sale_price || r.purchase_price || r.price || 0);
                                                                    return sum + Number(r.calculated_valuation !== undefined ? r.calculated_valuation : (q * rate));
                                                                }, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </td>
                                                        </tr>
                                                    )}
                                                    <tr className="bg-slate-100 border-t-2 border-slate-400 font-black font-mono text-xs">
                                                        <td colSpan={7} className="p-2 border border-slate-300 text-right uppercase tracking-wider text-gray-800">
                                                            Total for {group.title} ({group.items.length} SKUs):
                                                        </td>
                                                        <td className="p-2 border border-slate-300 text-right pr-2">-</td>
                                                        <td className="p-2 border border-slate-300 text-right pr-2 font-black text-slate-900">
                                                            {group.totalQty.toLocaleString()}
                                                        </td>
                                                        <td className="p-2 border border-slate-300 text-right pr-3 text-emerald-800 font-black">
                                                            Rs. {group.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <>
                            {/* --- 📊 RENDER CHANNEL 1: STOCK ACTIVITY REPORT (TAB 1) --- */}
                            {activeTab === 1 && (
                                <table className="w-full table-auto border border-collapse border-slate-300 text-[11px] font-sans text-left">
                                    <thead className="bg-slate-50 border-b border-slate-300 font-black uppercase text-black font-mono text-[10px]">
                                <tr>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-10">Index</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300">Product Stock Asset Identifier</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-16">Group (UOM)</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-20">Brand</th>
                                    <th colSpan={3} className="p-1.5 border border-slate-300 text-center bg-slate-100 font-extrabold tracking-wider">Category Classification</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-right pr-2">Opening Stock</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-right pr-2 text-emerald-700">Stock In</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-right pr-2 text-rose-700">Stock Out</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-right pr-2">Net Movement</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-right pr-3 font-bold">Remaining Stock</th>
                                </tr>
                                <tr>
                                    <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Parent</th>
                                    <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Sub</th>
                                    <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Leaf</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRows.map((row, idx) => (
                                    <tr key={row.id} className="border-b border-slate-300 hover:bg-gray-50 font-semibold font-mono text-xs">
                                        <td className="p-2 border border-slate-300 text-center text-gray-400">{startIndex + idx + 1}</td>
                                        <td className="p-2 border border-slate-300 font-bold text-black font-sans uppercase">{row.product_name}</td>
                                        <td className="p-2 border border-slate-300 uppercase text-center">{row.uom || 'PC'}</td>
                                        <td className="p-2 border border-slate-300 font-sans text-purple-700 font-bold text-center">{row.bin || '-'}</td>
                                        <td className="p-2 border border-slate-300 font-sans text-slate-800">{row.sub_sub_category || '-'}</td>
                                        <td className="p-2 border border-slate-300 font-sans text-slate-700">{row.sub_category || '-'}</td>
                                        <td className="p-2 border border-slate-300 font-sans text-slate-600">{row.category || '-'}</td>
                                        <td className="p-2 border border-slate-300 text-right pr-2 font-mono text-gray-700">{Number(row.computed_opening || 0).toLocaleString()}</td>
                                        <td className="p-2 border border-slate-300 text-right pr-2 font-mono text-emerald-700 font-bold">+{Number(row.period_stock_in || 0).toLocaleString()}</td>
                                        <td className="p-2 border border-slate-300 text-right pr-2 font-mono text-rose-700 font-bold">-{Number(row.period_stock_out || 0).toLocaleString()}</td>
                                        <td className={`p-2 border border-slate-300 text-right pr-2 font-mono font-bold ${row.net_activity >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                            {row.net_activity > 0 ? `+${row.net_activity.toLocaleString()}` : row.net_activity.toLocaleString()}
                                        </td>
                                        <td className="p-2 border border-slate-300 text-right pr-3 text-success font-black font-mono">{Number(row.computed_true_stock || 0).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                {!isPrinting && pageSize !== 'all' && (
                                    <tr className="bg-amber-50/80 border-t border-amber-200 font-bold font-mono text-xs text-amber-950">
                                        <td colSpan={7} className="p-2 border border-slate-300 text-right uppercase tracking-wider">Page Subtotal (This Page):</td>
                                        <td className="p-2 border border-slate-300 text-right pr-2 text-gray-700">{paginatedRows.reduce((s, r) => s + (r.computed_opening || 0), 0).toLocaleString()}</td>
                                        <td className="p-2 border border-slate-300 text-right pr-2 text-emerald-700">+{paginatedRows.reduce((s, r) => s + (r.period_stock_in || 0), 0).toLocaleString()}</td>
                                        <td className="p-2 border border-slate-300 text-right pr-2 text-red-700">-{paginatedRows.reduce((s, r) => s + (r.period_stock_out || 0), 0).toLocaleString()}</td>
                                        <td className="p-2 border border-slate-300 text-right pr-2 text-purple-700">{paginatedRows.reduce((s, r) => s + (r.net_activity || 0), 0).toLocaleString()}</td>
                                        <td className="p-2 border border-slate-300 text-right pr-3 text-success font-black">{paginatedRows.reduce((s, r) => s + (r.computed_true_stock || 0), 0).toLocaleString()}</td>
                                    </tr>
                                )}
                                <tr className="bg-slate-100 border-t-2 border-slate-400 font-black font-mono text-xs">
                                    <td colSpan={7} className="p-2 border border-slate-300 text-right uppercase tracking-wider text-gray-800">Grand Total Summary (All {reportRows.length} Records):</td>
                                    <td className="p-2 border border-slate-300 text-right pr-2 text-gray-700">{reportRows.reduce((s, r) => s + (r.computed_opening || 0), 0).toLocaleString()}</td>
                                    <td className="p-2 border border-slate-300 text-right pr-2 text-emerald-700">+{reportRows.reduce((s, r) => s + (r.period_stock_in || 0), 0).toLocaleString()}</td>
                                    <td className="p-2 border border-slate-300 text-right pr-2 text-red-700">-{reportRows.reduce((s, r) => s + (r.period_stock_out || 0), 0).toLocaleString()}</td>
                                    <td className="p-2 border border-slate-300 text-right pr-2 text-purple-700">{reportRows.reduce((s, r) => s + (r.net_activity || 0), 0).toLocaleString()}</td>
                                    <td className="p-2 border border-slate-300 text-right pr-3 text-success font-black">{reportRows.reduce((s, r) => s + (r.computed_true_stock || 0), 0).toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    )}

                    {/* --- 📊 RENDER CHANNEL 2: STANDARD LEDGER BALANCES & VALUATION (TABS 2, 6) --- */}
                    {(activeTab === 2 || activeTab === 6) && (
                        <table className="w-full table-auto border border-collapse border-slate-300 text-[11px] font-sans text-left">
                            <thead className="bg-slate-50 border-b border-slate-300 font-black uppercase text-black font-mono text-[10px]">
                                <tr>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-12">Index</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300">Product Stock Asset Identifier</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-16">Group (UOM)</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-20">Brand</th>
                                    <th colSpan={3} className="p-1.5 border border-slate-300 text-center bg-slate-100 font-extrabold tracking-wider">Category Classification</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-right pr-2">Dynamic Remaining Quantity</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-right pr-2">Unit Rate (Rs.)</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-right pr-3">Total Valuation (Rs.)</th>
                                </tr>
                                <tr>
                                    <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Parent</th>
                                    <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Sub</th>
                                    <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Leaf</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRows.map((row, idx) => {
                                    const qty = Number(row.computed_true_stock || 0);
                                    const rate = Number(row.retail_price || row.sale_price || row.purchase_price || 0);
                                    const val = Number(row.calculated_valuation ?? (qty * rate));

                                    return (
                                        <tr key={row.id} className="border-b border-slate-300 hover:bg-gray-50 font-semibold font-mono text-xs">
                                            <td className="p-2 border border-slate-300 text-center text-gray-400">{startIndex + idx + 1}</td>
                                            <td className="p-2 border border-slate-300 font-bold text-black font-sans uppercase">{row.product_name}</td>
                                            <td className="p-2 border border-slate-300 uppercase text-center">{row.uom || 'PC'}</td>
                                            <td className="p-2 border border-slate-300 font-sans text-purple-700 font-bold text-center">{row.bin || '-'}</td>
                                            <td className="p-2 border border-slate-300 font-sans text-slate-800">{row.sub_sub_category || '-'}</td>
                                            <td className="p-2 border border-slate-300 font-sans text-slate-700">{row.sub_category || '-'}</td>
                                            <td className="p-2 border border-slate-300 font-sans text-slate-600">{row.category || '-'}</td>
                                            <td className="p-2 border border-slate-300 text-right pr-2 text-success font-black">{qty.toLocaleString()}</td>
                                            <td className="p-2 border border-slate-300 text-right pr-2 font-mono text-gray-700">{rate > 0 ? rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                                            <td className="p-2 border border-slate-300 text-right pr-3 font-mono font-bold text-slate-900">{val > 0 ? val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                {!isPrinting && pageSize !== 'all' && (
                                    <tr className="bg-amber-50/80 border-t border-amber-200 font-bold font-mono text-xs text-amber-950">
                                        <td colSpan={7} className="p-2 border border-slate-300 text-right uppercase tracking-wider">Page Subtotal (This Page):</td>
                                        <td className="p-2 border border-slate-300 text-right pr-2 text-success font-black text-sm">{paginatedRows.reduce((s, r) => s + (r.computed_true_stock || 0), 0).toLocaleString()}</td>
                                        <td className="p-2 border border-slate-300 text-right pr-2">-</td>
                                        <td className="p-2 border border-slate-300 text-right pr-3 text-slate-900 font-black text-sm">{paginatedRows.reduce((s, r) => s + (Number(r.calculated_valuation ?? ((r.computed_true_stock || 0) * (r.retail_price || r.sale_price || r.purchase_price || 0)))), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                )}
                                <tr className="bg-slate-100 border-t-2 border-slate-400 font-black font-mono text-xs">
                                    <td colSpan={7} className="p-2 border border-slate-300 text-right uppercase tracking-wider text-gray-800">Grand Total Balance Sum (All {reportRows.length} Records):</td>
                                    <td className="p-2 border border-slate-300 text-right pr-2 text-success font-black text-sm">{reportRows.reduce((s, r) => s + (r.computed_true_stock || 0), 0).toLocaleString()}</td>
                                    <td className="p-2 border border-slate-300 text-right pr-2">-</td>
                                    <td className="p-2 border border-slate-300 text-right pr-3 text-emerald-800 font-black text-sm">Rs. {reportRows.reduce((s, r) => s + (Number(r.calculated_valuation ?? ((r.computed_true_stock || 0) * (r.retail_price || r.sale_price || r.purchase_price || 0)))), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                            </tfoot>
                        </table>
                    )}

                    {/* --- 📊 RENDER CHANNEL 3: STOCK STATUS REPORT (TAB 3) --- */}
                    {activeTab === 3 && (
                        <table className="w-full table-auto border border-collapse border-slate-300 text-[11px] font-sans text-left">
                            <thead className="bg-slate-50 border-b border-slate-300 font-black uppercase text-black font-mono text-[10px]">
                                <tr>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-12">Index</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300">Product Stock Asset Identifier</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300">Warehouse Location</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-20">Brand</th>
                                    <th colSpan={3} className="p-1.5 border border-slate-300 text-center bg-slate-100 font-extrabold tracking-wider">Category Classification</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-center">Stock Availability Status</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-right pr-3">Dynamic Remaining Quantity</th>
                                </tr>
                                <tr>
                                    <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Parent</th>
                                    <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Sub</th>
                                    <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Leaf</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRows.map((row, idx) => {
                                    const qty = Number(row.computed_true_stock || 0);
                                    const loc = filters.location && filters.location !== 'All' ? filters.location : 'All Warehouses';

                                    let statusBadge = (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-green-100 text-green-800 border border-green-300">
                                            In Stock
                                        </span>
                                    );
                                    if (qty <= 0) {
                                        statusBadge = (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-100 text-red-800 border border-red-300">
                                                Out of Stock
                                            </span>
                                        );
                                    } else if (qty <= 10) {
                                        statusBadge = (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-yellow-100 text-yellow-800 border border-yellow-300">
                                                Low Stock
                                            </span>
                                        );
                                    }

                                    return (
                                        <tr key={row.id} className="border-b border-slate-300 hover:bg-gray-50 font-semibold font-mono text-xs">
                                            <td className="p-2 border border-slate-300 text-center text-gray-400">{startIndex + idx + 1}</td>
                                            <td className="p-2 border border-slate-300 font-bold text-black font-sans uppercase">{row.product_name}</td>
                                            <td className="p-2 border border-slate-300 font-sans text-gray-700 font-bold">{loc}</td>
                                            <td className="p-2 border border-slate-300 font-sans text-purple-700 font-bold text-center">{row.bin || '-'}</td>
                                            <td className="p-2 border border-slate-300 font-sans text-slate-800">{row.sub_sub_category || '-'}</td>
                                            <td className="p-2 border border-slate-300 font-sans text-slate-700">{row.sub_category || '-'}</td>
                                            <td className="p-2 border border-slate-300 font-sans text-slate-600">{row.category || '-'}</td>
                                            <td className="p-2 border border-slate-300 text-center">{statusBadge}</td>
                                            <td className="p-2 border border-slate-300 text-right pr-3 text-success font-black">{qty.toLocaleString()}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                {!isPrinting && pageSize !== 'all' && (
                                    <tr className="bg-amber-50/80 border-t border-amber-200 font-bold font-mono text-xs text-amber-950">
                                        <td colSpan={8} className="p-2 border border-slate-300 text-right uppercase tracking-wider">Page Subtotal (This Page):</td>
                                        <td className="p-2 border border-slate-300 text-right pr-3 text-success font-black text-sm">{paginatedRows.reduce((s, r) => s + (r.computed_true_stock || 0), 0).toLocaleString()}</td>
                                    </tr>
                                )}
                                <tr className="bg-slate-100 border-t-2 border-slate-400 font-black font-mono text-xs">
                                    <td colSpan={8} className="p-2 border border-slate-300 text-right uppercase tracking-wider text-gray-800">Grand Total Available Units (All {reportRows.length} Records):</td>
                                    <td className="p-2 border border-slate-300 text-right pr-3 text-success font-black text-sm">{reportRows.reduce((s, r) => s + (r.computed_true_stock || 0), 0).toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    )}

                    {/* --- 📊 RENDER CHANNEL 3: STOCK TRANSFER STATEMENT (TAB 4) --- */}
                    {activeTab === 4 && (
                        <table className="w-full table-auto border border-collapse border-slate-300 text-[11px] font-sans text-left">
                            <thead className="bg-slate-50 border-b border-slate-300 font-black uppercase text-black font-mono text-[10px]">
                                <tr>
                                    <th className="p-2 border border-slate-300 text-center w-12">Index</th>
                                    <th className="p-2 border border-slate-300">Transfer Slip #</th>
                                    <th className="p-2 border border-slate-300">Transfer Date</th>
                                    <th className="p-2 border border-slate-300">From Location</th>
                                    <th className="p-2 border border-slate-300">To Location</th>
                                    <th className="p-2 border border-slate-300">Items Transferred</th>
                                    <th className="p-2 border border-slate-300 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRows.map((tr, idx) => {
                                    const itemsArray = Array.isArray(tr.items) ? tr.items : JSON.parse(tr.items || '[]');
                                    const itemSummary = itemsArray.map((i: any) => `${i.itemName || i.product_name} (${i.qty || 1} ${i.uom || ''})`).join(', ');

                                    return (
                                        <tr key={tr.id} className="border-b border-slate-300 hover:bg-gray-50 font-semibold font-mono text-xs">
                                            <td className="p-2 border border-slate-300 text-center text-gray-400">{startIndex + idx + 1}</td>
                                            <td className="p-2 border border-slate-300 font-bold text-primary font-sans">{tr.transfer_no || `TRF-${tr.id}`}</td>
                                            <td className="p-2 border border-slate-300">{tr.transfer_date || tr.created_at?.split('T')[0]}</td>
                                            <td className="p-2 border border-slate-300 font-sans text-red-700 font-bold">{tr.from_location}</td>
                                            <td className="p-2 border border-slate-300 font-sans text-green-700 font-bold">{tr.to_location}</td>
                                            <td className="p-2 border border-slate-300 font-sans text-gray-700">{itemSummary || 'N/A'}</td>
                                            <td className="p-2 border border-slate-300 text-center font-bold text-purple-700 uppercase">{tr.status || 'Confirmed'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}

                    {/* --- 📊 RENDER CHANNEL 4: REAL-TIME ADAPTIVE PRICING COLUMNS VISIBILITY SHEET (TAB 5) --- */}
                    {activeTab === 5 && (
                        <table className="w-full table-auto border border-collapse border-slate-300 text-[11px] font-sans text-left">
                            <thead className="bg-slate-50 border-b border-slate-300 font-black uppercase text-black font-mono text-[10px]">
                                <tr>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-12">Index</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300">Product Stock Asset Name</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-16">Group (UOM)</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-20">Brand</th>
                                    <th colSpan={3} className="p-1.5 border border-slate-300 text-center bg-slate-100 font-extrabold tracking-wider">Category Classification</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-16">Bal Qty</th>
                                    {filters.showSalePrice && <th rowSpan={2} className="p-2 border border-slate-300 text-right w-28">Retail Sale (PKR)</th>}
                                    {filters.showPurchasePrice && <th rowSpan={2} className="p-2 border border-slate-300 text-right w-28">Purchase Cost (PKR)</th>}
                                    {filters.showFinalPrice && <th rowSpan={2} className="p-2 border border-slate-300 text-right w-32 pr-3">Net Asset Valuation</th>}
                                    {filters.showSpecifications && <th rowSpan={2} className="p-2 border border-slate-300 font-sans text-gray-500">Technical Specifications Sheet Overview</th>}
                                </tr>
                                <tr>
                                    <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Parent</th>
                                    <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Sub</th>
                                    <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Leaf</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRows.map((row, idx) => {
                                    const qty = Number(row.computed_true_stock || 0);
                                    const sPrice = Number(row.sale_price ?? row.retail_price ?? row.price ?? row.unit_price ?? row.mrp ?? row.rp ?? 0);
                                    const pPrice = Number(row.purchase_price ?? row.cost_price ?? row.buy_price ?? row.cost ?? row.tp ?? 0);
                                    const netValue = qty * sPrice;

                                    return (
                                        <tr key={row.id} className="border-b border-slate-300 hover:bg-gray-50 font-semibold font-mono text-xs">
                                            <td className="p-2 border border-slate-300 text-center text-gray-400">{startIndex + idx + 1}</td>
                                            <td className="p-2 border border-slate-300 font-bold text-black font-sans uppercase">{row.product_name}</td>
                                            <td className="p-2 border border-slate-300 uppercase text-center">{row.uom || 'PC'}</td>
                                            <td className="p-2 border border-slate-300 font-sans text-purple-700 font-bold text-center">{row.bin || '-'}</td>
                                            <td className="p-2 border border-slate-300 font-sans text-slate-800">{row.sub_sub_category || '-'}</td>
                                            <td className="p-2 border border-slate-300 font-sans text-slate-700">{row.sub_category || '-'}</td>
                                            <td className="p-2 border border-slate-300 font-sans text-slate-600">{row.category || '-'}</td>
                                            <td className="p-2 border border-slate-300 text-center text-primary font-black">{qty.toLocaleString()}</td>
                                            {filters.showSalePrice && <td className="p-2 border border-slate-300 text-right text-gray-600">Rs. {sPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>}
                                            {filters.showPurchasePrice && <td className="p-2 border border-slate-300 text-right text-purple-700">Rs. {pPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>}
                                            {filters.showFinalPrice && <td className="p-2 border border-slate-300 text-right text-success font-black pr-3">Rs. {netValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>}
                                            {filters.showSpecifications && (
                                                 <td className="p-2 border border-slate-300 font-sans text-[10px] text-gray-500 whitespace-normal break-words leading-relaxed max-w-sm">
                                                    {row.product_description || row.specifications || row.description || (row.hs_code ? `HS: ${row.hs_code}` : 'N/A')}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                {!isPrinting && pageSize !== 'all' && (
                                    <tr className="bg-amber-50/80 border-t border-amber-200 font-bold font-mono text-xs text-amber-950">
                                        <td colSpan={7} className="p-2 border border-slate-300 text-right uppercase tracking-wider">Page Subtotal (This Page):</td>
                                        <td className="p-2 border border-slate-300 text-center text-primary font-black">{paginatedRows.reduce((s, r) => s + (r.computed_true_stock || 0), 0).toLocaleString()}</td>
                                        {filters.showSalePrice && <td className="p-2 border border-slate-300"></td>}
                                        {filters.showPurchasePrice && <td className="p-2 border border-slate-300"></td>}
                                        {filters.showFinalPrice && (
                                            <td className="p-2 border border-slate-300 text-right pr-3 text-success font-black text-sm">
                                                Rs. {paginatedRows.reduce((s, r) => {
                                                    const q = Number(r.computed_true_stock || 0);
                                                    const sp = Number(r.sale_price ?? r.retail_price ?? r.price ?? r.unit_price ?? r.mrp ?? r.rp ?? 0);
                                                    return s + (q * sp);
                                                }, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                        )}
                                        {filters.showSpecifications && <td className="p-2 border border-slate-300"></td>}
                                    </tr>
                                )}
                                <tr className="bg-slate-100 border-t-2 border-slate-400 font-black font-mono text-xs">
                                    <td colSpan={7} className="p-2 border border-slate-300 text-right uppercase tracking-wider text-gray-800">Grand Total Assets Valuation (All {reportRows.length} Records):</td>
                                    <td className="p-2 border border-slate-300 text-center text-primary font-black">{reportRows.reduce((s, r) => s + (r.computed_true_stock || 0), 0).toLocaleString()}</td>
                                    {filters.showSalePrice && <td className="p-2 border border-slate-300"></td>}
                                    {filters.showPurchasePrice && <td className="p-2 border border-slate-300"></td>}
                                    {filters.showFinalPrice && (
                                        <td className="p-2 border border-slate-300 text-right pr-3 text-success font-black text-sm">
                                            Rs. {reportRows.reduce((s, r) => {
                                                const q = Number(r.computed_true_stock || 0);
                                                const sp = Number(r.sale_price ?? r.retail_price ?? r.price ?? r.unit_price ?? r.mrp ?? r.rp ?? 0);
                                                return s + (q * sp);
                                            }, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                    )}
                                    {filters.showSpecifications && <td className="p-2 border border-slate-300"></td>}
                                </tr>
                            </tfoot>
                        </table>
                    )}

                    {/* --- 📊 RENDER CHANNEL 5: FINANCIAL REAL-TIME VALUE TIERS SUMMARY STATEMENT (TAB 7) --- */}
                    {activeTab === 7 && (
                        <table className="w-full table-auto border border-collapse border-slate-300 text-[11px] font-sans text-left">
                            <thead className="bg-slate-50 border-b border-slate-300 font-black uppercase text-black font-mono text-[10px]">
                                <tr>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-12">Index</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300">Stock Asset Description</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-20">Brand</th>
                                    <th colSpan={3} className="p-1.5 border border-slate-300 text-center bg-slate-100 font-extrabold tracking-wider">Category Classification</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-20">Units Count</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-right w-24">Unit Rate</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-right w-36 pr-4 bg-green-50/30 text-success">Aggregated StockValue</th>
                                </tr>
                                <tr>
                                    <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Parent</th>
                                    <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Sub</th>
                                    <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Leaf</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRows.map((row, idx) => {
                                    const qty = Number(row.computed_true_stock || 0);
                                    const rate = Number(row.retail_price || row.sale_price || 0);

                                    return (
                                        <tr key={row.id} className="border-b border-slate-300 hover:bg-gray-50 font-semibold font-mono text-xs">
                                            <td className="p-2 border border-slate-300 text-center text-gray-400">{startIndex + idx + 1}</td>
                                            <td className="p-2 border border-slate-300 font-bold text-black font-sans uppercase">{row.product_name}</td>
                                            <td className="p-2 border border-slate-300 font-sans text-purple-700 font-bold text-center">{row.bin || '-'}</td>
                                            <td className="p-2 border border-slate-300 font-sans text-slate-800">{row.sub_sub_category || '-'}</td>
                                            <td className="p-2 border border-slate-300 font-sans text-slate-700">{row.sub_category || '-'}</td>
                                            <td className="p-2 border border-slate-300 font-sans text-slate-600">{row.category || '-'}</td>
                                            <td className="p-2 border border-slate-300 text-center text-primary font-black">{qty.toLocaleString()}</td>
                                            <td className="p-2 border border-slate-300 text-right">Rs. {rate.toLocaleString()}</td>
                                            <td className="p-2 border border-slate-300 text-right pr-4 text-success font-black bg-success/5">Rs. {row.calculated_valuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                {!isPrinting && pageSize !== 'all' && (
                                    <tr className="bg-amber-50/80 border-t border-amber-200 font-bold font-mono text-xs text-amber-950">
                                        <td colSpan={6} className="p-2 border border-slate-300 text-right uppercase tracking-wider">Page Subtotal (This Page):</td>
                                        <td className="p-2 border border-slate-300 text-center text-primary font-black">{paginatedRows.reduce((s, r) => s + (r.computed_true_stock || 0), 0).toLocaleString()}</td>
                                        <td className="p-2 border border-slate-300"></td>
                                        <td className="p-2 border border-slate-300 text-right pr-4 text-success text-sm font-black">
                                            Rs. {paginatedRows.reduce((sum, r) => sum + (r.calculated_valuation || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                )}
                                <tr className="bg-slate-100 border-t-2 border-slate-400 font-black font-mono text-xs">
                                    <td colSpan={6} className="p-2 border border-slate-300 text-right uppercase tracking-wider text-gray-800">Gross StockValue Assets Allocation (All {reportRows.length} Records):</td>
                                    <td className="p-2 border border-slate-300 text-center text-primary font-black">{reportRows.reduce((s, r) => s + (r.computed_true_stock || 0), 0).toLocaleString()}</td>
                                    <td className="p-2 border border-slate-300"></td>
                                    <td className="p-2 border border-slate-300 text-right pr-4 text-success underline decoration-double text-sm bg-success/10 font-black">
                                        Rs. {reportRows.reduce((sum, r) => sum + (r.calculated_valuation || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    )}

                    {/* --- 📊 RENDER CHANNEL 6: LOCATION WAREHOUSE STOCK AUDIT STATEMENT (TAB 8) --- */}
                    {activeTab === 8 && (
                        <table className="w-full table-auto border border-collapse border-slate-300 text-[11px] font-sans text-left">
                            <thead className="bg-slate-50 border-b border-slate-300 font-black uppercase text-black font-mono text-[10px]">
                                <tr>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-12">Index</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300">Warehouse Location</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300">Product Stock Asset Name</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-16">Group (UOM)</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-20">Brand</th>
                                    <th colSpan={3} className="p-1.5 border border-slate-300 text-center bg-slate-100 font-extrabold tracking-wider">Category Classification</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-24">Available Stock</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-right w-28">Unit Sale Rate</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-right w-36 pr-3 text-success">Location Asset Valuation</th>
                                    <th rowSpan={2} className="p-2 border border-slate-300 text-center w-24">Stock Availability</th>
                                </tr>
                                <tr>
                                    <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Parent</th>
                                    <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Sub</th>
                                    <th className="p-1 border border-slate-300 text-center font-bold bg-slate-50 text-[9px]">Leaf</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRows.map((row, idx) => {
                                    const qty = Number(row.computed_true_stock || 0);
                                    const sPrice = Number(row.sale_price ?? row.retail_price ?? row.price ?? row.unit_price ?? row.mrp ?? row.rp ?? 0);
                                    const netValue = qty * sPrice;
                                    const locName = row.warehouse_location || (filters.location && filters.location !== 'All' ? filters.location : 'Main Warehouse');

                                    let statusBadge = (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-green-100 text-green-800 border border-green-300">
                                            In Stock
                                        </span>
                                    );
                                    if (qty <= 0) {
                                        statusBadge = (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-100 text-red-800 border border-red-300">
                                                Out of Stock
                                            </span>
                                        );
                                    } else if (qty <= 10) {
                                        statusBadge = (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-yellow-100 text-yellow-800 border border-yellow-300">
                                                Low Stock
                                            </span>
                                        );
                                    }

                                    return (
                                        <tr key={row.id || idx} className="border-b border-slate-300 hover:bg-gray-50 font-semibold font-mono text-xs">
                                            <td className="p-2 border border-slate-300 text-center text-gray-400">{startIndex + idx + 1}</td>
                                            <td className="p-2 border border-slate-300 font-sans font-bold text-purple-800 uppercase bg-purple-50/40">{locName}</td>
                                            <td className="p-2 border border-slate-300 font-bold text-black font-sans uppercase">{row.product_name}</td>
                                            <td className="p-2 border border-slate-300 uppercase text-center">{row.uom || 'PC'}</td>
                                            <td className="p-2 border border-slate-300 font-sans text-purple-700 font-bold text-center">{row.bin || '-'}</td>
                                            <td className="p-2 border border-slate-300 font-sans text-slate-800">{row.sub_sub_category || '-'}</td>
                                            <td className="p-2 border border-slate-300 font-sans text-slate-700">{row.sub_category || '-'}</td>
                                            <td className="p-2 border border-slate-300 font-sans text-slate-600">{row.category || '-'}</td>
                                            <td className="p-2 border border-slate-300 text-center text-primary font-black text-sm">{qty.toLocaleString()}</td>
                                            <td className="p-2 border border-slate-300 text-right text-gray-600">Rs. {sPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="p-2 border border-slate-300 text-right text-success font-black pr-3 bg-success/5">Rs. {netValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="p-2 border border-slate-300 text-center">{statusBadge}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                {!isPrinting && pageSize !== 'all' && (
                                    <tr className="bg-amber-50/80 border-t border-amber-200 font-bold font-mono text-xs text-amber-950">
                                        <td colSpan={8} className="p-2 border border-slate-300 text-right uppercase tracking-wider">Page Subtotal (This Page):</td>
                                        <td className="p-2 border border-slate-300 text-center text-primary font-black text-sm">{paginatedRows.reduce((s, r) => s + (r.computed_true_stock || 0), 0).toLocaleString()}</td>
                                        <td className="p-2 border border-slate-300"></td>
                                        <td className="p-2 border border-slate-300 text-right pr-3 text-success font-black text-sm bg-success/10">
                                            Rs. {paginatedRows.reduce((sum, r) => {
                                                const q = Number(r.computed_true_stock || 0);
                                                const sp = Number(r.sale_price ?? r.retail_price ?? r.price ?? r.unit_price ?? r.mrp ?? r.rp ?? 0);
                                                return sum + (q * sp);
                                            }, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-2 border border-slate-300"></td>
                                    </tr>
                                )}
                                <tr className="bg-slate-100 border-t-2 border-slate-400 font-black font-mono text-xs">
                                    <td colSpan={8} className="p-2 border border-slate-300 text-right uppercase tracking-wider text-gray-800">Grand Total Location Summary (All {reportRows.length} Records):</td>
                                    <td className="p-2 border border-slate-300 text-center text-primary font-black text-sm">{reportRows.reduce((s, r) => s + (r.computed_true_stock || 0), 0).toLocaleString()}</td>
                                    <td className="p-2 border border-slate-300"></td>
                                    <td className="p-2 border border-slate-300 text-right pr-3 text-success font-black text-sm bg-success/10">
                                        Rs. {reportRows.reduce((sum, r) => {
                                            const q = Number(r.computed_true_stock || 0);
                                            const sp = Number(r.sale_price ?? r.retail_price ?? r.price ?? r.unit_price ?? r.mrp ?? r.rp ?? 0);
                                            return sum + (q * sp);
                                        }, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-2 border border-slate-300"></td>
                                </tr>
                            </tfoot>
                        </table>
                    )}
                        </>
                    )}

                    {reportRows.length === 0 && (
                        <div className="p-12 text-center border font-bold italic text-gray-400 bg-gray-50/50">No true live ledger rows discovered matching chosen criteria tokens.</div>
                    )}
                </div>

                <ReportPagination
                    totalCount={activeDisplayRows.length}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(newSize) => {
                        setPageSize(newSize);
                        setCurrentPage(1);
                    }}
                />



                {/* ✍️ Formal Multi-Level Executive Verification & Signature Block */}
                <div className="mt-16 grid grid-cols-3 gap-10 text-center text-[10px] font-sans font-black uppercase tracking-wider text-slate-800 break-inside-avoid">
                    <div className="flex flex-col justify-end">
                        <div className="signature-spacer h-20 min-h-[80px]" style={{ height: '80px', minHeight: '80px' }}></div>
                        <div className="border-t-2 border-black pt-2">
                            <div className="text-black font-extrabold text-[10px]">PREPARED BY</div>
                            <div className="text-[8.5px] font-semibold text-gray-500 normal-case">Warehouse Inventory Controller &amp; Inward Lead</div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-end">
                        <div className="signature-spacer h-20 min-h-[80px]" style={{ height: '80px', minHeight: '80px' }}></div>
                        <div className="border-t-2 border-black pt-2">
                            <div className="text-black font-extrabold text-[10px]">VERIFIED BY</div>
                            <div className="text-[8.5px] font-semibold text-gray-500 normal-case">Stock Valuation Auditor &amp; Quality Lead</div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-end">
                        <div className="signature-spacer h-20 min-h-[80px]" style={{ height: '80px', minHeight: '80px' }}></div>
                        <div className="border-t-2 border-black pt-2">
                            <div className="text-black font-extrabold text-[10px]">AUTHORIZED BY</div>
                            <div className="text-[8.5px] font-semibold text-gray-500 normal-case">Managing Executive Director &amp; Official Seal</div>
                        </div>
                    </div>
                </div>

                {/* 🏢 Software & Corporate Provider Footer */}
                <div className="mt-8 pt-3 border-t border-gray-300 flex justify-between items-center text-[10px] text-gray-600 font-sans print:border-gray-400 break-inside-avoid">
                    <div className="flex items-center gap-2 font-bold">
                        <span className="text-black font-black uppercase">ZOAIB ALI &amp; COMPANY</span>
                    </div>
                    <div className="text-[9.5px] text-gray-600 font-mono font-medium text-right">
                        Software Solution &amp; Cloud Infrastructure by <b className="text-black font-bold">NHT ENTERPRISES (Noor Horizon Technologies)</b>
                        <span className="text-gray-400 mx-1.5">•</span>
                        <span>Contact: <b className="text-black font-bold">03128039911</b></span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockReportPrint;

