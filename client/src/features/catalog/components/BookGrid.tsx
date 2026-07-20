import { useState } from 'react';
import { useBooks } from '../hooks/catalog.queries';
import { BookCard } from './BookCard';
import { BookDetailModal } from './BookDetailModal';
import { SearchBar } from './SearchBar';
import { FilterChips } from './FilterChips';
import { Spinner } from '../../../components/ui/Spinner';
import type { Book } from '../../../types/api';

export function BookGrid() {
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const { data, isLoading, error } = useBooks({ search, genre });

  const books = data?.data ?? [];

  // Grouping logic for "Todos" view
  const bestSellers = books.filter(b => b.badge === 'Más vendido');
  const novelties = books.filter(b => b.badge === 'Novedad' || b.badge === 'Destacado');
  const rest = books.filter(b => b.badge !== 'Más vendido' && b.badge !== 'Novedad' && b.badge !== 'Destacado');

  const restByGenre = rest.reduce((acc, book) => {
    const g = book.genre || 'Otros';
    if (!acc[g]) acc[g] = [];
    acc[g].push(book);
    return acc;
  }, {} as Record<string, Book[]>);

  const hasContent = books.length > 0;

  return (
    <div className="w-full">
      {/* Search and Filters */}
      <div className="mb-10 flex flex-col items-center">
        <SearchBar value={search} onChange={setSearch} />
        <FilterChips selectedFilter={genre} onSelectFilter={setGenre} />
      </div>

      {/* Main Catalog View */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm text-stone-500 font-serif italic">Buscando en los estantes...</p>
        </div>
      ) : error ? (
        <div className="py-12 text-center bg-red-50/50 rounded-lg border border-red-100 max-w-lg mx-auto p-6">
          <p className="text-red-700 font-medium">Error al cargar el catálogo</p>
          <p className="text-xs text-red-500 mt-1">Por favor intentá de nuevo más tarde.</p>
        </div>
      ) : !hasContent ? (
        <div className="py-20 text-center max-w-md mx-auto">
          <svg
            className="w-16 h-16 text-stone-400 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <h3 className="mt-4 text-lg font-bold font-serif text-ink">Estantería Vacía</h3>
          <p className="text-sm text-stone-500 mt-1.5">No encontramos libros que coincidan con tu búsqueda.</p>
        </div>
      ) : genre === '' ? (
        /* Segmented vertical sections when "Todos los libros" is selected */
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
                ✨ Novedades
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
        /* Flat standard grid when a specific genre filter is selected */
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

      {/* Book Detail Modal */}
      <BookDetailModal
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
      />
    </div>
  );
}
