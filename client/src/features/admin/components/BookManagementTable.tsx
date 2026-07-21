import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminBooks } from '../hooks/admin.queries';
import { useDeleteBook, useUpdateBook, useUpdateBookStock } from '../hooks/admin.mutations';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { formatPrice } from '../../../services/price';
import type { Book } from '../../../types/api';
import { QuickStockModal } from './QuickStockModal';
import { useToast } from '../../../components/ui/Toast';

export function BookManagementTable() {
  const navigate = useNavigate();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const limit = 10;
  const [search, setSearch] = useState('');
  const [selectedBookForStock, setSelectedBookForStock] = useState<Book | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'available' | 'archived'>('available');

  const handleStockClick = (book: Book) => {
    setSelectedBookForStock(book);
    setIsStockModalOpen(true);
  };

  const handleTabChange = (tab: 'available' | 'archived') => {
    setActiveTab(tab);
    setPage(1);
  };

  const { data, isLoading, error } = useAdminBooks({
    search,
    page,
    limit,
    isActive: activeTab === 'available',
  });

  const deleteMutation = useDeleteBook();
  const updateMutation = useUpdateBook();
  const updateStockMutation = useUpdateBookStock();

  const handleSaveStock = async (newStock: number) => {
    if (!selectedBookForStock) return;
    await updateStockMutation.mutateAsync({ id: selectedBookForStock.id, stock: newStock });
  };

  const books = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleDeleteClick = (book: Book) => {
    if (window.confirm(`¿Confirmar baja lógica del libro "${book.title}"? El registro no se eliminará físicamente.`)) {
      deleteMutation.mutate({ id: book.id, permanent: false }, {
        onSuccess: () => {
          toast.success('¡Baja del libro registrada correctamente!');
        },
        onError: (err: any) => {
          toast.error('Error al dar de baja el libro: ' + err.message);
        },
      });
    }
  };

  const handlePermanentDeleteClick = (book: Book) => {
    if (window.confirm(`⚠️ ¿ELIMINAR PERMANENTEMENTE el libro "${book.title}"? Esta acción borrará el registro para siempre de la base de datos y su portada en Supabase. No se puede deshacer.`)) {
      deleteMutation.mutate({ id: book.id, permanent: true }, {
        onSuccess: () => {
          toast.success('¡El libro ha sido eliminado físicamente del sistema!');
        },
        onError: (err: any) => {
          toast.error('Error al eliminar físicamente: ' + err.message);
        },
      });
    }
  };

  const handleReactivateClick = (book: Book) => {
    if (window.confirm(`¿Confirmar reactivación del libro "${book.title}"?`)) {
      updateMutation.mutate({ id: book.id, data: { isActive: true } }, {
        onSuccess: () => {
          toast.success('¡El libro ha sido reactivado correctamente!');
          setActiveTab('available');
        },
        onError: (err: any) => {
          toast.error('Error al reactivar el libro: ' + err.message);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        Error al cargar los libros: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Filter */}
      <div className="flex justify-between items-center gap-4">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Buscar por título, título original o autor..."
          className="flex-1 max-w-md bg-paper border border-stone-300 rounded p-2 text-ink text-sm focus:ring-1 focus:ring-forest focus:outline-none"
        />
        <div className="text-xs text-ink-muted">
          Mostrando {books.length} de {total} libros
        </div>
      </div>

      {/* Tabs de Filtro de Archivados */}
      <div className="flex border-b border-paper-dark pb-1 gap-2">
        <button
          type="button"
          onClick={() => handleTabChange('available')}
          className={`px-4 py-1.5 text-xs font-semibold tracking-wide border-b-2 transition-all duration-200 cursor-pointer ${
            activeTab === 'available'
              ? 'border-forest text-forest'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Disponibles
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('archived')}
          className={`px-4 py-1.5 text-xs font-semibold tracking-wide border-b-2 transition-all duration-200 cursor-pointer ${
            activeTab === 'archived'
              ? 'border-forest text-forest'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Archivados / Bajas
        </button>
      </div>

      {/* Grid / Table (Escritorio) */}
      <div className="hidden md:block bg-paper-dark border border-paper-dark rounded-xl overflow-hidden shadow-sm">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-paper/40 text-xs font-semibold uppercase tracking-wider text-ink-muted border-b border-paper-dark">
                <th className="p-4 w-16">Portada</th>
                <th className="p-4">Título / Info</th>
                <th className="p-4">Autor(es)</th>
                <th className="p-4 w-28">Precio</th>
                <th className="p-4 w-24">Stock</th>
                <th className="p-4 w-24">Estado</th>
                <th className="p-4 w-32 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-dark">
              {books.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-ink-muted italic">
                    No se encontraron libros.
                  </td>
                </tr>
              ) : (
                books.map((book) => {
                  const authorNames = book.authors && book.authors.length > 0
                    ? book.authors.map((a) => a.name).join(', ')
                    : 'Sin autor';

                  return (
                    <tr key={book.id} className="hover:bg-paper/10 transition-colors">
                      <td className="p-4">
                        {book.coverUrl ? (
                          <img
                            src={book.coverUrl}
                            alt={book.title}
                            className="w-10 h-14 object-cover rounded shadow border border-stone-200"
                          />
                        ) : (
                          <div className="w-10 h-14 bg-paper/50 rounded border border-stone-200 flex items-center justify-center text-[10px] text-stone-400 font-serif">
                            Sin Portada
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-ink">{book.title}</div>
                        {book.originalTitle && book.originalTitle !== book.title && (
                          <div className="text-xs text-ink-muted font-sans italic mt-0.5">
                            Original: {book.originalTitle}
                          </div>
                        )}
                        <div className="text-[10px] text-stone-500 font-mono mt-1">
                          ISBN: {book.isbn}
                        </div>
                      </td>
                      <td className="p-4 text-ink-muted">{authorNames}</td>
                      <td className="p-4 font-mono font-semibold text-amber">
                        {formatPrice(book.price)}
                      </td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleStockClick(book)}
                          title="Actualizar stock"
                          className="focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <span className={`font-mono text-xs font-semibold px-2 py-1 rounded-full ${
                            book.stock === 0
                              ? 'bg-red-50 text-red-700'
                              : book.stock <= 2
                              ? 'bg-yellow-50 text-yellow-700'
                              : 'bg-green-50 text-green-700'
                          }`}>
                            {book.stock}
                          </span>
                        </button>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          book.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-stone-100 text-stone-600'
                        }`}>
                          {book.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => navigate(`/admin/editar/${book.id}`)}
                            className="text-xs px-2.5 py-1 border border-stone-300 font-semibold"
                          >
                            Editar
                          </Button>
                           {activeTab === 'available' ? (
                            <Button
                              variant="danger"
                              disabled={deleteMutation.isPending}
                              onClick={() => handleDeleteClick(book)}
                              className="text-xs px-2.5 py-1 font-semibold"
                            >
                              Baja
                            </Button>
                          ) : (
                            <div className="flex gap-2">
                              <Button
                                variant="primary"
                                disabled={updateMutation.isPending}
                                onClick={() => handleReactivateClick(book)}
                                className="text-xs px-2.5 py-1 font-semibold bg-forest text-white hover:bg-forest-light"
                              >
                                Reactivar
                              </Button>
                              <Button
                                variant="danger"
                                disabled={deleteMutation.isPending}
                                onClick={() => handlePermanentDeleteClick(book)}
                                className="text-xs px-2.5 py-1 font-semibold"
                              >
                                Eliminar
                              </Button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid / Cards (Móvil) */}
      <div className="block md:hidden space-y-4">
        {books.length === 0 ? (
          <div className="bg-paper border border-paper-dark rounded-xl p-8 text-center text-ink-muted italic">
            No se encontraron libros.
          </div>
        ) : (
          books.map((book) => {
            const authorNames = book.authors && book.authors.length > 0
              ? book.authors.map((a) => a.name).join(', ')
              : 'Sin autor';

            return (
              <div
                key={book.id}
                className="flex flex-col p-4 bg-paper-dark/40 border border-paper-dark rounded-xl shadow-sm"
              >
                {/* Fila Superior */}
                <div className="flex items-start">
                  {book.coverUrl ? (
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-12 h-16 object-cover rounded shadow"
                    />
                  ) : (
                    <div className="w-12 h-16 bg-paper/50 rounded shadow flex items-center justify-center text-[10px] text-stone-400 font-serif text-center">
                      Sin Portada
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 pl-3">
                    <div className="text-sm font-bold text-ink truncate" title={book.title}>
                      {book.title}
                    </div>
                    <div className="text-xs text-ink-muted mt-0.5 truncate">
                      {authorNames}
                    </div>
                    <div className="text-[10px] text-stone-500 font-mono mt-1">
                      ISBN: {book.isbn}
                    </div>
                  </div>
                </div>

                {/* Fila Intermedia */}
                <div className="flex justify-between items-center bg-paper-dark p-2.5 rounded-lg my-2">
                  <span className="text-sm font-semibold text-amber font-mono">
                    {formatPrice(book.price)}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    book.isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-stone-100 text-stone-600'
                  }`}>
                    {book.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {/* Fila Inferior */}
                <div className="flex items-center justify-between pt-1">
                  {/* Stock Rápido (QuickStock) */}
                  <button
                    type="button"
                    onClick={() => handleStockClick(book)}
                    title="Actualizar stock"
                    className="flex items-center gap-2 bg-paper-dark hover:bg-stone-200 border border-stone-300 px-3 py-2 rounded-lg font-semibold text-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-forest"
                  >
                    <span className="text-ink-muted">Stock:</span>
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                      book.stock === 0
                        ? 'bg-red-50 text-red-700'
                        : book.stock <= 2
                        ? 'bg-yellow-50 text-yellow-700'
                        : 'bg-green-50 text-green-700'
                    }`}>
                      {book.stock}
                    </span>
                  </button>

                  {/* Acciones */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/editar/${book.id}`)}
                      className="text-xs px-2.5 py-1 border border-stone-300 font-semibold"
                    >
                      Editar
                    </Button>
                    {activeTab === 'available' ? (
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={deleteMutation.isPending}
                        onClick={() => handleDeleteClick(book)}
                        className="text-xs px-2.5 py-1 font-semibold"
                      >
                        Baja
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={updateMutation.isPending}
                          onClick={() => handleReactivateClick(book)}
                          className="text-xs px-2.5 py-1 font-semibold bg-forest text-white hover:bg-forest-light"
                        >
                          Reactivar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={deleteMutation.isPending}
                          onClick={() => handlePermanentDeleteClick(book)}
                          className="text-xs px-2.5 py-1 font-semibold"
                        >
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2">
          <Button
            variant="ghost"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="text-xs px-3 border border-stone-300"
          >
            Anterior
          </Button>
          <span className="text-xs text-ink-muted">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="ghost"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="text-xs px-3 border border-stone-300"
          >
            Siguiente
          </Button>
        </div>
      )}

      <QuickStockModal
        isOpen={isStockModalOpen}
        onClose={() => {
          setIsStockModalOpen(false);
          setSelectedBookForStock(null);
        }}
        title={selectedBookForStock?.title || ''}
        subtitle={selectedBookForStock ? `ISBN: ${selectedBookForStock.isbn}` : undefined}
        initialStock={selectedBookForStock?.stock ?? 0}
        onSave={handleSaveStock}
        isPending={updateStockMutation.isPending}
      />
    </div>
  );
}
