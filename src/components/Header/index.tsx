import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  MdMenu,
  MdPhone,
  MdAdd,
  MdNotificationsNone,
  MdStorefront,
  MdKeyboardArrowDown,
  MdLogout,
  MdReceipt,
  MdShoppingCart,
  MdPersonAdd,
  MdAttachMoney,
  MdInventory2
} from 'react-icons/md';
import { useAuth } from '../../Context/Auth';
import { useThemeColor } from '../../Context/ThemeColor';
import ClickOutside from '../ClickOutside';
import DarkModeSwitcher from './DarkModeSwitcher';
import ThemeColorPicker from './ThemeColorPicker';

const Header = (props: {
  sidebarOpen: string | boolean | undefined;
  setSidebarOpen: (arg0: boolean | ((prev: boolean) => boolean)) => void;
}) => {
  const { businessName, userLocationName, userName, userEmail, role, logout } = useAuth();
  const { activeColor, isLightColor } = useThemeColor();
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const initialLetter = (userName || userEmail || 'Admin').charAt(0).toUpperCase();
  const currentBranch = userLocationName || 'Main Branch';

  return (
    <header className="sticky top-0 z-999 flex w-full bg-white dark:bg-[#0B0F17] border-b border-slate-200/90 dark:border-slate-800 transition-all duration-200 shadow-xs">
      <div className="flex flex-grow items-center justify-between px-3 sm:px-5 py-2.5 w-full">
        
        {/* Left: Hamburger + Logo Branding */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            aria-controls="sidebar"
            onClick={(e) => {
              e.stopPropagation();
              props.setSidebarOpen((prev: any) => !prev);
            }}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Sidebar"
          >
            <MdMenu size={22} />
          </button>

          <NavLink to="/" className="flex items-center gap-2.5 select-none">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shadow-md font-black text-xs tracking-tight transition-colors duration-200"
              style={{
                backgroundColor: activeColor.primary,
                color: isLightColor ? '#0F172A' : '#FFFFFF',
                border: isLightColor ? '1px solid rgba(0,0,0,0.18)' : 'none'
              }}
            >
              <span>NHT</span>
            </div>
            <div className="flex items-baseline gap-1.5 font-bold tracking-tight">
              <span className="text-[17px] font-black text-slate-900 dark:text-white">NHT Enterprises</span>
              <span className="text-[12px] font-semibold text-slate-400 dark:text-slate-500 tracking-wider">ERP</span>
            </div>
          </NavLink>
        </div>

        {/* Right: Hotline + Create + Notifications + Branch + User Profile + Logout */}
        <div className="flex items-center gap-2 sm:gap-3.5">
          
          {/* Hotline */}
          <a
            href="tel:+923223805981"
            className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition"
          >
            <MdPhone className="text-primary text-sm rotate-12" />
            <span>Call Us: <strong className="font-bold text-slate-800 dark:text-slate-200">+92 322 3805981</strong></span>
          </a>

          {/* Quick "+ Create" Action Button */}
          <ClickOutside onClick={() => setCreateDropdownOpen(false)} className="relative">
            <button
              onClick={() => setCreateDropdownOpen(!createDropdownOpen)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
              style={{
                backgroundColor: activeColor.primary,
                color: isLightColor ? '#0F172A' : '#FFFFFF',
                border: isLightColor ? '1px solid rgba(0,0,0,0.18)' : 'none'
              }}
            >
              <MdAdd size={16} />
              <span>Create</span>
              <MdKeyboardArrowDown size={14} className="opacity-80" />
            </button>

            {createDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] p-2 shadow-2xl z-99999 animate-fadeIn">
                <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Quick Actions
                </div>
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => { setCreateDropdownOpen(false); navigate('/sales/invoice/new'); }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-left"
                  >
                    <MdReceipt className="text-primary text-base" /> New Sales Invoice
                  </button>
                  <button
                    onClick={() => { setCreateDropdownOpen(false); navigate('/purchase/purchases/add'); }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-left"
                  >
                    <MdShoppingCart className="text-primary text-base" /> New Purchase Order
                  </button>
                  <button
                    onClick={() => { setCreateDropdownOpen(false); navigate('/sales/customers/add'); }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-left"
                  >
                    <MdPersonAdd className="text-primary text-base" /> Add Customer
                  </button>
                  <button
                    onClick={() => { setCreateDropdownOpen(false); navigate('/registration/vouchers/add'); }}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-left"
                  >
                    <MdAttachMoney className="text-primary text-base" /> Create Payment Voucher
                  </button>
                </div>
              </div>
            )}
          </ClickOutside>

          {/* Notification Bell */}
          <button
            className="relative p-2 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Notifications"
          >
            <MdNotificationsNone size={18} />
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ backgroundColor: activeColor.primary }}
            />
          </button>

          {/* Branch Selector Pill */}
          <ClickOutside onClick={() => setBranchDropdownOpen(false)} className="relative hidden md:block">
            <button
              onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200/90 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition cursor-pointer"
            >
              <MdStorefront className="text-slate-500 text-sm" />
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">NHT</span>
                <span className="text-[11px] font-bold truncate max-w-[100px]">{currentBranch}</span>
              </div>
              <MdKeyboardArrowDown size={14} className="text-slate-400" />
            </button>
          </ClickOutside>

          {/* User Profile Avatar Pill */}
          <ClickOutside onClick={() => setUserDropdownOpen(false)} className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-primary/30 transition cursor-pointer"
              title="User Account & Settings"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-colors duration-200"
                style={{
                  backgroundColor: activeColor.primary,
                  color: isLightColor ? '#0F172A' : '#FFFFFF',
                  border: isLightColor ? '1px solid rgba(0,0,0,0.18)' : 'none'
                }}
              >
                {initialLetter}
              </div>
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#1E293B]/95 p-3.5 shadow-2xl backdrop-blur-md z-99999 animate-fadeIn">
                <div className="pb-3 mb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {userName || businessName || 'Administrator'}
                  </div>
                  <div className="text-xs text-slate-500 truncate">{userEmail || 'admin@nhtenterprises.com'}</div>
                  <div
                    className="inline-block mt-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase"
                    style={{
                      backgroundColor: `${activeColor.primary}18`,
                      color: activeColor.primary
                    }}
                  >
                    {role || 'Super Admin'}
                  </div>
                </div>

                {/* Theme Customization inside User Menu */}
                <div className="py-2 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Dark Theme</span>
                    <DarkModeSwitcher />
                  </div>
                  <div className="pt-1.5">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5 uppercase tracking-wider">
                      Accent Color Theme
                    </span>
                    <ThemeColorPicker />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition cursor-pointer"
                  >
                    <MdLogout size={16} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </ClickOutside>

          {/* Direct Logout Icon */}
          <button
            onClick={() => logout()}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Log Out"
          >
            <MdLogout size={18} />
          </button>

        </div>

      </div>
    </header>
  );
};

export default Header;