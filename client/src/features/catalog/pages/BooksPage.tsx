import { useState } from 'react';
import { useBooks } from '../hooks/catalog.queries';
import { BookCard } from '../components/BookCard';
import { BookDetailModal } from '../components/BookDetailModal';
import { SearchBar } from '../components/SearchBar';
import { FilterChips } from '../components/FilterChips';
import { Spinner } from '../../../components/ui/Spinner';
import { SEOHead } from '../../../components/ui/SEOHead';
import type { Book } from '../../../types/api';

export function BooksPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Parsear el filtro seleccionado para la consulta
  let genre = '';
  let badge = '';
  if (filter.startsWith('genre:')) {
    genre = filter.replace('genre:', '');
  } else if (filter.startsWith('badge:')) {
    badge = filter.replace('badge:', '');
  }

  const { data, isLoading, error } = useBooks({ search, genre, badge, limit: 100 });
  const books = data?.data ?? [];

  // Agrupamiento dinámico para la vista "Todos los libros"
  const bestSellers = books.filter((b) => b.badge === 'Más vendido');
  const novelties = books.filter((b) => b.badge === 'Novedad' || b.badge === 'Destacado');
  const rest = books.filter(
    (b) => b.badge !== 'Más vendido' && b.badge !== 'Novedad' && b.badge !== 'Destacado'
  );

  // Agrupar el resto por género
  const restByGenre = rest.reduce((acc, book) => {
    const g = book.genre || 'Otros';
    if (!acc[g]) acc[g] = [];
    acc[g].push(book);
    return acc;
  }, {} as Record<string, Book[]>);

  const hasContent = books.length > 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <SEOHead
        title="Nuestros Libros | Alma Lectora"
        description="Explorá nuestra biblioteca completa de libros. Filtrá por tu género favorito o usá el buscador para encontrar tu próxima lectura."
      />
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-ink tracking-tight">Nuestros Libros</h1>
        <p className="text-sm text-stone-500 font-sans">
          Explorá nuestra biblioteca completa. Filtrá por tu género favorito o usá el buscador para encontrar tu próxima lectura.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <SearchBar value={search} onChange={setSearch} />
        <FilterChips selectedFilter={filter} onSelectFilter={setFilter} />
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm text-stone-500 font-serif italic">Buscando libros...</p>
        </div>
      ) : error ? (
        <div className="py-12 text-center bg-red-50/50 rounded-lg border border-red-100 max-w-lg mx-auto p-6">
          <p className="text-red-700 font-medium">Error al cargar los libros</p>
          <p className="text-xs text-red-500 mt-1">Por favor intentá de nuevo más tarde.</p>
        </div>
      ) : !hasContent ? (
        <div className="py-20 text-center max-w-md mx-auto">
          <svg className="w-16 h-16 text-stone-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="mt-4 text-lg font-bold font-serif text-ink">Sin Resultados</h3>
          <p className="text-sm text-stone-500 mt-1.5">No encontramos libros que coincidan con tu búsqueda.</p>
        </div>
      ) : filter === '' && search === '' ? (
        /* Agrupamiento seccionado cuando se selecciona "Todos los libros" y no hay búsqueda activa */
        <div className="space-y-12">
          {bestSellers.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-serif text-ink tracking-tight border-b border-paper-dark/60 pb-2">
                🔥 Los más vendidos
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {bestSellers.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onViewDetail={setSelectedBook}
                  />
                ))}
              </div>
            </div>
          )}

          {novelties.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold font-serif text-ink tracking-tight border-b border-paper-dark/60 pb-2">
                ✨ Novedades y Recomendados
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {novelties.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onViewDetail={setSelectedBook}
                  />
                ))}
              </div>
            </div>
          )}

          {Object.entries(restByGenre).map(([genreName, genreBooks]) => (
            <div key={genreName} className="space-y-4">
              <h3 className="text-lg font-bold font-serif text-ink tracking-tight border-b border-paper-dark/60 pb-2">
                📚 {genreName}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {genreBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onViewDetail={setSelectedBook}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Grilla lineal estándar cuando se selecciona un filtro de categoría/badge o hay búsqueda activa */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onViewDetail={setSelectedBook}
            />
          ))}
        </div>
      )}

      <BookDetailModal
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
      />
    </div>
  );
}
