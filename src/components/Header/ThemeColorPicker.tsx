import React from 'react';
import { useThemeColor } from '../../Context/ThemeColor';
import { MdCheck, MdColorize } from 'react-icons/md';

const ThemeColorPicker: React.FC<{ inline?: boolean }> = () => {
  const { activeColor, setThemeColor, setCustomHexColor, presets } = useThemeColor();

  return (
    <div className="w-full">
      <div className="grid grid-cols-8 gap-1.5 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 max-h-[160px] overflow-y-auto">
        {presets.map((preset) => {
          const isSelected = activeColor.id === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => setThemeColor(preset.id)}
              title={preset.name}
              className={`group relative flex items-center justify-center w-7 h-7 rounded-lg transition-transform cursor-pointer shrink-0 ${
                isSelected
                  ? 'scale-110 shadow-sm ring-2 ring-white dark:ring-slate-900 ring-offset-1 z-10'
                  : 'hover:scale-105 opacity-85 hover:opacity-100'
              }`}
              style={{ backgroundColor: preset.primary }}
            >
              {isSelected && <MdCheck size={14} className="text-white drop-shadow-md" />}
            </button>
          );
        })}
      </div>

      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="w-3.5 h-3.5 rounded-full border border-white/60 dark:border-slate-700 shadow-2xs shrink-0"
            style={{ backgroundColor: activeColor.primary }}
          />
          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[130px]" title={activeColor.name}>
            {activeColor.name}
          </span>
        </div>

        {/* Custom Color Wheel Picker */}
        <label
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer shrink-0 shadow-2xs"
          title="Pick any custom hex color"
        >
          <MdColorize size={12} style={{ color: activeColor.primary }} />
          <span>Custom</span>
          <input
            type="color"
            value={activeColor.primary}
            onChange={(e) => setCustomHexColor(e.target.value)}
            className="sr-only"
          />
        </label>
      </div>
    </div>
  );
};

export default ThemeColorPicker;
