import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  MdClose,
  MdLayers,
  MdAttachMoney,
  MdSquareFoot,
  MdSave,
  MdKeyboardArrowDown,
  MdAdd
} from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { supabase } from '../Context/supabaseClient';
import { useAuth } from '../Context/Auth';
import AppCombobox from './AppCombobox';

export interface CreatedProductResult {
  id: string | number;
  name: string;
  rate: number;
  uom?: string;
  category?: string;
}

interface QuickAddProductModalProps {
  isOpen: boolean;
  initialProductName?: string;
  onClose: () => void;
  onSuccess: (product: CreatedProductResult) => void;
}

export const QuickAddProductModal: React.FC<QuickAddProductModalProps> = ({
  isOpen,
  initialProductName = '',
  onClose,
  onSuccess
}) => {
  const { tenantId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [uomOptions, setUomOptions] = useState<string[]>([
    'BOX', 'PCS', 'SQM', 'SQFT', 'KG', 'MTR', 'SET', 'EACH', 'NOS', 'PAIR', 'CTN', 'PKT', 'BAG', 'TON', 'LTR'
  ]);

  // Quick Create Mini Modal State
  const [quickCreateType, setQuickCreateType] = useState<'parent' | 'sub' | 'category' | 'brand' | 'uom' | null>(null);
  const [quickCreateName, setQuickCreateName] = useState('');
  const [quickCreateFullName, setQuickCreateFullName] = useState('');
  const [quickCreateUomCategory, setQuickCreateUomCategory] = useState('Count & Units');
  const [quickCreateLoading, setQuickCreateLoading] = useState(false);

  // Category & Identity Form State
  const [parentCategory, setParentCategory] = useState<string>('');
  const [subCategory, setSubCategory] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [uom, setUom] = useState<string>('PCS');
  const [code, setCode] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Dynamic Tile Fields
  const [tileHeight, setTileHeight] = useState<number | string>(60);
  const [tileWidth, setTileWidth] = useState<number | string>(60);
  const [piecesPerBox, setPiecesPerBox] = useState<number | string>(4);
  const [tileThickness, setTileThickness] = useState<string>('');

  // Pricing & Margin State
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [salePrice, setSalePrice] = useState<string>('');
  const [minStockAlert, setMinStockAlert] = useState<string>('');

  // Detect Tile Mode dynamically based on Parent Category
  const isTileCategory = useMemo(() => {
    return String(parentCategory || '').trim().toLowerCase().includes('tile');
  }, [parentCategory]);

  // Sync initial product name when opened
  useEffect(() => {
    if (isOpen) {
      setDescription(initialProductName || '');
      setParentCategory('');
      setSubCategory('');
      setCategory('');
      setBrand('');
      setCode('');
      setTileHeight(60);
      setTileWidth(60);
      setPiecesPerBox(4);
      setTileThickness('');
      setPurchasePrice('');
      setSalePrice('');
      setMinStockAlert('');
      setUom(initialProductName && initialProductName.toLowerCase().includes('tile') ? 'BOX' : 'PCS');
      setQuickCreateType(null);
    }
  }, [isOpen, initialProductName]);

  // Adjust UOM automatically when tile mode flips
  useEffect(() => {
    if (isTileCategory) {
      if (!uom || uom === 'PCS') {
        setUom('BOX');
      }
    } else {
      if (uom === 'BOX') {
        setUom('PCS');
      }
    }
  }, [isTileCategory]);

  // Fetch database categories and brands
  const fetchCatsAndBrands = useCallback(async () => {
    try {
      const { data: catData } = await supabase
        .from('inventory_categories')
        .select('*')
        .order('name', { ascending: true });
      setDbCategories(catData || []);

      const { data: finishData } = await supabase
        .from('inventory_surface_finishes')
        .select('name')
        .order('name', { ascending: true });

      const { data: prodBrands } = await supabase
        .from('products')
        .select('bin, brand');

      const brandsSet = new Set<string>();
      if (finishData) finishData.forEach((f: any) => f.name && brandsSet.add(f.name.trim()));
      if (prodBrands) prodBrands.forEach((p: any) => {
        if (p.brand?.trim()) brandsSet.add(p.brand.trim());
        if (p.bin?.trim()) brandsSet.add(p.bin.trim());
      });
      setBrandOptions(Array.from(brandsSet));

      const { data: uomData } = await supabase
        .from('inventory_uom')
        .select('short_code')
        .eq('is_active', true)
        .order('short_code', { ascending: true });

      if (uomData && uomData.length > 0) {
        const codes = Array.from(new Set(uomData.map((u: any) => u.short_code).filter(Boolean))) as string[];
        setUomOptions(codes);
      }
    } catch (err) {
      console.warn('Could not fetch categories, brands, or uom:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchCatsAndBrands();
    }
  }, [isOpen, fetchCatsAndBrands]);

  // Quick Open Modal
  const handleOpenQuickCreate = (type: 'parent' | 'sub' | 'category' | 'brand' | 'uom') => {
    if (type === 'sub' && !parentCategory.trim()) {
      toast.error('Please select or add a Parent Category first');
      return;
    }
    if (type === 'category' && !subCategory.trim()) {
      toast.error('Please select or add a Sub Category first');
      return;
    }

    setQuickCreateType(type);
    if (type === 'parent') setQuickCreateName(parentCategory || '');
    else if (type === 'sub') setQuickCreateName(subCategory || '');
    else if (type === 'category') setQuickCreateName(category || '');
    else if (type === 'brand') setQuickCreateName(brand || '');
    else if (type === 'uom') {
      setQuickCreateName(uom !== 'PCS' && uom !== 'BOX' ? uom : '');
      setQuickCreateFullName('');
      setQuickCreateUomCategory('Count & Units');
    }
  };

  // Quick Save Action
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
        const existing = dbCategories.find(
          c => !c.parent_id && c.name?.toLowerCase() === cleanName.toLowerCase()
        );
        if (existing) {
          toast.success(`Parent category "${cleanName}" selected!`);
          setParentCategory(cleanName);
          setSubCategory('');
          setCategory('');
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
          setDbCategories(prev => [...prev, data]);
        }
        await fetchCatsAndBrands();
        setParentCategory(cleanName);
        setSubCategory('');
        setCategory('');
        setQuickCreateType(null);

      } else if (quickCreateType === 'sub') {
        let parent = dbCategories.find(
          c => !c.parent_id && c.name?.toLowerCase() === parentCategory.trim().toLowerCase()
        );
        let parentId = parent?.id;

        if (!parentId) {
          const { data: newP, error: pErr } = await supabase
            .from('inventory_categories')
            .insert([{ name: parentCategory.trim(), parent_id: null, tenant_id: activeTenant }])
            .select()
            .single();
          if (pErr) throw pErr;
          parentId = newP?.id;
          if (newP) setDbCategories(prev => [...prev, newP]);
        }

        const existingSub = dbCategories.find(
          c => c.parent_id === parentId && c.name?.toLowerCase() === cleanName.toLowerCase()
        );
        if (existingSub) {
          toast.success(`Sub category "${cleanName}" selected!`);
          setSubCategory(cleanName);
          setCategory('');
          setQuickCreateType(null);
          return;
        }

        const { data, error } = await supabase
          .from('inventory_categories')
          .insert([{ name: cleanName, parent_id: parentId, tenant_id: activeTenant }])
          .select()
          .single();

        if (error) throw error;

        toast.success(`Sub Category "${cleanName}" created under ${parentCategory}!`);
        if (data) {
          setDbCategories(prev => [...prev, data]);
        }
        await fetchCatsAndBrands();
        setSubCategory(cleanName);
        setCategory('');
        setQuickCreateType(null);

      } else if (quickCreateType === 'category') {
        let sub = dbCategories.find(
          c => c.name?.toLowerCase() === subCategory.trim().toLowerCase()
        );
        let subId = sub?.id;

        if (!subId) {
          toast.error('Parent Sub Category not found');
          return;
        }

        const existingCat = dbCategories.find(
          c => c.parent_id === subId && c.name?.toLowerCase() === cleanName.toLowerCase()
        );
        if (existingCat) {
          toast.success(`Category "${cleanName}" selected!`);
          setCategory(cleanName);
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
          setDbCategories(prev => [...prev, data]);
        }
        await fetchCatsAndBrands();
        setCategory(cleanName);
        setQuickCreateType(null);

      } else if (quickCreateType === 'brand') {
        const isDuplicate = brandOptions.some(
          b => b?.toLowerCase() === cleanName.toLowerCase()
        );
        if (!isDuplicate) {
          const { error } = await supabase
            .from('inventory_surface_finishes')
            .insert([{ name: cleanName }]);
          if (error) throw error;
        }

        toast.success(`Brand "${cleanName}" added!`);
        await fetchCatsAndBrands();
        setBrand(cleanName);
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
        await fetchCatsAndBrands();
        setUom(upperCode);
        setQuickCreateType(null);
      }
    } catch (err: any) {
      console.error('Quick create error:', err);
      toast.error('Failed to create: ' + (err.message || 'Error occurred'));
    } finally {
      setQuickCreateLoading(false);
    }
  };

  // Form state handlers
  const handleParentCategoryChange = (val: string) => {
    setParentCategory(val);
    setSubCategory('');
    setCategory('');
  };

  const handleSubCategoryChange = (val: string) => {
    setSubCategory(val);
    setCategory('');
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
  };

  const handleBrandChange = (val: string) => {
    setBrand(val);
  };

  const handleUomChange = (val: string) => {
    setUom(val);
  };

  // Compute available parent categories from DB
  const parentOptions = useMemo(() => {
    if (dbCategories.length > 0) {
      const topLevel = dbCategories.filter(c => !c.parent_id).map(c => c.name);
      return Array.from(new Set(topLevel));
    }
    return [];
  }, [dbCategories]);

  // Compute available sub categories based on selected parent from DB
  const subOptions = useMemo(() => {
    if (!parentCategory) return [];
    if (dbCategories.length > 0) {
      const parent = dbCategories.find(c => c.name?.toLowerCase() === parentCategory.trim().toLowerCase() && !c.parent_id);
      if (parent) {
        return dbCategories.filter(c => c.parent_id === parent.id).map(c => c.name);
      }
    }
    return [];
  }, [parentCategory, dbCategories]);

  // Compute available leaf categories based on selected sub from DB
  const categoryOptions = useMemo(() => {
    if (!subCategory) return [];
    if (dbCategories.length > 0) {
      const sub = dbCategories.find(c => c.name?.toLowerCase() === subCategory.trim().toLowerCase());
      if (sub) {
        return dbCategories.filter(c => c.parent_id === sub.id).map(c => c.name);
      }
    }
    return [];
  }, [subCategory, dbCategories]);

  // Tile Live Calculations
  const tileH = Number(tileHeight) || 0;
  const tileW = Number(tileWidth) || 0;
  const tilePcs = Number(piecesPerBox) || 1;
  const sqMetersPerTile = tileH > 0 && tileW > 0 ? (tileH * tileW) / 10000 : 0;
  const totalSqMetersPerBox = sqMetersPerTile * tilePcs;
  const tileSizeFormatted = `${tileH} × ${tileW} cm`;

  const numSale = Number(salePrice) || 0;
  const numPurchase = Number(purchasePrice) || 0;
  const numSqm = totalSqMetersPerBox > 0 ? totalSqMetersPerBox : 1;

  const salePerSqm = (numSale / numSqm).toFixed(2);
  const salePerPiece = (numSale / tilePcs).toFixed(2);
  const purchasePerSqm = (numPurchase / numSqm).toFixed(2);
  const purchasePerPiece = (numPurchase / tilePcs).toFixed(2);

  const profit = numSale - numPurchase;
  const profitMarginPercent = numPurchase > 0 ? ((profit / numPurchase) * 100).toFixed(1) : '0';

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error('Description (product name) is required');
      return;
    }
    if (!numSale) {
      toast.error('Sale Price (Retail Rate) is required');
      return;
    }

    try {
      setLoading(true);

      let finalDescription = '';
      let finalHsCode = '';
      let finalItemSrNo = code.trim();

      if (isTileCategory) {
        finalDescription = `[TILE PRODUCT] Size: ${tileSizeFormatted} | Box: ${tilePcs} pcs (${totalSqMetersPerBox.toFixed(2)} sq.m / box)${brand ? ` | Brand: ${brand}` : ''}${tileThickness ? ` | Thickness: ${tileThickness}` : ''}`;
        finalHsCode = '6907.2100';
        if (!finalItemSrNo) {
          finalItemSrNo = tileSizeFormatted;
        }
      }

      const databasePayload: any = {
        item_type: 'goods',
        product_name: description.replace(/\s+/g, ' ').trim(),
        category: category.trim() || subCategory.trim() || parentCategory.trim() || 'General',
        sub_category: subCategory.trim() || '',
        sub_sub_category: parentCategory.trim() || '',
        uom: uom || (isTileCategory ? 'BOX' : 'PCS'),
        bin: brand.trim() || '',
        product_description: finalDescription,
        profit: Number(profit.toFixed(2)),
        purchase_price: numPurchase,
        scenario_name: isTileCategory ? 'Tile Metric' : '',
        mrp: numSale,
        retail_price: numSale,
        min_stock_alert: minStockAlert !== '' ? Number(minStockAlert) : 0,
        pieces_per_box: isTileCategory ? tilePcs : null,
        pcs_per_box: isTileCategory ? tilePcs : null,
        pieces_per_packing: isTileCategory ? tilePcs : null,
        hs_code: finalHsCode,
        item_sr_no: finalItemSrNo,
        brand: brand.trim() || null
      };

      const { data, error } = await supabase.from('products').insert([databasePayload]).select();

      if (error) {
        console.error('Error inserting product:', error);
        toast.error('Failed to save product: ' + error.message);
        return;
      }

      // Auto-sync custom categories to inventory_categories
      if (parentCategory.trim()) {
        try {
          let parentId: number | null = null;
          let { data: existingParent } = await supabase
            .from('inventory_categories')
            .select('id, name')
            .ilike('name', parentCategory.trim())
            .is('parent_id', null)
            .maybeSingle();

          if (!existingParent) {
            const { data: createdParent } = await supabase
              .from('inventory_categories')
              .insert([{ name: parentCategory.trim(), parent_id: null }])
              .select()
              .maybeSingle();
            parentId = createdParent?.id || null;
          } else {
            parentId = existingParent.id;
          }

          if (subCategory.trim() && parentId) {
            let subId: number | null = null;
            let { data: existingSub } = await supabase
              .from('inventory_categories')
              .select('id, name')
              .ilike('name', subCategory.trim())
              .eq('parent_id', parentId)
              .maybeSingle();

            if (!existingSub) {
              const { data: createdSub } = await supabase
                .from('inventory_categories')
                .insert([{ name: subCategory.trim(), parent_id: parentId }])
                .select()
                .maybeSingle();
              subId = createdSub?.id || null;
            } else {
              subId = existingSub.id;
            }

            if (category.trim() && subId) {
              let { data: existingCat } = await supabase
                .from('inventory_categories')
                .select('id, name')
                .ilike('name', category.trim())
                .eq('parent_id', subId)
                .maybeSingle();

              if (!existingCat) {
                await supabase
                  .from('inventory_categories')
                  .insert([{ name: category.trim(), parent_id: subId }]);
              }
            }
          }
        } catch (catErr) {
          console.warn('Auto-sync categories warning:', catErr);
        }
      }

      // Auto-sync custom brand if provided
      if (brand.trim()) {
        try {
          const { data: existingBrand } = await supabase
            .from('inventory_surface_finishes')
            .select('id, name')
            .ilike('name', brand.trim())
            .maybeSingle();
          if (!existingBrand) {
            await supabase
              .from('inventory_surface_finishes')
              .insert([{ name: brand.trim() }]);
          }
        } catch (brandErr) {
          console.warn('Auto-sync brand warning:', brandErr);
        }
      }

      const createdRow = data && data[0] ? data[0] : null;
      toast.success(`Product "${databasePayload.product_name}" saved to catalog!`);

      onSuccess({
        id: createdRow ? createdRow.id : Date.now(),
        name: databasePayload.product_name,
        rate: numSale,
        uom: databasePayload.uom,
        category: databasePayload.category
      });

      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Unexpected error saving product');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-[#111827] rounded-2xl shadow-2xl w-full max-w-4xl border border-slate-200/90 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* MODAL HEADER */}
        <div className="border-b border-slate-100 dark:border-slate-800 py-3.5 px-6 flex justify-between items-center bg-slate-50/70 dark:bg-slate-800/40">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <span>Add New Product Master Item</span>
              {isTileCategory && (
                <span className="bg-teal-500/20 text-teal-700 dark:text-teal-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-teal-500/30 uppercase tracking-wider">
                  Tile Mode Active
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select category to automatically load product or tile-specific dimension & packaging fields
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* MODAL BODY FORM */}
        <form onSubmit={handleSubmit} className="p-6 text-xs text-slate-700 dark:text-slate-200 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* SECTION 1: PRODUCT CATEGORY & IDENTITY */}
          <div className="bg-slate-50/60 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-2.5">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                <MdLayers className="text-emerald-600 text-lg" />
                <span>Product Category & Identity</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* 1. Parent Category (Typing or selecting 'tile' triggers Tile Mode!) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-800 dark:text-slate-100 text-xs">
                    Parent Category
                  </label>
                  <button
                    type="button"
                    onClick={() => handleOpenQuickCreate('parent')}
                    className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline transition"
                    title="Add new parent category"
                  >
                    <MdAdd className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
                <AppCombobox
                  value={parentCategory}
                  onChange={handleParentCategoryChange}
                  options={parentOptions}
                  placeholder="-- Select Parent Category --"
                />
              </div>

              {/* 2. Sub Category (Disabled if Parent Category is not selected) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-800 dark:text-slate-100 text-xs">
                    Sub Category
                  </label>
                  <button
                    type="button"
                    onClick={() => handleOpenQuickCreate('sub')}
                    disabled={!parentCategory.trim()}
                    className={`inline-flex items-center gap-0.5 text-[11px] font-bold transition ${
                      !parentCategory.trim()
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
                  value={subCategory}
                  disabled={!parentCategory.trim()}
                  onChange={handleSubCategoryChange}
                  options={subOptions}
                  placeholder={!parentCategory.trim() ? "Select parent category first" : "-- Select Sub Category --"}
                />
              </div>

              {/* 3. Category * (Disabled if Sub Category is not selected) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-800 dark:text-slate-100 text-xs">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleOpenQuickCreate('category')}
                    disabled={!subCategory.trim()}
                    className={`inline-flex items-center gap-0.5 text-[11px] font-bold transition ${
                      !subCategory.trim()
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
                  value={category}
                  disabled={!subCategory.trim()}
                  required
                  onChange={handleCategoryChange}
                  options={categoryOptions}
                  placeholder={!subCategory.trim() ? "Select sub category first" : "-- Select Category --"}
                />
              </div>

              {/* 4. Brand */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-800 dark:text-slate-100 text-xs">
                    Brand
                  </label>
                  <button
                    type="button"
                    onClick={() => handleOpenQuickCreate('brand')}
                    className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline transition"
                    title="Add new brand"
                  >
                    <MdAdd className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
                <AppCombobox
                  value={brand}
                  onChange={handleBrandChange}
                  options={brandOptions}
                  placeholder="Search or enter brand..."
                />
              </div>

              {/* 5. UOM */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-800 dark:text-slate-100 text-xs">
                    {isTileCategory ? 'Inventory UOM (e.g. BOX)' : 'UOM *'}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleOpenQuickCreate('uom')}
                    className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline transition"
                    title="Add new unit of measure"
                  >
                    <MdAdd className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
                <AppCombobox
                  value={uom}
                  onChange={handleUomChange}
                  options={uomOptions}
                  placeholder="Search or enter UOM..."
                />
              </div>

              {/* 6. Code */}
              <div>
                <label className="mb-1 block font-bold text-slate-800 dark:text-slate-100">
                  Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter Code"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 outline-none focus:border-emerald-600 text-xs text-slate-800 dark:text-white font-mono"
                />
              </div>

              {/* 7. Description * (Span 2 columns on larger displays) */}
              <div className="sm:col-span-2">
                <label className="mb-1 block font-bold text-slate-800 dark:text-slate-100">
                  Description <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    isTileCategory
                      ? 'e.g. Master Tiles Calacatta White 60x60 (Glazed Polished)'
                      : 'Enter Description'
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-900 dark:text-white font-semibold"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: DYNAMIC TILE SIZING (Only revealed when Parent Category includes 'tile') */}
          {isTileCategory && (
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-teal-500/30 dark:border-teal-500/20 shadow-sm p-5 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-sm">
                  <MdSquareFoot className="text-xl" />
                  <span>Tile Sizing (Centimeters) & Box Packaging Setup</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Unit: Centimeters (cm) | Area: Square Meters (sq.m)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
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

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
                    Tile Height (cm) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    value={tileHeight}
                    onChange={(e) => setTileHeight(e.target.value)}
                    placeholder="e.g. 60"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-50/50 dark:bg-slate-800/80 outline-none focus:border-teal-600 text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
                    Tile Width (cm) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    value={tileWidth}
                    onChange={(e) => setTileWidth(e.target.value)}
                    placeholder="e.g. 60 or 120"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-50/50 dark:bg-slate-800/80 outline-none focus:border-teal-600 text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
                    Pieces Per Box *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={piecesPerBox}
                    onChange={(e) => setPiecesPerBox(e.target.value)}
                    placeholder="e.g. 4"
                    className="w-full rounded-xl border border-teal-500/50 dark:border-teal-500/50 p-2.5 bg-teal-50/30 dark:bg-teal-950/20 outline-none focus:border-teal-600 text-xs font-mono font-black text-teal-800 dark:text-teal-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
                    Thickness <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={tileThickness}
                    onChange={(e) => setTileThickness(e.target.value)}
                    placeholder="e.g. 9 mm"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-50/50 dark:bg-slate-800/80 outline-none focus:border-teal-600 text-xs text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* LIVE COMPUTED BADGES */}
              <div className="bg-teal-50 dark:bg-teal-950/40 rounded-xl p-3 border border-teal-200 dark:border-teal-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📐</span>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Formatted Tile Size:</span>
                    <strong className="text-teal-800 dark:text-teal-300 font-bold text-sm font-mono">{tileSizeFormatted}</strong>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Area Per Tile:</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono font-bold">
                    {sqMetersPerTile.toFixed(4)} sq.m
                  </strong>
                </div>

                <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-teal-200 dark:border-teal-800 shadow-xs">
                  <span className="text-teal-600 dark:text-teal-400 block text-[10px] font-bold uppercase">Total Coverage / Box:</span>
                  <strong className="text-teal-800 dark:text-teal-300 font-mono font-black text-sm">
                    {totalSqMetersPerBox.toFixed(2)} sq.m
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: PRODUCT PRICING & MARGIN */}
          <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <MdAttachMoney className="text-emerald-600 text-xl" />
                <span>{isTileCategory ? 'Tile Box Pricing & Rate Breakdown' : 'Product Pricing & Margin'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-semibold">Calculated Margin:</span>
                <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  +{profitMarginPercent}% (Rs. {profit.toFixed(2)}/{isTileCategory ? 'box' : (uom || 'unit')})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Purchase Price */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
                  {isTileCategory ? 'Purchase Price (Per Box) *' : 'Purchase Price *'}
                </label>
                <input
                  type="number"
                  step="any"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-50/50 dark:bg-slate-800/80 outline-none focus:border-emerald-600 text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
                {isTileCategory && (
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] mt-1.5 font-mono text-slate-500">
                    <span>≈ Rs. {purchasePerPiece}/pc</span>
                    <span>≈ Rs. {purchasePerSqm}/sq.m</span>
                  </div>
                )}
              </div>

              {/* Sale Price (Retail Rate) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1">
                  {isTileCategory ? 'Sale Price (Per Box) *' : 'Sale Price (Retail Rate) *'}
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-emerald-500/50 dark:border-emerald-500/50 p-2.5 bg-emerald-50/20 dark:bg-emerald-950/20 outline-none focus:border-emerald-600 text-xs font-mono font-black text-emerald-700 dark:text-emerald-300"
                />
                {isTileCategory && (
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] mt-1.5 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>≈ Rs. {salePerPiece}/loose pc</span>
                    <span>≈ Rs. {salePerSqm}/sq.m</span>
                  </div>
                )}
              </div>

              {/* Minimum Stock Alert */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center justify-between">
                  <span>Minimum Stock Alert</span>
                  <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={minStockAlert}
                  onChange={(e) => setMinStockAlert(e.target.value)}
                  placeholder={isTileCategory ? 'e.g. 20 (Boxes)' : 'e.g. 10 (Units)'}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-50/50 dark:bg-slate-800/80 outline-none focus:border-amber-500 text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* MODAL FOOTER */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 items-center">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-60 bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Product...</span>
                </>
              ) : (
                <>
                  <MdSave size={17} />
                  <span>Save Product</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

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
                  {quickCreateType === 'sub' && `Grouping under: "${parentCategory}"`}
                  {quickCreateType === 'category' && `Leaf category under: "${subCategory}"`}
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
    </div>,
    document.body
  );
};

export default QuickAddProductModal;
