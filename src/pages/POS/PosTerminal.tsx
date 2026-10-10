import React, { useState, useEffect } from 'react';
import { supabase } from '../../Context/supabaseClient';
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { MdPointOfSale, MdSearch, MdAdd, MdRemove, MdDelete, MdPrint, MdPayment, MdCheck } from 'react-icons/md';
import { toast } from 'react-hot-toast';

const PosTerminal: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    supabase.from('products').select('*').limit(60).then(({ data }) => {
      if (data) setProducts(data);
    });
  }, []);

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, {
        id: product.id,
        name: product.product_name,
        sku: product.sku,
        price: Number(product.retail_price ?? product.unit_price ?? 1000),
        qty: 1
      }]);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const total = Math.max(0, subtotal - discount);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    toast.success(`POS Cash Invoice Generated: Rs. ${total.toLocaleString()}`);
    setCart([]);
  };

  const filtered = products.filter(p =>
    String(p.product_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(p.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-slate-800 dark:text-slate-100 text-xs">
      <Breadcrumb pageName="Point of Sale (POS) Terminal" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Product Catalog Grid */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative">
            <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search items by name, barcode, SKU or category..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] text-xs font-semibold shadow-xs"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[580px] overflow-y-auto pr-1">
            {filtered.map(p => (
              <div
                key={p.id}
                onClick={() => addToCart(p)}
                className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] hover:border-teal-500/50 hover:shadow-md transition cursor-pointer flex flex-col justify-between select-none"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white line-clamp-2">{p.product_name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{p.sku || 'SKU-001'}</div>
                </div>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-mono font-extrabold text-teal-600 dark:text-teal-400">
                    Rs. {Number(p.retail_price ?? p.unit_price ?? 0).toLocaleString()}
                  </span>
                  <span className="p-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600">
                    <MdAdd size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Checkout & Cart Register */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm flex flex-col justify-between h-[640px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <MdPointOfSale className="text-teal-600 text-base" /> Current Counter Register
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold font-mono text-[11px]">
                {cart.length} Items
              </span>
            </div>

            <div className="mt-3 mb-2">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer Name / Mobile"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
              />
            </div>

            {/* Cart Items List */}
            <div className="overflow-y-auto max-h-[300px] flex flex-col gap-2 pr-1 mt-3">
              {cart.length > 0 ? (
                cart.map(item => (
                  <div key={item.id} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
                    <div className="flex-1 pr-2">
                      <div className="font-bold text-slate-900 dark:text-white truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Rs. {item.price.toLocaleString()} each</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateQty(item.id, -1)} className="p-1 rounded bg-slate-200 dark:bg-slate-700">
                        <MdRemove size={12} />
                      </button>
                      <span className="font-mono font-bold w-6 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="p-1 rounded bg-slate-200 dark:bg-slate-700">
                        <MdAdd size={12} />
                      </button>
                      <button onClick={() => removeItem(item.id)} className="p-1 text-rose-500 ml-1">
                        <MdDelete size={14} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400">Cart is empty. Click items on the left to add.</div>
              )}
            </div>
          </div>

          {/* Pricing & Checkout summary */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="font-mono font-bold">Rs. {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Discount (Rs.)</span>
              <input
                type="number"
                value={discount || ''}
                onChange={(e) => setDiscount(Number(e.target.value || 0))}
                className="w-24 text-right px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>
            <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
              <span>Grand Total</span>
              <span className="text-teal-600 font-mono">Rs. {total.toLocaleString()}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="mt-2 w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-sm shadow-md transition"
            >
              Complete Sale & Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PosTerminal;
