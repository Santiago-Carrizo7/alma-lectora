import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBooks, useAccessories, useCombos } from '../hooks/catalog.queries';
import { BookCard } from '../components/BookCard';
import { BookDetailModal } from '../components/BookDetailModal';
import { useCart } from '../../../hooks/useCart';
import { formatPrice } from '../../../services/price';
import { Spinner } from '../../../components/ui/Spinner';
import { Button } from '../../../components/ui/Button';
import type { Book } from '../../../types/api';

// Componente para renderizar la cabecera e intercambiar la grilla (Mobile) por el Carrusel (Desktop)
interface SectionWrapperProps {
  title: string;
  subtitle: string;
  viewAllLink: string;
  mobileGrid: React.ReactNode;
  desktopCarousel: React.ReactNode;
}

function SectionWrapper({ title, subtitle, viewAllLink, mobileGrid, desktopCarousel }: SectionWrapperProps) {
  return (
    <section className="space-y-4">
      <div className="flex justify-between items-end px-2">
        <div>
          <h2 className="text-2xl font-bold font-serif text-ink tracking-tight">{title}</h2>
          <p className="text-xs text-stone-500 mt-1">{subtitle}</p>
        </div>
        <Link
          to={viewAllLink}
          className="text-xs font-semibold text-forest hover:text-forest-light underline tracking-wider uppercase"
        >
          Ver Todos
        </Link>
      </div>

      {/* Mobile view: 2-column grid */}
      <div className="block sm:hidden">
        {mobileGrid}
      </div>

      {/* Desktop view: Carousel/Marquee */}
      <div className="hidden sm:block">
        {desktopCarousel}
      </div>
    </section>
  );
}

// Tarjeta reutilizable de accesorios adaptada para móvil y escritorio
function AccessoryCard({ acc, onAdd }: { acc: any; onAdd: (acc: any) => void }) {
  const isOutOfStock = acc.stock === 0;
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
    <div className="group relative flex flex-col bg-paper-dark/30 rounded-card overflow-hidden border border-paper-dark hover:border-forest/20 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between h-full">
      <div className="relative aspect-square bg-paper-dark overflow-hidden flex items-center justify-center">
        {acc.coverUrl ? (
          <img
            src={acc.coverUrl}
            alt={acc.title}
            loading="lazy"
            className={`object-cover w-full h-full transition-transform duration-500 group-hover:scale-105 ${
              isOutOfStock ? 'grayscale opacity-40' : ''
            }`}
          />
        ) : (
          <div className={`w-full h-full flex flex-col items-center justify-center text-3xl ${isOutOfStock ? 'grayscale opacity-40' : ''}`}>
            {acc.category === 'VELAS' ? '🕯️' : acc.category === 'SEPARADORES' ? '🔖' : '🧩'}
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-stone-900/80 text-stone-100 uppercase tracking-widest font-bold text-xs select-none pointer-events-none">
            AGOTADO
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          <span className="bg-paper-dark text-ink text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shadow-sm">
            {getCategoryLabel(acc.category)}
          </span>
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-bold text-sm text-ink line-clamp-2 leading-snug group-hover:text-forest transition-colors duration-200">{acc.title}</h4>
          {acc.description && <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">{acc.description}</p>}
        </div>
        <div className="mt-3 flex items-center justify-between gap-1">
          <span className="text-sm font-bold text-amber font-mono">{formatPrice(acc.price)}</span>
          <Button
            size="sm"
            onClick={isOutOfStock ? undefined : () => onAdd(acc)}
            disabled={isOutOfStock}
            className="text-xs py-1 px-2.5"
          >
            {isOutOfStock ? 'Agotado' : 'Agregar'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Tarjeta reutilizable de combos adaptada para móvil y escritorio
function ComboCard({ combo, onAdd }: { combo: any; onAdd: (combo: any) => void }) {
  return (
    <div className="group relative flex flex-col bg-paper-dark/30 rounded-card overflow-hidden border border-paper-dark hover:border-forest/20 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between h-full">
      <div className="relative aspect-[4/3] bg-paper-dark overflow-hidden flex items-center justify-center">
        {combo.coverUrl ? (
          <img
            src={combo.coverUrl}
            alt={combo.title}
            loading="lazy"
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">🎁</div>
        )}
        <span className="absolute top-2 left-2 bg-amber text-white text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded shadow-sm z-10">
          OFERTA COMBO
        </span>
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-bold text-sm text-ink line-clamp-2 leading-snug group-hover:text-forest transition-colors duration-200">{combo.title}</h4>
          {combo.description && <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">{combo.description}</p>}
        </div>
        <div className="mt-3 flex items-center justify-between gap-1">
          <span className="text-base font-bold text-amber font-mono">{formatPrice(combo.price)}</span>
          <Button
            size="sm"
            onClick={() => onAdd(combo)}
            className="text-xs py-1 px-2.5 font-semibold"
          >
            Comprar Combo
          </Button>
        </div>
      </div>
    </div>
  );
}

// Componente de Carrusel Manual e Infinito para Libros (Desktop)
function InfiniteBookCarousel({ books, onViewDetail }: { books: Book[]; onViewDetail: (book: Book) => void }) {
  const [items, setItems] = useState<Book[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [translateX, setTranslateX] = useState(0); // en rem
  const [useTransition, setUseTransition] = useState(true);

  useEffect(() => {
    if (books && books.length > 0) {
      const list = books.length < 6 ? [...books, ...books, ...books] : books;
      setItems(list);
    }
  }, [books]);

  if (items.length === 0) return null;

  const stepRem = 16.5; // Ancho del item (w-60 = 15rem) + gap (gap-6 = 1.5rem)

  const handleNext = () => {
    if (isTransitioning || items.length <= 1) return;
    setIsTransitioning(true);
    setUseTransition(true);
    setTranslateX(-stepRem);

    setTimeout(() => {
      setUseTransition(false);
      setTranslateX(0);
      setItems((prev) => {
        const nextItems = [...prev];
        const first = nextItems.shift();
        if (first) nextItems.push(first);
        return nextItems;
      });
      setIsTransitioning(false);
    }, 500);
  };

  const handlePrev = () => {
    if (isTransitioning || items.length <= 1) return;
    setIsTransitioning(true);
    setUseTransition(false);
    setItems((prev) => {
      const nextItems = [...prev];
      const last = nextItems.pop();
      if (last) nextItems.unshift(last);
      return nextItems;
    });
    setTranslateX(-stepRem);

    setTimeout(() => {
      setUseTransition(true);
      setTranslateX(0);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500);
    }, 50);
  };

  return (
    <div className="relative w-full py-4 group">
      <div className="absolute top-0 bottom-0 left-0 w-8 sm:w-16 bg-gradient-to-r from-paper to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-8 sm:w-16 bg-gradient-to-l from-paper to-transparent z-10 pointer-events-none" />

      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-paper/90 border border-paper-dark text-ink shadow-md flex items-center justify-center hover:bg-forest hover:text-white transition-all cursor-pointer opacity-0 group-hover:opacity-100 duration-300 hover:scale-105"
        aria-label="Anterior"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-paper/90 border border-paper-dark text-ink shadow-md flex items-center justify-center hover:bg-forest hover:text-white transition-all cursor-pointer opacity-0 group-hover:opacity-100 duration-300 hover:scale-105"
        aria-label="Siguiente"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      <div className="overflow-hidden px-1">
        <div
          className={`flex gap-6 ${useTransition ? 'transition-transform duration-500 ease-out' : ''}`}
          style={{ transform: `translateX(${translateX}rem)` }}
        >
          {items.map((book, index) => (
            <div key={`${book.id}-${index}`} className="w-60 flex-shrink-0">
              <BookCard book={book} onViewDetail={onViewDetail} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  const { addItem } = useCart();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Carga paralela de catálogos con límites aumentados para segmentación del lado del cliente
  const { data: booksData, isLoading: booksLoading } = useBooks({ limit: 100 });
  const { data: accData, isLoading: accLoading } = useAccessories({ limit: 100 });
  const { data: combosData, isLoading: combosLoading } = useCombos({ limit: 100 });

  const books = booksData?.data ?? [];
  const accessories = accData?.data ?? [];
  const combos = combosData?.data ?? [];

  // Segmentar colecciones para una Home súper completa
  const bestSellers = books.filter((b) => b.badge === 'Más vendido');
  const novelties = books.filter((b) => b.badge === 'Novedad' || b.badge === 'Destacado');
  const bookmarks = accessories.filter((a) => a.category === 'SEPARADORES');

  const handleAddAccessoryToCart = (acc: any) => {
    addItem({
      id: acc.id,
      type: 'ACCESSORY',
      title: acc.title,
      coverUrl: acc.coverUrl,
      price: acc.price,
      stock: acc.stock,
      author: acc.category === 'VELAS' ? 'Velas Aromáticas' : 'Separadores Premium',
    });
  };

  const handleAddComboToCart = (combo: any) => {
    addItem({
      id: combo.id,
      type: 'COMBO',
      title: combo.title,
      coverUrl: combo.coverUrl,
      price: combo.price,
      stock: combo.stock,
      author: 'Combo Promocional',
    });
  };

  const isLoading = booksLoading || accLoading || combosLoading;

  return (
    <div className="space-y-16 animate-fade-in">
      {/* Editorial Hero Banner */}
      <section className="relative overflow-hidden bg-paper-dark border border-paper-dark rounded-xl py-14 px-6 sm:px-12 text-center sm:text-left shadow-sm">
        <div className="max-w-2xl space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-forest/70 font-sans">
            Catálogo Alma Lectora
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-ink leading-tight font-serif">
            Libros que inspiran, <br />
            historias que perduran.
          </h1>
          <p className="text-sm sm:text-base text-ink-muted leading-relaxed font-sans max-w-lg">
            Explorá nuestra selección curada de libros y accesorios premium. Armá tu pedido, ingresá tus datos de entrega y finalizá la compra directamente con nosotros por WhatsApp.
          </p>
          <div className="pt-2 flex flex-wrap gap-3 justify-center sm:justify-start">
            <Link to="/libros">
              <Button size="md" className="font-semibold text-xs py-2.5 px-5">
                📚 Explorar Libros
              </Button>
            </Link>
            <Link to="/accesorios">
              <Button variant="ghost" size="md" className="font-semibold text-xs py-2.5 px-5 border border-stone-400 text-stone-700 hover:bg-stone-100">
                🕯️ Velas y Accesorios
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 hidden md:flex items-center justify-center opacity-10 pointer-events-none">
          <svg className="w-48 h-48 text-ink" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
      </section>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm text-stone-500 font-serif italic">Preparando la librería...</p>
        </div>
      ) : (
        <div className="space-y-16">
          {/* SECCIÓN 1: LO MÁS VENDIDO */}
          {bestSellers.length > 0 && (
            <SectionWrapper
              title="Lo Más Vendido"
              subtitle="Los favoritos indiscutidos de nuestra comunidad."
              viewAllLink="/libros"
              mobileGrid={
                <div className="grid grid-cols-2 gap-4 px-2">
                  {bestSellers.slice(0, 4).map((book) => (
                    <BookCard key={book.id} book={book} onViewDetail={setSelectedBook} />
                  ))}
                </div>
              }
              desktopCarousel={
                <InfiniteBookCarousel books={bestSellers} onViewDetail={setSelectedBook} />
              }
            />
          )}

          {/* SECCIÓN 2: NOVEDADES */}
          {novelties.length > 0 && (
            <SectionWrapper
              title="Novedades"
              subtitle="Los últimos títulos incorporados a nuestra biblioteca."
              viewAllLink="/libros"
              mobileGrid={
                <div className="grid grid-cols-2 gap-4 px-2">
                  {novelties.slice(0, 4).map((book) => (
                    <BookCard key={book.id} book={book} onViewDetail={setSelectedBook} />
                  ))}
                </div>
              }
              desktopCarousel={
                <InfiniteBookCarousel books={novelties} onViewDetail={setSelectedBook} />
              }
            />
          )}

          {/* SECCIÓN 3: SEPARADORES PREMIUM */}
          {bookmarks.length > 0 && (
            <SectionWrapper
              title="Separadores Literarios"
              subtitle="Separadores premium hechos a mano para tus lecturas."
              viewAllLink="/accesorios"
              mobileGrid={
                <div className="grid grid-cols-2 gap-4 px-2">
                  {bookmarks.slice(0, 4).map((acc) => (
                    <AccessoryCard key={acc.id} acc={acc} onAdd={handleAddAccessoryToCart} />
                  ))}
                </div>
              }
              desktopCarousel={
                <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 px-2 scroll-smooth snap-x snap-mandatory scrollbar-none">
                  {bookmarks.map((acc: any) => (
                    <div key={acc.id} className="w-56 sm:w-60 flex-shrink-0 snap-start">
                      <AccessoryCard acc={acc} onAdd={handleAddAccessoryToCart} />
                    </div>
                  ))}
                </div>
              }
            />
          )}

          {/* SECCIÓN 4: COMBOS LITERARIOS */}
          {combos.length > 0 && (
            <SectionWrapper
              title="Combos Literarios"
              subtitle="Ahorrá llevando paquetes combinados con ofertas únicas."
              viewAllLink="/"
              mobileGrid={
                <div className="grid grid-cols-2 gap-4 px-2">
                  {combos.slice(0, 4).map((combo) => (
                    <ComboCard key={combo.id} combo={combo} onAdd={handleAddComboToCart} />
                  ))}
                </div>
              }
              desktopCarousel={
                <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 px-2 scroll-smooth snap-x snap-mandatory scrollbar-none">
                  {combos.map((combo: any) => (
                    <div key={combo.id} className="w-64 sm:w-72 flex-shrink-0 snap-start">
                      <ComboCard combo={combo} onAdd={handleAddComboToCart} />
                    </div>
                  ))}
                </div>
              }
            />
          )}
        </div>
      )}

      {/* Modal para detalles del libro */}
      <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} />
    </div>
  );
}
