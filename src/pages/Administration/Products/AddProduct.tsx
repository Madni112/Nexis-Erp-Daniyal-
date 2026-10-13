// Helper: parse tile dimensions (h × w) from sub_category, description, or SKU
const parseTileDimensions = (data: any) => {
  if (!data) return { h: 24, w: 24 };
  const text = `${data?.sub_category || ''} ${data?.product_description || ''} ${data?.item_sr_no || ''}`;
  const match = text.match(/(\d+(?:\.\d+)?)\s*(?:[xX×*])\s*(\d+(?:\.\d+)?)/);
  if (match) {
    return {
      h: Number(match[1]) || 24,
      w: Number(match[2]) || 24
    };
  }
  return { h: 24, w: 24 };
};

const parsePiecesPerBox = (data: any) => {
  if (!data) return 4;
  const raw = Number(data?.pieces_per_box ?? data?.pcs_per_box ?? data?.pieces_per_packing ?? 0);
  if (raw >= 1) return raw;
  const match = String(data?.product_description || '').match(/Box:\s*(\d+)\s*pcs/i);
  if (match && Number(match[1]) > 0) return Number(match[1]);
  return 4;
};

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { useAuth } from '../../../Context/Auth';
import { MdSquareFoot, MdViewModule, MdAttachMoney, MdLayers, MdClose, MdSave, MdFormatColorFill, MdAdd, MdDelete, MdInfo, MdLabelOutline } from 'react-icons/md';
import SearchableDropdown from '../../../components/SearchableDropdown';
import AppCombobox from '../../../components/AppCombobox';



interface UomItem {
  id: number;
  short_code: string;
  full_name: string;
  category: string;
  is_active: boolean;
}

const AddProduct = () => {
  const { tenantId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(true);
  
  // Master database lists
  const [categories, setCategories] = useState<any[]>([]);

  const [surfaceFinishes, setSurfaceFinishes] = useState<any[]>([]);
  const [groupedUoms, setGroupedUoms] = useState<{ [key: string]: UomItem[] }>({});





  const [isUomDropdownOpen, setIsUomDropdownOpen] = useState(false);
  const [highlightedUomIndex, setHighlightedUomIndex] = useState(0);


  const location = useLocation();
  const navigate = useNavigate();

  const editData = location.state?.product;
  const isEditMode = !!editData;

  // Quick Create Modal State
  const [quickCreateType, setQuickCreateType] = useState<'parent' | 'sub' | 'category' | 'brand' | 'uom' | null>(null);
  const [quickCreateName, setQuickCreateName] = useState('');
  const [quickCreateFullName, setQuickCreateFullName] = useState('');
  const [quickCreateUomCategory, setQuickCreateUomCategory] = useState('Count & Units');
  const [quickCreateLoading, setQuickCreateLoading] = useState(false);
  const [quickCreateSetFieldValue, setQuickCreateSetFieldValue] = useState<((field: string, value: any) => void) | null>(null);
  const [quickCreateCurrentValues, setQuickCreateCurrentValues] = useState<any>(null);

  const fetchAllMasterMetadata = useCallback(async () => {
    try {
      setMetadataLoading(true);
      const activeTenant = tenantId || 'bashir';
      
      const { data: catData } = await supabase
        .from('inventory_categories')
        .select('*')
        .order('name', { ascending: true });

      setCategories(catData || []);

      try {
        const { data: finishData } = await supabase
          .from('inventory_surface_finishes')
          .select('id, name')
          .order('name', { ascending: true });

        let brandList: any[] = finishData && finishData.length > 0 ? finishData : [];
        if (brandList.length === 0) {
          const local = localStorage.getItem('zac_surface_finishes');
          if (local) brandList = JSON.parse(local);
        }

        const { data: prodBrands } = await supabase
          .from('products')
          .select('bin, brand');

        if (prodBrands) {
          const existingNames = new Set(brandList.map((b: any) => (typeof b === 'string' ? b : b.name).toLowerCase()));
          prodBrands.forEach((p: any) => {
            const name = (p.brand || p.bin || '').trim();
            if (name && !existingNames.has(name.toLowerCase())) {
              existingNames.add(name.toLowerCase());
              brandList.push({ id: name, name });
            }
          });
        }
        setSurfaceFinishes(brandList);
      } catch (e) {
        console.warn('Brand loading error:', e);
      }

      const { data: uomData } = await supabase
        .from('inventory_uom')
        .select('*')
        .eq('tenant_id', activeTenant)
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('short_code', { ascending: true });

      let finalUoms = uomData;
      if (!finalUoms || finalUoms.length === 0) {
        const { data: fallbackData } = await supabase
          .from('inventory_uom')
          .select('*')
          .eq('is_active', true);
        finalUoms = fallbackData || [];
      }

      if (finalUoms && finalUoms.length > 0) {
        const groups = finalUoms.reduce((acc: { [key: string]: UomItem[] }, curr: UomItem) => {
          if (!acc[curr.category]) acc[curr.category] = [];
          acc[curr.category].push(curr);
          return acc;
        }, {});
        setGroupedUoms(groups);
      }
    } catch (err: any) {
      console.error('Metadata aggregation error: ', err.message);
      toast.error('Failed to load setup configurations');
    } finally {
      setMetadataLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchAllMasterMetadata();
  }, [fetchAllMasterMetadata]);

  const handleOpenQuickCreate = (
    type: 'parent' | 'sub' | 'category' | 'brand' | 'uom',
    currentValues: any,
    setFieldValue: (field: string, value: any) => void
  ) => {
    if (type === 'sub' && !currentValues?.subSubCategory?.trim()) {
      toast.error('Please select or add a Parent Category first');
      return;
    }
    if (type === 'category' && !currentValues?.subCategory?.trim()) {
      toast.error('Please select or add a Sub Category first');
      return;
    }

    setQuickCreateType(type);
    setQuickCreateCurrentValues(currentValues);
    setQuickCreateSetFieldValue(() => setFieldValue);

    if (type === 'parent') setQuickCreateName(currentValues?.subSubCategory || '');
    else if (type === 'sub') setQuickCreateName(currentValues?.subCategory || '');
    else if (type === 'category') setQuickCreateName(currentValues?.category || '');
    else if (type === 'brand') setQuickCreateName(currentValues?.finishType || '');
    else if (type === 'uom') {
      const u = currentValues?.uom;
      setQuickCreateName(u && u !== 'PCS' && u !== 'BOX' ? u : '');
      setQuickCreateFullName('');
      setQuickCreateUomCategory('Count & Units');
    }
  };

  const handleSaveQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = quickCreateName.trim();
    if (!cleanName) {
      toast.error('Please enter a name');
      return;
    }

    try {
      setQuickCreateLoading(true);
      const activeTenant = tenantId || 'bashir';

      if (quickCreateType === 'parent') {
        const existing = categories.find(
          c => !c.parent_id && c.name?.toLowerCase() === cleanName.toLowerCase()
        );
        if (existing) {
          toast.success(`Parent category "${cleanName}" selected!`);
          quickCreateSetFieldValue?.('subSubCategory', cleanName);
          quickCreateSetFieldValue?.('subCategory', '');
          quickCreateSetFieldValue?.('category', '');
          setQuickCreateType(null);
          return;
        }

        const { data, error } = await supabase
          .from('inventory_categories')
          .insert([{ name: cleanName, parent_id: null, tenant_id: activeTenant }])
          .select()
          .single();

        if (error) throw error;

        toast.success(`Parent Category "${cleanName}" created!`);
        if (data) {
          setCategories(prev => [...prev, data]);
        }
        await fetchAllMasterMetadata();
        quickCreateSetFieldValue?.('subSubCategory', cleanName);
        quickCreateSetFieldValue?.('subCategory', '');
        quickCreateSetFieldValue?.('category', '');
        setQuickCreateType(null);

      } else if (quickCreateType === 'sub') {
        const parentName = quickCreateCurrentValues?.subSubCategory?.trim();
        let parent = categories.find(
          c => !c.parent_id && c.name?.toLowerCase() === parentName.toLowerCase()
        );
        let parentId = parent?.id;

        if (!parentId) {
          const { data: newP, error: pErr } = await supabase
            .from('inventory_categories')
            .insert([{ name: parentName, parent_id: null, tenant_id: activeTenant }])
            .select()
            .single();
          if (pErr) throw pErr;
          parentId = newP?.id;
          if (newP) setCategories(prev => [...prev, newP]);
        }

        const existingSub = categories.find(
          c => c.parent_id === parentId && c.name?.toLowerCase() === cleanName.toLowerCase()
        );
        if (existingSub) {
          toast.success(`Sub category "${cleanName}" selected!`);
          quickCreateSetFieldValue?.('subCategory', cleanName);
          quickCreateSetFieldValue?.('category', '');
          setQuickCreateType(null);
          return;
        }

        const { data, error } = await supabase
          .from('inventory_categories')
          .insert([{ name: cleanName, parent_id: parentId, tenant_id: activeTenant }])
          .select()
          .single();

        if (error) throw error;

        toast.success(`Sub Category "${cleanName}" created under ${parentName}!`);
        if (data) {
          setCategories(prev => [...prev, data]);
        }
        await fetchAllMasterMetadata();
        quickCreateSetFieldValue?.('subCategory', cleanName);
        quickCreateSetFieldValue?.('category', '');
        setQuickCreateType(null);

      } else if (quickCreateType === 'category') {
        const subName = quickCreateCurrentValues?.subCategory?.trim();
        let sub = categories.find(
          c => c.name?.toLowerCase() === subName.toLowerCase()
        );
        let subId = sub?.id;

        if (!subId) {
          toast.error('Parent Sub Category not found');
          return;
        }

        const existingCat = categories.find(
          c => c.parent_id === subId && c.name?.toLowerCase() === cleanName.toLowerCase()
        );
        if (existingCat) {
          toast.success(`Category "${cleanName}" selected!`);
          quickCreateSetFieldValue?.('category', cleanName);
          setQuickCreateType(null);
          return;
        }

        const { data, error } = await supabase
          .from('inventory_categories')
          .insert([{ name: cleanName, parent_id: subId, tenant_id: activeTenant }])
          .select()
          .single();

        if (error) throw error;

        toast.success(`Category "${cleanName}" created!`);
        if (data) {
          setCategories(prev => [...prev, data]);
        }
        await fetchAllMasterMetadata();
        quickCreateSetFieldValue?.('category', cleanName);
        setQuickCreateType(null);

      } else if (quickCreateType === 'brand') {
        const isDuplicate = surfaceFinishes.some(
          (b: any) => (typeof b === 'string' ? b : b.name)?.toLowerCase() === cleanName.toLowerCase()
        );
        if (!isDuplicate) {
          const { error } = await supabase
            .from('inventory_surface_finishes')
            .insert([{ name: cleanName }]);
          if (error) throw error;
        }

        toast.success(`Brand "${cleanName}" added!`);
        await fetchAllMasterMetadata();
        quickCreateSetFieldValue?.('finishType', cleanName);
        setQuickCreateType(null);

      } else if (quickCreateType === 'uom') {
        const upperCode = cleanName.toUpperCase();
        const { error } = await supabase
          .from('inventory_uom')
          .upsert([
            {
              short_code: upperCode,
              full_name: quickCreateFullName.trim() || upperCode,
              category: quickCreateUomCategory || 'Count & Units',
              tenant_id: activeTenant,
              is_active: true
            }
          ], { onConflict: 'tenant_id,short_code' });

        if (error) throw error;

        toast.success(`UOM "${upperCode}" added!`);
        await fetchAllMasterMetadata();
        quickCreateSetFieldValue?.('uom', upperCode);
        setQuickCreateType(null);
      }
    } catch (err: any) {
      console.error('Quick create error:', err);
      toast.error('Failed to create: ' + (err.message || 'Error occurred'));
    } finally {
      setQuickCreateLoading(false);
    }
  };

  const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) => 
    ['-', 'e', 'E', '+'].includes(e.key) && e.preventDefault();

  if (metadataLoading) {
    return (
      <div className="flex h-48 items-center justify-center bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12 font-sans">
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800/80 dark:bg-[#111827] overflow-hidden">
        
        {/* HEADER BAR */}
        <div className="border-b border-slate-100 py-4.5 px-6.5 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              {isEditMode ? `Edit Product: ${editData.product_name}` : 'Add New Product Master Item'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select category to automatically load product or tile-specific dimension & packaging fields
            </p>
          </div>
          <button
            onClick={() => navigate('/Administration/Products/List')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            ← Back to List
          </button>
        </div>

        <Formik
          initialValues={isEditMode ? {
            productName: editData.product_name || '',
            category: editData.category || '',
            subCategory: editData.sub_category || '',
            subSubCategory: editData.sub_sub_category || '',
            itemType: editData.item_type || 'goods',

            uom: editData.uom || 'PCS',
            profit: editData.profit || 0,
            purchasePrice: editData.purchase_price || 0,
            scenarioName: editData.scenario_name || '',
            mrp: editData.mrp || editData.retail_price || 0,
            retailPrice: editData.retail_price || 0,
            serviceCharges: editData.service_charges || 0,
            minStockAlert: editData.min_stock_alert !== undefined && editData.min_stock_alert !== null ? editData.min_stock_alert : '',
            hsCode: editData.hs_code || '',
            itemSrNo: editData.item_sr_no || '',
            sroScheduleNo: editData.sro_schedule_no || '',
                        // Tile specific fields dynamically parsed from existing record
            tileHeight: parseTileDimensions(editData).h,
            tileWidth: parseTileDimensions(editData).w,
            tileThickness: (() => {
              const match = String(editData?.product_description || '').match(/Thickness:\s*([^|]+)/i);
              return match ? match[1].trim() : '';
            })(),
            piecesPerBox: parsePiecesPerBox(editData),
            finishType: editData.bin || '',
            weightPerBox: 28,
          } : {
            productName: '',
            category: '',
            subCategory: '',
            subSubCategory: '',
            itemType: 'goods',

            uom: '',
            profit: 0,
            purchasePrice: '',
            scenarioName: '',
            mrp: '',
            retailPrice: '',
            serviceCharges: 0,
            minStockAlert: '',
            hsCode: '',
            itemSrNo: '',
            sroScheduleNo: '',
            // Tile specific defaults
            tileHeight: 60,
            tileWidth: 60,
            tileThickness: '',
            piecesPerBox: 4,
            finishType: '',
            weightPerBox: 28,
          }}
          enableReinitialize={true}
          validationSchema={Yup.object().shape({
            productName: Yup.string().required('Description is required'),
            category: Yup.string().required('Category is required'),
            purchasePrice: Yup.number().typeError('Must be a number').min(0).required('Required'),
            retailPrice: Yup.number().typeError('Must be a number').min(0).required('Required'),
            minStockAlert: Yup.number().typeError('Must be a valid quantity number').min(0, 'Cannot be negative').nullable(),
          })}
          onSubmit={async (values) => {
            setLoading(true);
            const isTileCategory = String(values.subSubCategory || '').trim().toLowerCase().includes('tile');
            const computedProfit = (Number(values.retailPrice) || 0) + (values.itemType === 'service' ? (Number(values.serviceCharges) || 0) : 0) - (Number(values.purchasePrice) || 0);

            let finalDescription = '';
            let finalUom = values.uom;
            let finalHsCode = values.hsCode?.trim() || '';
            let finalItemSrNo = values.itemSrNo?.trim() || '';
            const pcs = Number(values.piecesPerBox) || 1;

            if (isTileCategory) {
              const h = Number(values.tileHeight) || 0;
              const w = Number(values.tileWidth) || 0;
              const sqMetersPerTile = (h * w) / 10000;
              const totalSqMetersPerBox = sqMetersPerTile * pcs;
              const tileSizeFormatted = `${h} × ${w} cm`;

              finalDescription = `[TILE PRODUCT] Size: ${tileSizeFormatted} | Box: ${pcs} pcs (${totalSqMetersPerBox.toFixed(2)} sq.m / box) | Finish: ${values.finishType}${values.tileThickness ? ` | Thickness: ${values.tileThickness}` : ''}${values.weightPerBox ? ` | Wt: ${values.weightPerBox}kg` : ''}`;
              finalUom = values.uom || 'BOX';
              finalHsCode = values.hsCode?.trim() || '6907.2100';
              finalItemSrNo = values.itemSrNo?.trim() || tileSizeFormatted;
            }

            const databasePayload = {
              item_type: values.itemType || 'goods',
              product_name: String(values.productName || '').replace(/\s+/g, ' ').trim(),
              category: values.category,
              sub_category: values.subCategory,
              sub_sub_category: values.subSubCategory,

              uom: finalUom || 'PCS',
              bin: values.finishType?.trim() || '',
              product_description: finalDescription,
              profit: computedProfit,
              purchase_price: Number(values.purchasePrice) || 0,
              scenario_name: values.scenarioName || (isTileCategory ? 'Tile Metric' : ''),
              mrp: Number(values.mrp) || Number(values.retailPrice) || 0,
              retail_price: Number(values.retailPrice) || 0,
              service_charges: values.itemType === 'service' ? Number(values.serviceCharges) || 0 : 0,
              min_stock_alert: values.minStockAlert !== '' && values.minStockAlert !== null ? Number(values.minStockAlert) : 0,
              pieces_per_box: pcs,
              pcs_per_box: pcs,
              pieces_per_packing: pcs,
              hs_code: finalHsCode,
              item_sr_no: finalItemSrNo,
              sro_schedule_no: values.sroScheduleNo?.trim() || '',
            };

            try {
              // 🔍 SKU Uniqueness Validation: Prevent duplicate Codes
              if (finalItemSrNo) {
                let skuQuery = supabase
                  .from('products')
                  .select('id, product_name, item_sr_no')
                  .ilike('item_sr_no', finalItemSrNo.trim());

                if (isEditMode && editData?.id) {
                  skuQuery = skuQuery.neq('id', editData.id);
                }

                const { data: existingSku, error: skuCheckError } = await skuQuery;
                if (skuCheckError) console.warn('SKU Check warning:', skuCheckError);

                if (existingSku && existingSku.length > 0) {
                  toast.error(`Code "${finalItemSrNo}" is already assigned to "${existingSku[0].product_name}". Each product must have a unique SKU!`, {
                    duration: 5000,
                  });
                  setLoading(false);
                  return;
                }
              }

              if (isEditMode) {
                const { error } = await supabase
                  .from('products')
                  .update(databasePayload)
                  .eq('id', editData.id);

                if (error) throw error;
                toast.success('Product updated successfully!');
              } else {
                const { error } = await supabase
                  .from('products')
                  .insert([databasePayload]);

                if (error) throw error;
                toast.success('Product saved successfully!');
              }

              // Auto-sync custom categories to inventory_categories
              if (values.subSubCategory?.trim()) {
                try {
                  let parentId: number | null = null;
                  let { data: existingParent } = await supabase
                    .from('inventory_categories')
                    .select('id, name')
                    .ilike('name', values.subSubCategory.trim())
                    .is('parent_id', null)
                    .maybeSingle();

                  if (!existingParent) {
                    const { data: createdParent } = await supabase
                      .from('inventory_categories')
                      .insert([{ name: values.subSubCategory.trim(), parent_id: null }])
                      .select()
                      .maybeSingle();
                    parentId = createdParent?.id || null;
                  } else {
                    parentId = existingParent.id;
                  }

                  if (values.subCategory?.trim() && parentId) {
                    let subId: number | null = null;
                    let { data: existingSub } = await supabase
                      .from('inventory_categories')
                      .select('id, name')
                      .ilike('name', values.subCategory.trim())
                      .eq('parent_id', parentId)
                      .maybeSingle();

                    if (!existingSub) {
                      const { data: createdSub } = await supabase
                        .from('inventory_categories')
                        .insert([{ name: values.subCategory.trim(), parent_id: parentId }])
                        .select()
                        .maybeSingle();
                      subId = createdSub?.id || null;
                    } else {
                      subId = existingSub.id;
                    }

                    if (values.category?.trim() && subId) {
                      let { data: existingCat } = await supabase
                        .from('inventory_categories')
                        .select('id, name')
                        .ilike('name', values.category.trim())
                        .eq('parent_id', subId)
                        .maybeSingle();

                      if (!existingCat) {
                        await supabase
                          .from('inventory_categories')
                          .insert([{ name: values.category.trim(), parent_id: subId }]);
                      }
                    }
                  }
                } catch (catErr) {
                  console.warn('Auto-sync categories warning:', catErr);
                }
              }

              // Auto-sync custom brand if provided
              if (values.finishType?.trim()) {
                try {
                  const { data: existingBrand } = await supabase
                    .from('inventory_surface_finishes')
                    .select('id, name')
                    .ilike('name', values.finishType.trim())
                    .maybeSingle();
                  if (!existingBrand) {
                    await supabase
                      .from('inventory_surface_finishes')
                      .insert([{ name: values.finishType.trim() }]);
                  }
                } catch (brandErr) {
                  console.warn('Auto-sync brand warning:', brandErr);
                }
              }
              navigate('/Administration/Products/List');
            } catch (err: any) {
              toast.error('Database Operation Failure: ' + err.message);
            } finally {
              setLoading(false);
            }
          }}
        >
          {({ handleChange, values, errors, touched, setFieldValue }) => {
            const isTileCategory = String(values.subSubCategory || '').trim().toLowerCase().includes('tile');

            // Tile Live Calculations
            const tileH = Number(values.tileHeight) || 0;
            const tileW = Number(values.tileWidth) || 0;
            const tilePcs = Number(values.piecesPerBox) || 1;
            const sqMetersPerTile = tileH > 0 && tileW > 0 ? (tileH * tileW) / 10000 : 0;
            const totalSqMetersPerBox = sqMetersPerTile * tilePcs;
            const tileSizeFormatted = `${tileH} × ${tileW} cm`;

            const numSale = Number(values.retailPrice) || 0;
            const numPurchase = Number(values.purchasePrice) || 0;
            const numSqm = totalSqMetersPerBox > 0 ? totalSqMetersPerBox : 1;

            const salePerSqm = (numSale / numSqm).toFixed(2);
            const salePerPiece = (numSale / tilePcs).toFixed(2);
            const purchasePerSqm = (numPurchase / numSqm).toFixed(2);
            const purchasePerPiece = (numPurchase / tilePcs).toFixed(2);

            const numServiceCharges = values.itemType === 'service' ? (Number(values.serviceCharges) || 0) : 0;
            const totalRevenue = numSale + numServiceCharges;
            const profit = totalRevenue - numPurchase;
            const profitMarginPercent = numPurchase > 0 ? ((profit / numPurchase) * 100).toFixed(1) : '0';

            useEffect(() => {
              setFieldValue('profit', profit.toFixed(2));
              if (isTileCategory && !values.uom) {
                setFieldValue('uom', 'BOX');
              }
            }, [numSale, numPurchase, isTileCategory, setFieldValue]);

            return (
              <Form className="p-6.5 text-xs text-slate-700 dark:text-slate-200 space-y-6">

                {/* ITEM TYPE TAB SWITCHER */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
                  {(['goods', 'service'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFieldValue('itemType', type)}
                      className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                        values.itemType === type
                          ? type === 'goods'
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'bg-indigo-500 text-white shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      {type === 'goods' ? '📦 Goods Item' : '🛠️ Service Item'}
                    </button>
                  ))}
                </div>
                
                {/* 1. CORE PRODUCT ATTRIBUTES (Always visible) */}
                <div className="bg-slate-50/50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                      <MdLayers className="text-emerald-600 text-lg" />
                      <span>Product Category & Identity</span>
                    </div>
                    {isTileCategory && (
                      <span className="bg-teal-500/20 text-teal-700 dark:text-teal-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-teal-500/30 uppercase tracking-wider">
                        Tile Mode Active
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                    {/* 1. Parent Category (Top Level) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block font-bold text-slate-800 dark:text-slate-100 text-xs">
                          Parent Category
                        </label>
                        <button
                          type="button"
                          onClick={() => handleOpenQuickCreate('parent', values, setFieldValue)}
                          className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline transition"
                          title="Add new parent category"
                        >
                          <MdAdd className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                      <AppCombobox
                        value={values.subSubCategory}
                        onChange={(val) => {
                          setFieldValue('subSubCategory', val);
                          setFieldValue('subCategory', '');
                          setFieldValue('category', '');
                        }}
                        options={categories.filter(c => c.parent_id === null).map(cat => cat.name)}
                        placeholder="-- Select Parent Category --"
                      />
                    </div>

                    {/* 1.1 Sub Category (Middle Level) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block font-bold text-slate-800 dark:text-slate-100 text-xs">
                          Sub Category
                        </label>
                        <button
                          type="button"
                          onClick={() => handleOpenQuickCreate('sub', values, setFieldValue)}
                          disabled={!values.subSubCategory}
                          className={`inline-flex items-center gap-0.5 text-[11px] font-bold transition ${
                            !values.subSubCategory
                              ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                              : 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline'
                          }`}
                          title="Add new sub category"
                        >
                          <MdAdd className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                      <AppCombobox
                        value={values.subCategory}
                        disabled={!values.subSubCategory}
                        onChange={(val) => {
                          setFieldValue('subCategory', val);
                          setFieldValue('category', '');
                        }}
                        options={(() => {
                          const parent = categories.find(c => c.name === values.subSubCategory && c.parent_id === null);
                          if (!parent) return [];
                          return categories.filter(c => c.parent_id === parent.id).map(cat => cat.name);
                        })()}
                        placeholder={!values.subSubCategory ? "Select parent category first" : "-- Select Sub Category --"}
                      />
                    </div>

                    {/* 1.2 Category (Bottom Level) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block font-bold text-slate-800 dark:text-slate-100 text-xs">
                          Category <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleOpenQuickCreate('category', values, setFieldValue)}
                          disabled={!values.subCategory}
                          className={`inline-flex items-center gap-0.5 text-[11px] font-bold transition ${
                            !values.subCategory
                              ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                              : 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline'
                          }`}
                          title="Add new category"
                        >
                          <MdAdd className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                      <AppCombobox
                        value={values.category}
                        disabled={!values.subCategory}
                        required
                        onChange={(val) => setFieldValue('category', val)}
                        options={(() => {
                          const parent = categories.find(c => c.name === values.subSubCategory && c.parent_id === null);
                          if (!parent) return [];
                          const sub = categories.find(c => c.name === values.subCategory && c.parent_id === parent.id);
                          if (!sub) return [];
                          return categories.filter(c => c.parent_id === sub.id).map(cat => cat.name);
                        })()}
                        placeholder={!values.subCategory ? "Select sub category first" : "-- Select Category --"}
                      />
                      {touched.category && errors.category && (
                        <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.category as string}</p>
                      )}
                    </div>

                    {/* 4. Brand */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block font-bold text-slate-800 dark:text-slate-100 text-xs">
                          Brand
                        </label>
                        <button
                          type="button"
                          onClick={() => handleOpenQuickCreate('brand', values, setFieldValue)}
                          className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline transition"
                          title="Add new brand"
                        >
                          <MdAdd className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                      <AppCombobox
                        value={values.finishType}
                        onChange={(val) => setFieldValue('finishType', val)}
                        options={surfaceFinishes.map((f: any) => (typeof f === 'string' ? f : f.name))}
                        placeholder="Search or enter brand..."
                      />
                    </div>

                    {/* 5. UOM */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block font-bold text-slate-800 dark:text-slate-100 text-xs">
                          {isTileCategory ? 'Inventory UOM (e.g. BOX)' : 'UOM *'}
                        </label>
                        <button
                          type="button"
                          onClick={() => handleOpenQuickCreate('uom', values, setFieldValue)}
                          className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline transition"
                          title="Add new unit of measure"
                        >
                          <MdAdd className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                      <AppCombobox
                        value={values.uom}
                        onChange={(val) => setFieldValue('uom', val)}
                        options={(() => {
                          let availableUoms: string[] = [];
                          if (isTileCategory) {
                            availableUoms = ['BOX', 'SQM', 'SQFT', 'PCS'];
                          }
                          Object.keys(groupedUoms).forEach(cat => {
                            groupedUoms[cat].forEach(u => availableUoms.push(u.short_code));
                          });
                          availableUoms.push('EACH');
                          return Array.from(new Set(availableUoms));
                        })()}
                        placeholder="Search or enter UOM..."
                        required
                      />
                      {touched.uom && errors.uom && (
                        <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.uom as string}</p>
                      )}
                    </div>

                    {/* 6. Code */}
                    <div>
                      <label className="mb-1.5 block font-bold text-slate-800 dark:text-slate-100">
                        Code
                      </label>
                      <input
                        type="text"
                        name="itemSrNo"
                        onChange={handleChange}
                        value={values.itemSrNo}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 outline-none focus:border-emerald-600 text-xs text-slate-800 dark:text-white font-mono"
                        placeholder="Enter Code"
                      />
                    </div>

                    {/* 7. Description */}
                    <div className="sm:col-span-2 md:col-span-1 lg:col-span-1">
                      <label className="mb-1.5 block font-bold text-slate-800 dark:text-slate-100">
                        Description *
                      </label>
                      <input
                        type="text"
                        name="productName"
                        onChange={handleChange}
                        value={values.productName}
                        className={`w-full rounded-xl border p-2.5 bg-white dark:bg-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-900 dark:text-white ${
                          touched.productName && errors.productName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                        }`}
                        placeholder={isTileCategory ? "e.g. Master Tiles Calacatta White 60x60 (Glazed Polished)" : "Enter Description"}
                      />
                      {touched.productName && errors.productName && (
                        <p className="text-[10px] text-rose-500 mt-1 font-semibold">{errors.productName as string}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. DYNAMIC TILE SPECIFIC SECTION (Only shown when category = Tile) */}
                {isTileCategory && (
                  <div className="bg-white dark:bg-boxdark rounded-2xl border border-teal-500/30 dark:border-teal-500/20 shadow-sm p-5 space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-sm">
                        <MdSquareFoot className="text-xl" />
                        <span>Tile Sizing (Centimeters) & Box Packaging Setup</span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">Unit: Centimeters (cm) | Area: Square Meters (sq.m)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {/* Dimension Unit - Fixed Static */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
                          Dimension Unit
                        </label>
                        <input
                          type="text"
                          readOnly
                          value="Centimeters (cm)"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-100 dark:bg-slate-800 outline-none text-xs font-bold text-teal-700 dark:text-teal-400 cursor-not-allowed"
                        />
                      </div>

                      {/* Height (cm) */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
                          Tile Height (cm) *
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0.1"
                          name="tileHeight"
                          value={values.tileHeight}
                          onChange={handleChange}
                          placeholder="e.g. 60"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-50/50 dark:bg-slate-800/80 outline-none focus:border-teal-600 text-xs font-mono font-bold text-slate-900 dark:text-white"
                        />
                      </div>

                      {/* Width (cm) */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
                          Tile Width (cm) *
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0.1"
                          name="tileWidth"
                          value={values.tileWidth}
                          onChange={handleChange}
                          placeholder="e.g. 60 or 120"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-50/50 dark:bg-slate-800/80 outline-none focus:border-teal-600 text-xs font-mono font-bold text-slate-900 dark:text-white"
                        />
                      </div>

                      {/* Pieces Per Box */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
                          Pieces Per Box *
                        </label>
                        <input
                          type="number"
                          min="1"
                          name="piecesPerBox"
                          value={values.piecesPerBox}
                          onChange={handleChange}
                          placeholder="e.g. 4"
                          className="w-full rounded-xl border border-teal-500/50 dark:border-teal-500/50 p-2.5 bg-teal-50/30 dark:bg-teal-950/20 outline-none focus:border-teal-600 text-xs font-mono font-black text-teal-800 dark:text-teal-300"
                        />
                      </div>

                      {/* Thickness (Optional) */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
                          Thickness <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          name="tileThickness"
                          value={values.tileThickness}
                          onChange={handleChange}
                          placeholder="e.g. 9 mm"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-50/50 dark:bg-slate-800/80 outline-none focus:border-teal-600 text-xs text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* LIVE COMPUTED SQUARE METER BADGES */}
                    <div className="bg-teal-50 dark:bg-teal-950/40 rounded-xl p-4 border border-teal-200 dark:border-teal-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">📐</span>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Formatted Tile Size:</span>
                          <strong className="text-teal-800 dark:text-teal-300 font-bold text-sm">{tileSizeFormatted}</strong>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Area per Tile:</span>
                        <strong className="text-slate-900 dark:text-white font-mono font-bold text-sm">
                          {sqMetersPerTile.toFixed(4)} sq.m
                        </strong>
                      </div>

                      <div className="bg-white dark:bg-slate-900 px-5 py-2.5 rounded-xl border border-teal-300 dark:border-teal-700 shadow-xs">
                        <span className="text-teal-600 dark:text-teal-400 block text-[10px] font-bold uppercase tracking-wider">
                          Total Coverage Per Box:
                        </span>
                        <strong className="text-teal-800 dark:text-teal-300 font-mono font-black text-lg">
                          {totalSqMetersPerBox.toFixed(2)} sq.m
                        </strong>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono ml-2">
                          / Box
                        </span>
                      </div>
                    </div>
                  </div>
                )}


                {/* 4. PRICING SECTION (Clean Purchase Price & Sale Price) */}
                <div className="bg-white dark:bg-boxdark rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                      <MdAttachMoney className="text-emerald-600 text-xl" />
                      <span>{isTileCategory ? 'Tile Box Pricing & Rate Breakdown' : 'Product Pricing & Margin'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-semibold">Calculated Margin:</span>
                      <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                        +{profitMarginPercent}% (Rs. {profit.toFixed(2)}/{isTileCategory ? 'box' : (values.uom || 'unit')})
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {/* Purchase Price Input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
                        {isTileCategory ? 'Purchase Price (Per Box) *' : 'Purchase Price *'}
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        name="purchasePrice"
                        onKeyDown={blockInvalidChar}
                        value={values.purchasePrice}
                        onChange={handleChange}
                        placeholder="0.00"
                        className={`w-full rounded-xl border p-3 bg-slate-50/50 dark:bg-slate-800/80 outline-none focus:border-emerald-600 text-sm font-mono font-bold text-slate-900 dark:text-white ${
                          touched.purchasePrice && errors.purchasePrice ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                        }`}
                      />
                      {isTileCategory && (
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] mt-2 font-mono">
                          <span className="bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 font-semibold border border-slate-200/60 dark:border-slate-600">
                            ≈ Rs. {purchasePerPiece} <span className="text-[10px] text-slate-500 font-normal">/ tile (pc)</span>
                          </span>
                          <span className="text-slate-500">
                            ≈ Rs. {purchasePerSqm} / sq.m
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Sale Price Input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
                        {isTileCategory ? 'Sale Price (Per Box) *' : 'Sale Price (Retail Rate) *'}
                      </label>
                      <input
                        type="number"
                        step="any"
                        required
                        name="retailPrice"
                        onKeyDown={blockInvalidChar}
                        value={values.retailPrice}
                        onChange={handleChange}
                        placeholder="0.00"
                        className={`w-full rounded-xl border p-3 bg-emerald-50/20 dark:bg-emerald-950/20 outline-none focus:border-emerald-600 text-sm font-mono font-black text-emerald-700 dark:text-emerald-300 ${
                          touched.retailPrice && errors.retailPrice ? 'border-rose-500' : 'border-emerald-500/50 dark:border-emerald-500/50'
                        }`}
                      />
                      {isTileCategory && (
                        <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] mt-2 font-mono">
                          <span className="bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300/60 dark:border-emerald-700/60">
                            ≈ Rs. {salePerPiece} <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">/ tile (loose pc)</span>
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            ≈ Rs. {salePerSqm} / sq.m
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Service Charges Input - only for service items */}
                    {values.itemType === 'service' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
                          Service Charges *
                        </label>
                        <input
                          type="number"
                          step="any"
                          name="serviceCharges"
                          onKeyDown={blockInvalidChar}
                          value={values.serviceCharges}
                          onChange={handleChange}
                          placeholder="0.00"
                          className="w-full rounded-xl border p-3 bg-indigo-50/20 dark:bg-indigo-950/20 outline-none focus:border-indigo-500 text-sm font-mono font-black text-indigo-700 dark:text-indigo-300 border-indigo-400/50 dark:border-indigo-500/50"
                        />
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                          Rate charged to the customer for this service.
                        </p>
                      </div>
                    )}

                    {/* Minimum Stock Alert Input (Optional) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center justify-between">
                        <span>Minimum Stock Alert</span>
                        <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        name="minStockAlert"
                        onKeyDown={blockInvalidChar}
                        value={values.minStockAlert}
                        onChange={handleChange}
                        placeholder={isTileCategory ? "e.g. 20 (Boxes)" : "e.g. 10 (Units)"}
                        className={`w-full rounded-xl border p-3 bg-slate-50/50 dark:bg-slate-800/80 outline-none focus:border-amber-500 text-sm font-mono font-bold text-slate-900 dark:text-white ${
                          touched.minStockAlert && errors.minStockAlert ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                        }`}
                      />
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                        Turns stock count <span className="text-rose-500 font-bold">RED</span> when remaining inventory hits or drops below this quantity.
                      </p>
                    </div>
                  </div>
                </div>

                {/* FORM ACTIONS */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/Administration/Products/List')}
                    className="rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-3 px-6 font-bold text-slate-700 dark:text-slate-300 transition shadow-sm text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 px-8 font-bold text-white transition disabled:opacity-50 shadow-md text-xs cursor-pointer flex items-center gap-2"
                  >
                    {loading ? <Spinner /> : <MdViewModule className="text-base" />}
                    <span>{isEditMode ? 'Update Product' : isTileCategory ? 'Save Tile Product' : 'Save Product'}</span>
                  </button>
                </div>

              </Form>
            );
          }}
        </Formik>

        {/* Quick Create Sub-Modal */}
        {quickCreateType && (
          <div className="fixed inset-0 z-[99999999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 p-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {quickCreateType === 'parent' && 'Add Parent Category'}
                    {quickCreateType === 'sub' && 'Add Sub Category'}
                    {quickCreateType === 'category' && 'Add Category'}
                    {quickCreateType === 'brand' && 'Add Brand'}
                    {quickCreateType === 'uom' && 'Add Unit of Measure (UOM)'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {quickCreateType === 'parent' && 'Create top-level category in database'}
                    {quickCreateType === 'sub' && `Grouping under: "${quickCreateCurrentValues?.subSubCategory}"`}
                    {quickCreateType === 'category' && `Leaf category under: "${quickCreateCurrentValues?.subCategory}"`}
                    {quickCreateType === 'brand' && 'New brand in product catalog'}
                    {quickCreateType === 'uom' && 'New measurement unit in database'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickCreateType(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                >
                  <MdClose className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    {quickCreateType === 'uom' ? 'Short Code *' : 'Name *'}
                  </label>
                  <input
                    type="text"
                    autoFocus
                    required
                    value={quickCreateName}
                    onChange={(e) => setQuickCreateName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveQuickCreate(e as any);
                      }
                    }}
                    placeholder={
                      quickCreateType === 'parent'
                        ? 'e.g. Tiles, Sanitary, Hardware'
                        : quickCreateType === 'sub'
                        ? 'e.g. Floor Tiles, Bath Fittings'
                        : quickCreateType === 'category'
                        ? 'e.g. Porcelain, Ceramic'
                        : quickCreateType === 'brand'
                        ? 'e.g. Master, Sonex'
                        : 'e.g. CTN, BDL, MTR'
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:border-emerald-600"
                  />
                </div>

                {quickCreateType === 'uom' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                        Full Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={quickCreateFullName}
                        onChange={(e) => setQuickCreateFullName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveQuickCreate(e as any);
                          }
                        }}
                        placeholder="e.g. Carton, Bundle, Meter"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                        Category
                      </label>
                      <select
                        value={quickCreateUomCategory}
                        onChange={(e) => setQuickCreateUomCategory(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-white outline-none focus:border-emerald-600"
                      >
                        <option value="Count & Units">Count & Units</option>
                        <option value="Packaging & Containers">Packaging & Containers</option>
                        <option value="Area & Surface">Area & Surface</option>
                        <option value="Length & Distance">Length & Distance</option>
                        <option value="Weight & Mass">Weight & Mass</option>
                        <option value="Volume & Liquid">Volume & Liquid</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setQuickCreateType(null)}
                    className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={quickCreateLoading}
                    onClick={(e) => handleSaveQuickCreate(e as any)}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    {quickCreateLoading ? 'Saving...' : 'Create & Select'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AddProduct;
