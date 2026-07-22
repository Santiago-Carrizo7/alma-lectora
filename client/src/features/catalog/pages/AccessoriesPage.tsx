import { useState } from 'react';
import { useAccessories } from '../hooks/catalog.queries';
import { useCart } from '../../../hooks/useCart';
import { formatPrice } from '../../../services/price';
import { Spinner } from '../../../components/ui/Spinner';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { SearchBar } from '../components/SearchBar';
import { SEOHead } from '../../../components/ui/SEOHead';

const CATEGORIES = [
  { value: '', label: 'Todos' },
  { value: 'VELAS', label: '🕯️ Velas' },
  { value: 'SEPARADORES', label: '🔖 Separadores' },
  { value: 'TRES_D', label: '🧩 Impresiones 3D' },
];

export function AccessoriesPage() {
  const { addItem } = useCart();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const { data, isLoading, error } = useAccessories({ search, category, limit: 100 });
  const accessories = data?.data ?? [];

  const handleAddToCart = (acc: any) => {
    addItem({
      id: acc.id,
      type: 'ACCESSORY',
      title: acc.title,
      coverUrl: acc.coverUrl,
      price: acc.price,
      stock: acc.stock,
      author: acc.category === 'VELAS' ? 'Velas Aromáticas' : acc.category === 'SEPARADORES' ? 'Separadores Literarios' : 'Merchandising 3D',
    });
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'VELAS':
        return 'Vela';
      case 'SEPARADORES':
        return 'Separador';
      case 'TRES_D':
        return 'Impresión 3D';
      default:
        return 'Accesorio';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <SEOHead
        title="Accesorios Literarios | Alma Lectora"
        description="Encontrá velas aromáticas inspiradas en libros, separadores artesanales e impresiones 3D en Alma Lectora."
      />
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-ink tracking-tight">Accesorios Literarios</h1>
        <p className="text-sm text-stone-500 font-sans">
          Acompañá tus lecturas con velitas aromáticas, separadores premium y merchandising impreso en 3D para fanáticos de los libros.
        </p>
      </div>

      <div className="flex flex-col items-center gap-6">
        <SearchBar value={search} onChange={setSearch} />
        
        {/* Category filters */}
        <div className="flex flex-wrap gap-2 justify-center">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all duration-200 cursor-pointer ${
                category === cat.value
                  ? 'bg-forest border-forest text-white shadow-sm'
                  : 'bg-paper border-stone-300 text-stone-700 hover:border-forest/40 hover:text-forest'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm text-stone-500 font-serif italic">Buscando accesorios...</p>
        </div>
      ) : error ? (
        <div className="py-12 text-center bg-red-50/50 rounded-lg border border-red-100 max-w-lg mx-auto p-6">
          <p className="text-red-700 font-medium">Error al cargar accesorios</p>
          <p className="text-xs text-red-500 mt-1">Por favor intentá de nuevo más tarde.</p>
        </div>
      ) : accessories.length === 0 ? (
        <div className="py-20 text-center max-w-md mx-auto">
          <svg className="w-16 h-16 text-stone-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="mt-4 text-lg font-bold font-serif text-ink">Sin Resultados</h3>
          <p className="text-sm text-stone-500 mt-1.5">No encontramos accesorios en esta categoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {accessories.map((acc: any) => {
            const isOutOfStock = acc.stock === 0;
            return (
              <div
                key={acc.id}
                className="group relative flex flex-col bg-paper-dark/30 rounded-card overflow-hidden border border-paper-dark hover:border-forest/20 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
              >
                {/* Image Wrapper */}
                <div className="relative aspect-square w-full bg-paper-dark flex items-center justify-center overflow-hidden shadow-inner">
                  {acc.coverUrl ? (
                    <img
                      src={acc.coverUrl}
                      alt={acc.title}
                      loading="lazy"
                      className={`object-cover w-full h-full transition-transform duration-500 group-hover:scale-105 ${
                        isOutOfStock ? 'grayscale opacity-60' : ''
                      }`}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4 text-center">
                      <span className="text-3xl">🕯️</span>
                      <span className="mt-2 text-xs text-stone-500 font-serif italic">{acc.title}</span>
                    </div>
                  )}

                  {/* Badges Overlay */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
                    {isOutOfStock && <Badge variant="agotado" label="Agotado" />}
                    <span className="bg-paper-dark text-ink text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shadow-sm">
                      {getCategoryLabel(acc.category)}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-ink line-clamp-2 leading-snug group-hover:text-forest transition-colors duration-200" title={acc.title}>
                      {acc.title}
                    </h3>
                    {acc.description && (
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                        {acc.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="text-base font-bold text-amber font-mono">{formatPrice(acc.price)}</span>
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(acc)}
                      disabled={isOutOfStock}
                      className="text-xs font-semibold py-1.5 px-3"
                    >
                      {isOutOfStock ? 'Sin Stock' : 'Agregar'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
