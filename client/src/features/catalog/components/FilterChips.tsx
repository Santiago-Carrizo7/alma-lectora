interface FilterChipsProps {
  selectedFilter: string;
  onSelectFilter: (filter: string) => void;
}

const CHIPS = [
  { id: '', label: 'Todos los libros' },
  { id: 'badge:Novedad', label: '✨ Novedades' },
  { id: 'badge:Más vendido', label: '🔥 Más vendidos' },
  { id: 'genre:Romance Juvenil', label: 'Romance Juvenil' },
  { id: 'genre:Fantasía', label: 'Fantasía' },
];

export function FilterChips({ selectedFilter, onSelectFilter }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mt-4 px-2">
      {CHIPS.map((chip) => {
        const isSelected = selectedFilter === chip.id;
        return (
          <button
            key={chip.id}
            onClick={() => onSelectFilter(chip.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all duration-300 cursor-pointer
              ${
                isSelected
                  ? 'bg-forest border-forest text-stone-100 shadow-sm'
                  : 'bg-paper border-stone-300 text-stone-600 hover:border-forest/40 hover:text-forest'
              }
            `}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
