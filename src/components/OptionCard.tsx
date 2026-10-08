import React from 'react';

interface OptionCardProps {
  name: string;
  value: string;
  checked: boolean;
  label: string;
  onSelect: () => void;
}

export const OptionCard: React.FC<OptionCardProps> = ({ name, value, checked, label, onSelect }) => {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      name={name}
      value={value}
      onClick={onSelect}
      className={`w-full text-left rounded-2xl border-2 px-4 py-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
        checked
          ? 'border-sky-600 bg-sky-50 shadow-sm'
          : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-slate-50'
      }`}
    >
      <span
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
          checked ? 'border-sky-600' : 'border-slate-300'
        }`}
      >
        {checked && <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />}
      </span>
      <span className={`text-sm ${checked ? 'font-bold text-sky-950' : 'font-semibold text-slate-800'}`}>
        {label}
      </span>
    </button>
  );
};
