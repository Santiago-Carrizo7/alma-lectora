import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminCombos } from '../hooks/combos.queries';
import { useDeleteCombo, useReactivateCombo } from '../hooks/combos.mutations';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { formatPrice } from '../../../services/price';
import type { Combo } from '../../../types/api';
import { useToast } from '../../../components/ui/Toast';

export function ComboManagementTable() {
  const navigate = useNavigate();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const limit = 10;
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'available' | 'archived'>('available');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  const handleTabChange = (tab: 'available' | 'archived') => {
    setActiveTab(tab);
    setPage(1);
  };

  const { data, isLoading, error } = useAdminCombos({
    search: debouncedSearch,
    page,
    limit,
    isActive: activeTab === 'available',
  });

  const deleteMutation = useDeleteCombo();
  const reactivateMutation = useReactivateCombo();

  const combos = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleDeleteClick = (combo: Combo) => {
    if (window.confirm(`¿Confirmar baja lógica del combo "${combo.title}"? El registro no se eliminará físicamente.`)) {
      deleteMutation.mutate(combo.id, {
        onSuccess: () => {
          toast.success('¡Baja del combo registrada correctamente!');
        },
        onError: (err: any) => {
          toast.error('Error al dar de baja el combo: ' + err.message);
        },
      });
    }
  };

  const handleReactivateClick = (combo: Combo) => {
    if (window.confirm(`¿Confirmar reactivación del combo "${combo.title}"?`)) {
      reactivateMutation.mutate(combo.id, {
        onSuccess: () => {
          toast.success('¡El combo ha sido reactivado correctamente!');
        },
        onError: (err: any) => {
          toast.error('Error al reactivar el combo: ' + err.message);
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
        Error al cargar los combos: {(error as Error).message}
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
          placeholder="Buscar por título o descripción..."
          className="flex-1 max-w-md bg-paper border border-stone-300 rounded p-2 text-ink text-sm focus:ring-1 focus:ring-forest focus:outline-none"
        />
        <div className="text-xs text-ink-muted">
          Mostrando {combos.length} de {total} combos
        </div>
      </div>

      {/* Tabs */}
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
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-paper/40 text-xs font-semibold uppercase tracking-wider text-ink-muted border-b border-paper-dark">
              <th className="p-4 w-16">Portada</th>
              <th className="p-4">Título / Info</th>
              <th className="p-4 w-48">Contenido</th>
              <th className="p-4 w-28">Precio Combo</th>
              <th className="p-4 w-24">Estado</th>
              <th className="p-4 w-32 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-dark">
            {combos.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ink-muted italic">
                  No se encontraron combos.
                </td>
              </tr>
            ) : (
              combos.map((combo) => {
                const booksCount = combo.books?.reduce((acc, b) => acc + b.quantity, 0) || 0;
                const accsCount = combo.accessories?.reduce((acc, a) => acc + a.quantity, 0) || 0;

                return (
                  <tr key={combo.id} className="hover:bg-paper/10 transition-colors">
                    <td className="p-4">
                      {combo.coverUrl ? (
                        <img
                          src={combo.coverUrl}
                          alt={combo.title}
                          className="w-10 h-14 object-cover rounded shadow border border-stone-200"
                        />
                      ) : (
                        <div className="w-10 h-14 bg-paper/50 rounded border border-stone-200 flex items-center justify-center text-[10px] text-stone-400 font-serif">
                          Sin Foto
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-ink">{combo.title}</div>
                      {combo.description && (
                        <div className="text-xs text-ink-muted truncate max-w-sm mt-0.5">
                          {combo.description}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {booksCount > 0 && (
                          <span className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            {booksCount} {booksCount === 1 ? 'Libro' : 'Libros'}
                          </span>
                        )}
                        {accsCount > 0 && (
                          <span className="bg-purple-50 text-purple-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            {accsCount} {accsCount === 1 ? 'Accesorio' : 'Accesorios'}
                          </span>
                        )}
                        {booksCount === 0 && accsCount === 0 && (
                          <span className="text-stone-400 text-xs italic">Vacío</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-mono font-semibold text-amber">
                      {formatPrice(combo.price)}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        combo.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-stone-100 text-stone-600'
                      }`}>
                        {combo.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => navigate(`/admin/combos/editar/${combo.id}`)}
                          className="text-xs px-2.5 py-1 border border-stone-300 font-semibold"
                        >
                          Editar
                        </Button>
                        {activeTab === 'available' ? (
                          <Button
                            variant="danger"
                            disabled={deleteMutation.isPending}
                            onClick={() => handleDeleteClick(combo)}
                            className="text-xs px-2.5 py-1 font-semibold"
                          >
                            Baja
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            disabled={reactivateMutation.isPending}
                            onClick={() => handleReactivateClick(combo)}
                            className="text-xs px-2.5 py-1 font-semibold bg-forest text-white hover:bg-forest-light"
                          >
                            Reactivar
                          </Button>
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

      {/* Grid / Cards (Móvil) */}
      <div className="block md:hidden space-y-4">
        {combos.length === 0 ? (
          <div className="bg-paper border border-paper-dark rounded-xl p-8 text-center text-ink-muted italic">
            No se encontraron combos.
          </div>
        ) : (
          combos.map((combo) => {
            const booksCount = combo.books?.reduce((acc, b) => acc + b.quantity, 0) || 0;
            const accsCount = combo.accessories?.reduce((acc, a) => acc + a.quantity, 0) || 0;

            return (
              <div
                key={combo.id}
                className="flex flex-col p-4 bg-paper-dark/40 border border-paper-dark rounded-xl shadow-sm"
              >
                {/* Fila Superior */}
                <div className="flex items-start">
                  {combo.coverUrl ? (
                    <img
                      src={combo.coverUrl}
                      alt={combo.title}
                      className="w-12 h-16 object-cover rounded shadow"
                    />
                  ) : (
                    <div className="w-12 h-16 bg-paper/50 rounded shadow flex items-center justify-center text-[10px] text-stone-400 font-serif text-center">
                      Sin Foto
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 pl-3">
                    <div className="text-sm font-bold text-ink truncate">
                      {combo.title}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {booksCount > 0 && (
                        <span className="bg-blue-50 text-blue-700 text-[9px] font-semibold px-2 py-0.5 rounded-full">
                          {booksCount} {booksCount === 1 ? 'Libro' : 'Libros'}
                        </span>
                      )}
                      {accsCount > 0 && (
                        <span className="bg-purple-50 text-purple-700 text-[9px] font-semibold px-2 py-0.5 rounded-full">
                          {accsCount} {accsCount === 1 ? 'Accesorio' : 'Accesorios'}
                        </span>
                      )}
                    </div>
                    {combo.description && (
                      <div className="text-[10px] text-stone-500 mt-1 truncate">
                        {combo.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Fila Intermedia */}
                <div className="flex justify-between items-center bg-paper-dark p-2.5 rounded-lg my-2">
                  <span className="text-sm font-semibold text-amber font-mono">
                    {formatPrice(combo.price)}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    combo.isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-stone-100 text-stone-600'
                  }`}>
                    {combo.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {/* Fila Inferior */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/admin/combos/editar/${combo.id}`)}
                    className="text-xs px-2.5 py-1 border border-stone-300 font-semibold"
                  >
                    Editar
                  </Button>
                  {activeTab === 'available' ? (
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={deleteMutation.isPending}
                      onClick={() => handleDeleteClick(combo)}
                      className="text-xs px-2.5 py-1 font-semibold"
                    >
                      Baja
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={reactivateMutation.isPending}
                      onClick={() => handleReactivateClick(combo)}
                      className="text-xs px-2.5 py-1 font-semibold bg-forest text-white hover:bg-forest-light"
                    >
                      Reactivar
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
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
    </div>
  );
}
