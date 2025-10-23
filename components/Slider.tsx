import React from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, step, onChange, disabled = false }) => {
  return (
    <div className={`w-full ${disabled ? 'opacity-50' : ''}`}>
      <label className="flex justify-between items-center mb-2 text-sm font-medium text-zinc-300">
        <span>{label}</span>
        <span className="px-2 py-1 text-xs font-mono bg-zinc-700 rounded-md text-zinc-200">{value.toFixed(2)}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
      />
    </div>
  );
};

export default Slider;
