'use client';

import { useEffect, useMemo, useState } from 'react';

export interface FilterableOption {
  value: string;
  label: string;
  searchText?: string;
}

interface FilterableSelectProps {
  label?: string;
  placeholder?: string;
  emptyLabel?: string;
  options: FilterableOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

export default function FilterableSelect({
  label,
  placeholder = 'Escribe para buscar...',
  emptyLabel = 'Sin resultados',
  options,
  value,
  onChange,
  disabled = false,
  error,
}: FilterableSelectProps) {
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value]
  );
  const [query, setQuery] = useState(selectedOption?.label ?? '');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(selectedOption?.label ?? '');
  }, [selectedOption]);

  const filteredOptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;

    return options.filter((option) =>
      `${option.label} ${option.searchText ?? ''}`.toLowerCase().includes(term)
    );
  }, [options, query]);

  function handleSelect(option: FilterableOption) {
    setQuery(option.label);
    onChange(option.value);
    setOpen(false);
  }

  function handleInputChange(nextValue: string) {
    setQuery(nextValue);
    setOpen(true);

    if (!nextValue.trim()) {
      onChange('');
      return;
    }

    const exactMatch = options.find(
      (option) => option.label.toLowerCase() === nextValue.trim().toLowerCase()
    );

    if (exactMatch) {
      onChange(exactMatch.value);
    }
  }

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-[var(--text-main)]">{label}</label>}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(event) => handleInputChange(event.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          placeholder={placeholder}
          disabled={disabled}
          className={`soft-input pr-10 ${error ? 'border-red-400' : ''}`}
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">
          Buscar
        </span>

        {open && !disabled && (
          <div className="absolute z-20 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-[var(--border)] bg-white p-2 shadow-[var(--shadow-soft)]">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(option)}
                  className={`flex w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                    option.value === value
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-strong)]'
                      : 'text-[var(--text-main)] hover:bg-[var(--surface-2)]'
                  }`}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-[var(--text-muted)]">{emptyLabel}</p>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
