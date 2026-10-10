import React, { useRef, useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import SidebarLinkGroup from './SidebarLinkGroup';
import {
  Home,
  LayoutDashboard,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useModal } from '../../Context/Modal';
import { useAuth } from '../../Context/Auth';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean | ((prev: boolean) => boolean)) => void;
}

const FlyoutSubMenu = ({ item, pathname, handleLinkClick, getTenantPath }: any) => {
  const [showSubFlyout, setShowSubFlyout] = useState(false);

  if (item && item.children && Array.isArray(item.children)) {
    return (
      <li
        className="relative"
        onMouseEnter={() => setShowSubFlyout(true)}
        onMouseLeave={() => setShowSubFlyout(false)}
      >
        <div className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-medium duration-150 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer pr-4">
          <span className="truncate">{item.label}</span>
          <ChevronRight size={12} className="shrink-0 text-slate-400" />
        </div>

        {showSubFlyout && (
          <div
            className="absolute left-full top-0 -ml-1.5 z-99999 w-52 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#1E293B]/95 p-2 shadow-2xl backdrop-blur-md"
            style={{ animation: 'sidebarFlyoutFadeIn 0.15s ease-out forwards' }}
          >
            <div className="absolute top-0 -left-3 w-3 h-full bg-transparent" />
            <ul className="flex flex-col gap-1">
              {item.children.map((child: any, idx: number) => (
                <FlyoutSubMenu
                  key={idx}
                  item={child}
                  pathname={pathname}
                  handleLinkClick={handleLinkClick}
                  getTenantPath={getTenantPath}
                />
              ))}
            </ul>
          </div>
        )}
      </li>
    );
  }

  const destination = (item.path && getTenantPath ? getTenantPath(item.path) : item.path) || '#';
  const isActive = pathname === destination || pathname === item.path;

  return (
    <li>
      <NavLink
        to={destination}
        onClick={handleLinkClick}
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium duration-150 ${
          isActive
            ? 'text-primary bg-primary-light dark:bg-primary/15 font-semibold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
        }`}
      >
        {item.label}
      </NavLink>
    </li>
  );
};

const SidebarItem = ({ item, pathname, depth = 0, sidebarOpen, setSidebarOpen, hideModal, openMenuId, setOpenMenuId, menuUniqueKey, getTenantPath }: any) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showFlyout, setShowFlyout] = useState(false);
  const [flyoutTop, setFlyoutTop] = useState<number>(0);

  const checkHasActiveChild = (routeItem: any): boolean => {
    if (!routeItem) return false;
    if (!routeItem.children || !Array.isArray(routeItem.children)) return false;

    return routeItem.children.some((child: any) => {
      const dest = child.path && getTenantPath ? getTenantPath(child.path) : child.path;
      const cleanChildPath = String(child.path || '').toLowerCase();
      const cleanDest = String(dest || '').toLowerCase();
      const cleanPathname = String(pathname || '').toLowerCase();

      if (cleanChildPath && (cleanPathname === cleanChildPath || cleanPathname === cleanDest)) return true;

      const baseChild = cleanChildPath.replace(/\/(list|customer-details|add)$/i, '');
      if (baseChild && baseChild.length > 2 && cleanPathname.includes(baseChild)) {
        return true;
      }

      if (child.children) return checkHasActiveChild(child);
      return false;
    });
  };

  const itemDestination = item?.path && getTenantPath ? getTenantPath(item.path) : (item?.path || '');
  const isChildActive = checkHasActiveChild(item) || Boolean(item?.path && (pathname === item.path || pathname === itemDestination));

  const [open, setOpen] = useState(isChildActive);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isChildActive) {
      setOpen(true);
      if (depth === 0) setOpenMenuId(menuUniqueKey);
    }
  }, [pathname, isChildActive, depth, menuUniqueKey, setOpenMenuId]);

  useEffect(() => {
    if (depth === 0 && openMenuId !== menuUniqueKey && !isChildActive) {
      setOpen(false);
    }
  }, [openMenuId, menuUniqueKey, depth, isChildActive]);

  const isMobile = windowWidth <= 750;
  const shouldShowLabels = sidebarOpen || isMobile;

  const handleLinkClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
    hideModal();
    setShowFlyout(false);
  };

  const handleMouseEnter = () => {
    if (!sidebarOpen && itemRef.current && !isMobile) {
      const rect = itemRef.current.getBoundingClientRect();
      setFlyoutTop(rect.top);
      setShowFlyout(true);
    }
  };

  if (item.children) {
    return (
      <div
        ref={itemRef}
        className="w-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => !sidebarOpen && !isMobile && setShowFlyout(false)}
      >
        <SidebarLinkGroup activeCondition={isChildActive}>
          {(handleClick, isGroupOpen) => (
            <>
              <NavLink
                to="#"
                className={`group relative flex items-center rounded-xl py-2 px-3 text-xs font-semibold duration-150 ease-in-out uppercase tracking-wider ${
                  isChildActive && shouldShowLabels
                    ? 'text-primary bg-primary-light dark:bg-primary/15'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
                } ${shouldShowLabels ? 'justify-between' : 'justify-center mx-auto w-10 h-10 px-0'}`}
                style={{ paddingLeft: shouldShowLabels ? `${(depth + 1) * 0.75}rem` : undefined }}
                onClick={(e) => {
                  e.preventDefault();
                  const nextState = !open;
                  setOpen(nextState);
                  if (nextState && depth === 0) {
                    setOpenMenuId(menuUniqueKey);
                  } else if (!nextState && depth === 0 && openMenuId === menuUniqueKey) {
                    setOpenMenuId(null);
                  }
                  handleClick();
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.icon && (
                    <item.icon size={16} className={`shrink-0 ${isChildActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  )}
                  {shouldShowLabels && (
                    <span className="truncate text-xs font-bold tracking-wider">{item.label}</span>
                  )}
                </div>
                {shouldShowLabels && (
                  <span className="text-slate-400 transition-transform duration-200 shrink-0">
                    {open ? <ChevronDown size={13} /> : <ChevronRight size={14} />}
                  </span>
                )}
              </NavLink>

              {/* Submenu List */}
              {shouldShowLabels && (
                <div
                  className="transition-all duration-200 ease-in-out overflow-hidden"
                  style={{
                    maxHeight: open ? '1000px' : '0px',
                    opacity: open ? '100' : '0',
                    pointerEvents: open ? 'auto' : 'none'
                  }}
                >
                  <ul className="flex flex-col gap-0.5 py-1 pl-6">
                    {Array.isArray(item.children) && item.children.filter((c: any) => !c.hideFromSidebar).map((child: any, idx: number) => (
                      <SidebarItem
                        key={idx}
                        item={child}
                        pathname={pathname}
                        depth={depth + 1}
                        sidebarOpen={sidebarOpen}
                        setSidebarOpen={setSidebarOpen}
                        hideModal={hideModal}
                        openMenuId={openMenuId}
                        setOpenMenuId={setOpenMenuId}
                        menuUniqueKey={`${menuUniqueKey}-${idx}`}
                        getTenantPath={getTenantPath}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </SidebarLinkGroup>

        {!sidebarOpen && showFlyout && !isMobile && (
          <div
            className="fixed left-[56px] z-99999 w-56 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#1E293B]/95 p-2.5 shadow-2xl backdrop-blur-md"
            style={{
              top: `${flyoutTop}px`,
              animation: 'sidebarFlyoutFadeIn 0.18s ease-out forwards'
            }}
          >
            <div className="px-3 py-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800 font-bold text-[10px] text-primary uppercase tracking-wider text-left">
              {item.label}
            </div>
            <ul className="flex flex-col gap-1">
              {item.children.filter((c: any) => !c.hideFromSidebar).map((child: any, idx: number) => (
                <FlyoutSubMenu key={idx} item={child} pathname={pathname} handleLinkClick={handleLinkClick} getTenantPath={getTenantPath} />
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  const singleDestination = (item.path && getTenantPath ? getTenantPath(item.path) : item.path) || '#';
  const isDirectActive = item.path && (pathname === singleDestination || pathname === item.path);

  return (
    <li onClick={handleLinkClick} className="w-full" title={!shouldShowLabels ? item.label : undefined}>
      <NavLink
        to={singleDestination}
        className={`group relative flex items-center rounded-xl py-2 px-3 text-xs font-medium duration-150 ease-in-out ${
          isDirectActive
            ? 'text-primary bg-primary-light dark:bg-primary/15 font-semibold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
        } ${shouldShowLabels ? 'justify-start' : 'justify-center mx-auto w-10 h-10 px-0'}`}
        style={{ paddingLeft: shouldShowLabels ? `${(depth + 1) * 0.75}rem` : undefined }}
      >
        {item.icon && (
          <item.icon size={15} className={`shrink-0 ${isDirectActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`} />
        )}
        {shouldShowLabels && (
          <span className="text-xs ml-2.5 truncate font-medium">{item.label}</span>
        )}
      </NavLink>
    </li>
  );
};

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const { getRoleBasedRoutes, logout, tenantId } = useAuth();
  const roleRoutes = getRoleBasedRoutes();
  const location = useLocation();
  const { hideModal } = useModal();
  const { pathname } = location;
  const sidebar = useRef<any>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const isTenantRoute = pathname.startsWith('/tenant=') || pathname.startsWith('/tenant-');
  const rawTenant = tenantId || (isTenantRoute ? pathname.split('/')[1] : '');
  const cleanSlug = rawTenant ? rawTenant.replace(/^tenant=/, '').replace(/^tenant-/, '').toLowerCase().trim() : '';
  const reservedPrefixes = ['auth', 'dev', 'assets', 'api', 'purchase', 'sales', 'reports', 'registration', 'administration', 'dashboard', 'sales-return'];
  const cleanPrefix = cleanSlug && !reservedPrefixes.includes(cleanSlug) ? `/${cleanSlug}` : '';

  const getTenantPath = (path?: string) => {
    if (!path || typeof path !== 'string') return '';
    if (!cleanPrefix) return path;
    if (path === '/') return cleanPrefix;
    const cleanSub = path.startsWith('/') ? path : `/${path}`;
    return `${cleanPrefix}${cleanSub}`;
  };

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 750;
  const isHomeActive = pathname === '/' || (cleanPrefix ? pathname === cleanPrefix : false);
  const isDashboardActive = pathname === '/dashboard' || pathname.startsWith('/dashboard');

  return (
    <>
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-9999 backdrop-blur-xs transition-opacity duration-300" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        ref={sidebar}
        className={`fixed left-0 top-0 z-99999 flex h-screen flex-col bg-white duration-200 ease-in-out dark:bg-[#0B0F17] shadow-sm ${
          isMobile ? 'block' : 'min-[751px]:sticky min-[751px]:top-0'
        } ${
          sidebarOpen
            ? 'w-64 translate-x-0 border-r border-slate-200/90 dark:border-slate-800 visible'
            : 'w-0 -translate-x-full min-[751px]:w-16 min-[751px]:translate-x-0 min-[751px]:border-r min-[751px]:border-slate-200/90 min-[751px]:dark:border-slate-800 max-[750px]:invisible'
        }`}
      >
        {/* Navigation Section */}
        <div className="no-scrollbar flex flex-col overflow-y-auto overflow-x-hidden flex-1 py-3 px-2.5">
          <nav className="flex flex-col gap-1 w-full">
            
            {/* Top "Home" Button (Xenith Blue Pill Style) */}
            <NavLink
              to={getTenantPath('/') || '/'}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition duration-150 ${
                isHomeActive
                  ? 'bg-[#EBF5FF] text-[#1E40AF] dark:bg-blue-950/40 dark:text-blue-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
              } ${sidebarOpen || isMobile ? 'justify-start' : 'justify-center mx-auto w-10 h-10 px-0'}`}
              title={!sidebarOpen && !isMobile ? 'Home' : undefined}
            >
              <Home size={17} className={isHomeActive ? 'text-[#2563EB]' : 'text-slate-400'} />
              {(sidebarOpen || isMobile) && <span>Home</span>}
            </NavLink>

            {/* Dashboard Link */}
            <NavLink
              to={getTenantPath('/dashboard') || '/dashboard'}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition duration-150 ${
                isDashboardActive
                  ? 'bg-primary-light text-primary dark:bg-primary/15 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 font-semibold'
              } ${sidebarOpen || isMobile ? 'justify-start' : 'justify-center mx-auto w-10 h-10 px-0'}`}
              title={!sidebarOpen && !isMobile ? 'Dashboard' : undefined}
            >
              <LayoutDashboard size={16} className={isDashboardActive ? 'text-primary' : 'text-slate-400'} />
              {(sidebarOpen || isMobile) && <span>Dashboard</span>}
            </NavLink>

            <div className="my-2 border-t border-slate-100 dark:border-slate-800" />

            {/* Dynamic Module Routes (CRM, SALES, PURCHASE, INVENTORY, etc.) */}
            <ul className="flex flex-col gap-1 w-full">
              {(Array.isArray(roleRoutes) ? roleRoutes : [])
                .filter((route: any) => route && !route.hideFromSidebar && route.label !== 'Home' && route.label !== 'Dashboard')
                .map((route: any, index: number) => (
                  <SidebarItem
                    key={index}
                    item={route}
                    pathname={pathname}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    hideModal={hideModal}
                    openMenuId={openMenuId}
                    setOpenMenuId={setOpenMenuId}
                    menuUniqueKey={`root-${index}`}
                    getTenantPath={getTenantPath}
                  />
                ))}
            </ul>

          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
