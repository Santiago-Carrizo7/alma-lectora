import { useState, useEffect } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const [localVal, setLocalVal] = useState(value);

  // Sync internal state with external value changes
  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  // Debounced input change
  useEffect(() => {
    const handler = setTimeout(() => {
      onChange(localVal);
    }, 400);

    return () => clearTimeout(handler);
  }, [localVal, onChange]);

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
        <svg
          className="h-5 w-5 text-stone-400 group-hover:text-forest transition-colors duration-300"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="text"
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        placeholder="Buscar por título, autor o palabra clave..."
        className="block w-full pl-11 pr-4 py-3 border border-stone-300 rounded-lg bg-paper text-ink font-sans placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-forest/35 focus:border-forest transition-all duration-300 shadow-xs"
      />
      {localVal && (
        <button
          onClick={() => setLocalVal('')}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-ink transition-colors"
          aria-label="Limpiar búsqueda"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
