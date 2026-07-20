
import { useState, useEffect } from 'react';
import type { Book } from '../../../types/api';
import { Modal } from '../../../components/ui/Modal';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useCart } from '../../../hooks/useCart';
import { formatPrice } from '../../../services/price';

interface BookDetailModalProps {
  book: Book | null;
  onClose: () => void;
}

export function BookDetailModal({ book, onClose }: BookDetailModalProps) {
  const { addItem } = useCart();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (book) {
      setHasError(false);
    }
  }, [book?.id]);

  if (!book) return null;

  const isOutOfStock = book.stock === 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const authorNames = book.authors && book.authors.length > 0
      ? book.authors.map((a) => a.name).join(', ')
      : 'Autor Desconocido';

    addItem({
      id: book.id,
      type: 'BOOK',
      title: book.title,
      author: authorNames,
      coverUrl: book.coverUrl,
      price: book.price,
      stock: book.stock,
    });
  };

  return (
    <Modal isOpen={!!book} onClose={onClose} title="Detalle del Libro">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-8">
        {/* Cover */}
        <div className="md:col-span-2 flex justify-center items-start">
          <div className="relative w-48 sm:w-full aspect-3/4 rounded-card overflow-hidden shadow-lg border border-paper-dark bg-paper-dark">
            {book.coverUrl && !hasError ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                onError={() => setHasError(true)}
                className={`object-cover w-full h-full ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <svg className="w-16 h-16 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="mt-2 text-sm text-stone-500 font-serif italic">{book.title}</span>
              </div>
            )}
            
            <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
              {isOutOfStock && <Badge variant="agotado" label="Agotado" />}
              {!isOutOfStock && book.badge && (
                <Badge
                  variant={book.badge.toLowerCase().includes('oferta') ? 'oferta' : 'custom'}
                  label={book.badge}
                />
              )}
            </div>
          </div>
        </div>

        {/* Content details */}
        <div className="md:col-span-3 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-ink tracking-tight leading-tight">
              {book.title}
            </h2>
            <p className="text-base text-forest font-semibold mt-1.5">
              {book.authors && book.authors.length > 0
                ? book.authors.map((a) => a.name).join(', ')
                : 'Autor Desconocido'}
            </p>
            <p className="text-xs text-stone-500 font-mono mt-0.5">ISBN: {book.isbn}</p>

            <div className="mt-6 border-t border-paper-dark pt-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-ink-muted mb-2">Sinopsis</h4>
              {book.synopsis ? (
                <p className="text-sm text-stone-700 leading-relaxed font-sans whitespace-pre-line">
                  {book.synopsis}
                </p>
              ) : (
                <p className="text-sm text-stone-400 italic">No hay sinopsis disponible para este libro.</p>
              )}
            </div>
          </div>

          <div className="mt-8 border-t border-paper-dark pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-stone-500 uppercase tracking-wider">Precio</span>
              <span className="text-3xl font-extrabold text-amber font-mono mt-0.5">{formatPrice(book.price)}</span>
            </div>

            <Button
              size="lg"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="w-full sm:w-auto font-semibold flex items-center justify-center gap-2"
            >
              {isOutOfStock ? (
                'Producto Agotado'
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Agregar al Carrito
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
