import React, { createContext, useContext, useEffect, useState } from 'react';

export interface ThemeColorOption {
  id: string;
  name: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryDark: string;
  primaryRgb: string;
  iconBg: string;
}

export const THEME_COLOR_PRESETS: ThemeColorOption[] = [
  // ── Greens & Teals ──
  {
    id: 'emerald',
    name: 'Emerald Mint (Default)',
    primary: '#059669',
    primaryHover: '#047857',
    primaryLight: '#ECFDF5',
    primaryDark: '#064E3B',
    primaryRgb: '5, 150, 105',
    iconBg: 'from-emerald-500 to-teal-700'
  },
  {
    id: 'forest',
    name: 'Forest Pine',
    primary: '#15803D',
    primaryHover: '#166534',
    primaryLight: '#F0FDF4',
    primaryDark: '#052E16',
    primaryRgb: '21, 128, 61',
    iconBg: 'from-emerald-600 to-green-900'
  },
  {
    id: 'lime',
    name: 'Neon Lime / Volt',
    primary: '#65A30D',
    primaryHover: '#4D7C0F',
    primaryLight: '#F7FEE7',
    primaryDark: '#1A2E05',
    primaryRgb: '101, 163, 13',
    iconBg: 'from-lime-500 to-emerald-700'
  },
  {
    id: 'olive',
    name: 'Tuscan Olive',
    primary: '#4D7C0F',
    primaryHover: '#3F6212',
    primaryLight: '#F7FEE7',
    primaryDark: '#14532D',
    primaryRgb: '77, 124, 15',
    iconBg: 'from-lime-700 to-emerald-900'
  },
  {
    id: 'teal',
    name: 'Xenith Cyan / Teal',
    primary: '#0D9488',
    primaryHover: '#0F766E',
    primaryLight: '#F0FDFA',
    primaryDark: '#134E4A',
    primaryRgb: '13, 148, 136',
    iconBg: 'from-teal-500 to-emerald-700'
  },
  {
    id: 'aqua',
    name: 'Electric Turquoise',
    primary: '#06B6D4',
    primaryHover: '#0891B2',
    primaryLight: '#ECFEFF',
    primaryDark: '#164E63',
    primaryRgb: '6, 182, 212',
    iconBg: 'from-cyan-400 to-teal-700'
  },

  // ── Blues & Indigos ──
  {
    id: 'cobalt',
    name: 'Ocean Cobalt',
    primary: '#0284C7',
    primaryHover: '#0369A1',
    primaryLight: '#F0F9FF',
    primaryDark: '#075985',
    primaryRgb: '2, 132, 199',
    iconBg: 'from-sky-500 to-blue-700'
  },
  {
    id: 'sapphire',
    name: 'Sapphire Blue',
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    primaryLight: '#EFF6FF',
    primaryDark: '#1E3A8A',
    primaryRgb: '37, 99, 235',
    iconBg: 'from-blue-500 to-indigo-700'
  },
  {
    id: 'navy',
    name: 'Midnight Sapphire',
    primary: '#1E3A8A',
    primaryHover: '#172554',
    primaryLight: '#EFF6FF',
    primaryDark: '#0F172A',
    primaryRgb: '30, 58, 138',
    iconBg: 'from-blue-700 to-slate-900'
  },
  {
    id: 'indigo',
    name: 'Royal Iris',
    primary: '#4F46E5',
    primaryHover: '#4338CA',
    primaryLight: '#EEF2FF',
    primaryDark: '#312E81',
    primaryRgb: '79, 70, 229',
    iconBg: 'from-indigo-500 to-purple-700'
  },

  // ── Purples & Pinks ──
  {
    id: 'purple',
    name: 'Purple Velvet',
    primary: '#7C3AED',
    primaryHover: '#6D28D9',
    primaryLight: '#FAF5FF',
    primaryDark: '#4C1D95',
    primaryRgb: '124, 58, 237',
    iconBg: 'from-purple-500 to-violet-800'
  },
  {
    id: 'plum',
    name: 'Plum Noir',
    primary: '#581C87',
    primaryHover: '#3B0764',
    primaryLight: '#FAF5FF',
    primaryDark: '#1E0538',
    primaryRgb: '88, 28, 135',
    iconBg: 'from-purple-800 to-slate-950'
  },
  {
    id: 'fuchsia',
    name: 'Fuchsia Orchid',
    primary: '#C026D3',
    primaryHover: '#A21CAF',
    primaryLight: '#FDF4FF',
    primaryDark: '#701A75',
    primaryRgb: '192, 38, 211',
    iconBg: 'from-fuchsia-500 to-pink-700'
  },
  {
    id: 'coral',
    name: 'Coral Flamingo',
    primary: '#F43F5E',
    primaryHover: '#E11D48',
    primaryLight: '#FFF1F2',
    primaryDark: '#881337',
    primaryRgb: '244, 63, 94',
    iconBg: 'from-rose-400 to-red-600'
  },

  // ── Reds & Wines ──
  {
    id: 'rose',
    name: 'Crimson Rose',
    primary: '#E11D48',
    primaryHover: '#BE123C',
    primaryLight: '#FFF1F2',
    primaryDark: '#881337',
    primaryRgb: '225, 29, 72',
    iconBg: 'from-rose-500 to-pink-700'
  },
  {
    id: 'burgundy',
    name: 'Ruby Burgundy',
    primary: '#9F1239',
    primaryHover: '#881337',
    primaryLight: '#FFF1F2',
    primaryDark: '#4C0519',
    primaryRgb: '159, 18, 57',
    iconBg: 'from-rose-700 to-slate-900'
  },
  {
    id: 'racing',
    name: 'Scuderia Racing Red',
    primary: '#DC2626',
    primaryHover: '#B91C1C',
    primaryLight: '#FEF2F2',
    primaryDark: '#7F1D1D',
    primaryRgb: '220, 38, 38',
    iconBg: 'from-red-600 to-rose-900'
  },

  // ── Golds, Oranges & Earth Tones ──
  {
    id: 'amber',
    name: 'Sunset Amber',
    primary: '#EA580C',
    primaryHover: '#C2410C',
    primaryLight: '#FFF7ED',
    primaryDark: '#7C2D12',
    primaryRgb: '234, 88, 12',
    iconBg: 'from-orange-500 to-amber-700'
  },
  {
    id: 'canary',
    name: 'Canary Marigold',
    primary: '#CA8A04',
    primaryHover: '#A16207',
    primaryLight: '#FEFCE8',
    primaryDark: '#713F12',
    primaryRgb: '202, 138, 4',
    iconBg: 'from-amber-400 to-yellow-600'
  },
  {
    id: 'gold',
    name: 'Golden Bronze',
    primary: '#D97706',
    primaryHover: '#B45309',
    primaryLight: '#FFFBEB',
    primaryDark: '#78350F',
    primaryRgb: '217, 119, 6',
    iconBg: 'from-amber-500 to-yellow-700'
  },
  {
    id: 'clay',
    name: 'Desert Terracotta',
    primary: '#9A3412',
    primaryHover: '#7C2D12',
    primaryLight: '#FFF7ED',
    primaryDark: '#431407',
    primaryRgb: '154, 52, 18',
    iconBg: 'from-orange-700 to-stone-900'
  },

  // ── Neutrals & Stealth ──
  {
    id: 'titanium',
    name: 'Nordic Titanium',
    primary: '#475569',
    primaryHover: '#334155',
    primaryLight: '#F1F5F9',
    primaryDark: '#0F172A',
    primaryRgb: '71, 85, 105',
    iconBg: 'from-slate-500 to-slate-800'
  },
  {
    id: 'slate',
    name: 'Charcoal Slate',
    primary: '#334155',
    primaryHover: '#1E293B',
    primaryLight: '#F8FAFC',
    primaryDark: '#0F172A',
    primaryRgb: '51, 65, 85',
    iconBg: 'from-slate-600 to-gray-900'
  },
  {
    id: 'onyx',
    name: 'Onyx Stealth (Monochrome)',
    primary: '#18181B',
    primaryHover: '#09090B',
    primaryLight: '#F4F4F5',
    primaryDark: '#09090B',
    primaryRgb: '24, 24, 27',
    iconBg: 'from-zinc-800 to-black'
  }
];

function hexToRgb(hex: string): string {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}

function adjustBrightness(hex: string, percent: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  let r = (num >> 16) + Math.round(255 * (percent / 100));
  let g = ((num >> 8) & 0x00FF) + Math.round(255 * (percent / 100));
  let b = (num & 0x0000FF) + Math.round(255 * (percent / 100));
  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function getLuminance(hex: string): number {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return 0;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return (r * 299 + g * 587 + b * 114) / 1000;
}

export function createCustomTheme(hex: string, name = 'Custom Color'): ThemeColorOption {
  const isVeryLight = getLuminance(hex) > 180;
  return {
    id: `custom-${hex.replace('#', '')}`,
    name,
    primary: hex,
    primaryHover: isVeryLight ? '#E2E8F0' : adjustBrightness(hex, -12),
    primaryLight: isVeryLight ? '#F8FAFC' : adjustBrightness(hex, 85),
    primaryDark: isVeryLight ? '#0F172A' : adjustBrightness(hex, -50),
    primaryRgb: hexToRgb(hex),
    iconBg: 'from-slate-700 to-slate-900'
  };
}

interface ThemeColorContextType {
  activeColor: ThemeColorOption;
  setThemeColor: (colorId: string) => void;
  setCustomHexColor: (hex: string) => void;
  presets: ThemeColorOption[];
  isLightColor: boolean;
}

const ThemeColorContext = createContext<ThemeColorContextType>({
  activeColor: THEME_COLOR_PRESETS[0],
  setThemeColor: () => {},
  setCustomHexColor: () => {},
  presets: THEME_COLOR_PRESETS,
  isLightColor: false
});

export const ThemeColorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeColor, setActiveColor] = useState<ThemeColorOption>(() => {
    try {
      const saved = localStorage.getItem('zac_theme_color');
      if (saved) {
        if (saved.startsWith('#')) {
          return createCustomTheme(saved, `Custom (${saved.toUpperCase()})`);
        }
        const found = THEME_COLOR_PRESETS.find(p => p.id === saved || p.primary === saved);
        if (found) return found;
      }
    } catch (_) {}
    return THEME_COLOR_PRESETS[0];
  });

  const isLightColor = getLuminance(activeColor.primary) > 180;

  const applyColor = (color: ThemeColorOption) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const isLight = getLuminance(color.primary) > 180;
      root.style.setProperty('--color-primary', color.primary);
      root.style.setProperty('--color-primary-hover', color.primaryHover);
      root.style.setProperty('--color-primary-light', color.primaryLight);
      root.style.setProperty('--color-primary-dark', color.primaryDark);
      root.style.setProperty('--color-primary-rgb', color.primaryRgb);
      root.style.setProperty('--color-primary-text', isLight ? '#0F172A' : '#FFFFFF');
      root.style.setProperty('--color-primary-border', isLight ? 'rgba(0, 0, 0, 0.25)' : 'transparent');
    }
  };

  useEffect(() => {
    applyColor(activeColor);
  }, [activeColor]);

  const setThemeColor = (colorId: string) => {
    const found = THEME_COLOR_PRESETS.find(p => p.id === colorId);
    if (found) {
      setActiveColor(found);
      try {
        localStorage.setItem('zac_theme_color', found.id);
      } catch (_) {}
    }
  };

  const setCustomHexColor = (hex: string) => {
    if (!hex) return;
    const customOption = createCustomTheme(hex, `Custom (${hex.toUpperCase()})`);
    setActiveColor(customOption);
    try {
      localStorage.setItem('zac_theme_color', hex);
    } catch (_) {}
  };

  return (
    <ThemeColorContext.Provider value={{ activeColor, setThemeColor, setCustomHexColor, presets: THEME_COLOR_PRESETS, isLightColor }}>
      {children}
    </ThemeColorContext.Provider>
  );
};

export const useThemeColor = () => useContext(ThemeColorContext);
