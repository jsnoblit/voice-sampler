
import React from 'react';
import type { VoiceOption, VoiceName } from '../types';

interface VoiceSelectorProps {
  label: string;
  value: VoiceName;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: VoiceOption[];
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ label, value, onChange, options }) => {
  return (
    <div className="w-full">
      <label htmlFor="voice-select" className="block mb-2 text-sm font-medium text-zinc-300">
        {label}
      </label>
      <div className="relative">
        <select
          id="voice-select"
          value={value}
          onChange={onChange}
          className="block w-full px-4 py-3 text-base text-white bg-zinc-700 border border-zinc-600 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default VoiceSelector;
