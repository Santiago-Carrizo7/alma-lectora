import React from 'react';
import type { Book } from '../../../types/api';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useCart } from '../../../hooks/useCart';
import { formatPrice } from '../../../services/price';
import { BookThumbnail } from '../../../components/ui/BookThumbnail';

interface BookCardProps {
  book: Book;
  onViewDetail: (book: Book) => void;
}

export function BookCard({ book, onViewDetail }: BookCardProps) {
  const { addItem } = useCart();
  const isOutOfStock = book.stock === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
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
    <div
      onClick={isOutOfStock ? undefined : () => onViewDetail(book)}
      className={`group relative flex flex-col h-full bg-paper-dark/30 rounded-card overflow-hidden border border-paper-dark transition-all duration-300 ${
        isOutOfStock
          ? 'cursor-default opacity-90'
          : 'hover:border-forest/20 hover:shadow-xl hover:-translate-y-1.5 cursor-pointer'
      }`}
    >
      {/* Cover Image Wrapper */}
      <div className="relative aspect-3/4 w-full bg-paper-dark flex items-center justify-center overflow-hidden shadow-inner">
        <BookThumbnail
          src={book.coverUrl}
          title={book.title}
          className={`object-cover w-full h-full transition-transform duration-500 group-hover:scale-105 ${
            isOutOfStock ? 'grayscale opacity-40' : ''
          }`}
        />

        {/* Agotado overlay: Velo Traslúcido (Z-10) y Sticker (Z-20) */}
        {isOutOfStock && (
          <>
            <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
              <div className="transform -rotate-6 bg-stone-900 border border-stone-100/30 text-stone-100 font-extrabold text-[11px] tracking-wider px-3 py-1.5 shadow-md uppercase select-none rounded-[2px] whitespace-nowrap">
                AGOTADO
              </div>
            </div>
          </>
        )}

        {/* Badges Overlay */}
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

      {/* Book details */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <h3 className={`font-bold text-base text-ink line-clamp-2 leading-snug min-h-[2.75rem] transition-colors duration-200 ${isOutOfStock ? '' : 'group-hover:text-forest'}`} title={book.title}>
            {book.title}
          </h3>
          <p className="text-xs text-ink-muted mt-1 italic tracking-wide">
            {book.authors && book.authors.length > 0
              ? book.authors.map((a) => a.name).join(', ')
              : 'Autor Desconocido'}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-base font-bold text-amber font-mono">{formatPrice(book.price)}</span>
          <Button
            size="sm"
            onClick={isOutOfStock ? undefined : handleAddToCart}
            disabled={isOutOfStock}
            className="text-xs font-semibold py-1.5 px-3"
          >
            {isOutOfStock ? 'Agotado' : 'Agregar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

