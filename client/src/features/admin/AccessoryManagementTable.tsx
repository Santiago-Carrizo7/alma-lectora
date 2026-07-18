import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAccessories } from './accessories.queries';
import { useDeleteAccessory, useReactivateAccessory } from './accessories.mutations';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { formatPrice } from '../../lib/price';
import type { Accessory, AccessoryCategory } from '../../types/api';
import { useToast } from '../../components/ui/Toast';

const categoryLabels: Record<AccessoryCategory, string> = {
  VELAS: 'Velas',
  SEPARADORES: 'Separadores',
  TRES_D: '3D',
};

export function AccessoryManagementTable() {
  const navigate = useNavigate();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const limit = 10;
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState<string>('');
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

  const { data, isLoading, error } = useAdminAccessories({
    search: debouncedSearch,
    category: category || undefined,
    page,
    limit,
    isActive: activeTab === 'available',
  });

  const deleteMutation = useDeleteAccessory();
  const reactivateMutation = useReactivateAccessory();

  const accessories = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleDeleteClick = (accessory: Accessory) => {
    if (window.confirm(`¿Confirmar baja lógica del accesorio "${accessory.title}"? El registro no se eliminará físicamente.`)) {
      deleteMutation.mutate(accessory.id, {
        onSuccess: () => {
          toast.success('¡Baja del accesorio registrada correctamente!');
        },
        onError: (err: any) => {
          toast.error('Error al dar de baja el accesorio: ' + err.message);
        },
      });
    }
  };

  const handleReactivateClick = (accessory: Accessory) => {
    if (window.confirm(`¿Confirmar reactivación del accesorio "${accessory.title}"?`)) {
      reactivateMutation.mutate(accessory.id, {
        onSuccess: () => {
          toast.success('¡El accesorio ha sido reactivado correctamente!');
          setActiveTab('available');
        },
        onError: (err: any) => {
          toast.error('Error al reactivar el accesorio: ' + err.message);
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
        Error al cargar los accesorios: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Category Filter */}
      <div className="flex justify-between items-center gap-4">
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Buscar por título o descripción..."
          className="flex-1 max-w-md bg-paper border border-stone-300 rounded p-2 text-ink text-sm focus:ring-1 focus:ring-forest focus:outline-none"
        />
        <div className="text-xs text-ink-muted">
          Mostrando {accessories.length} de {total} accesorios
        </div>
      </div>

      {/* Category Chips Bar */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <button
          type="button"
          onClick={() => { setCategory(''); setPage(1); }}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all duration-200 cursor-pointer ${
            category === ''
              ? 'bg-forest border-forest text-stone-100 shadow-sm'
              : 'bg-paper border-stone-300 text-stone-600 hover:border-forest/40 hover:text-forest'
          }`}
        >
          Todos
        </button>
        <button
          type="button"
          onClick={() => { setCategory('VELAS'); setPage(1); }}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all duration-200 cursor-pointer ${
            category === 'VELAS'
              ? 'bg-forest border-forest text-stone-100 shadow-sm'
              : 'bg-paper border-stone-300 text-stone-600 hover:border-forest/40 hover:text-forest'
          }`}
        >
          Velas
        </button>
        <button
          type="button"
          onClick={() => { setCategory('SEPARADORES'); setPage(1); }}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all duration-200 cursor-pointer ${
            category === 'SEPARADORES'
              ? 'bg-forest border-forest text-stone-100 shadow-sm'
              : 'bg-paper border-stone-300 text-stone-600 hover:border-forest/40 hover:text-forest'
          }`}
        >
          Separadores
        </button>
        <button
          type="button"
          onClick={() => { setCategory('TRES_D'); setPage(1); }}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all duration-200 cursor-pointer ${
            category === 'TRES_D'
              ? 'bg-forest border-forest text-stone-100 shadow-sm'
              : 'bg-paper border-stone-300 text-stone-600 hover:border-forest/40 hover:text-forest'
          }`}
        >
          3D
        </button>
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
              <th className="p-4 w-32">Categoría</th>
              <th className="p-4 w-28">Precio</th>
              <th className="p-4 w-24">Stock</th>
              <th className="p-4 w-24">Estado</th>
              <th className="p-4 w-32 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-dark">
            {accessories.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-ink-muted italic">
                  No se encontraron accesorios.
                </td>
              </tr>
            ) : (
              accessories.map((acc) => (
                <tr key={acc.id} className="hover:bg-paper/10 transition-colors">
                  <td className="p-4">
                    {acc.coverUrl ? (
                      <img
                        src={acc.coverUrl}
                        alt={acc.title}
                        className="w-10 h-14 object-cover rounded shadow border border-stone-200"
                      />
                    ) : (
                      <div className="w-10 h-14 bg-paper/50 rounded border border-stone-200 flex items-center justify-center text-[10px] text-stone-400 font-serif">
                        Sin Foto
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-ink">{acc.title}</div>
                    {acc.description && (
                      <div className="text-xs text-ink-muted truncate max-w-md mt-0.5">
                        {acc.description}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-ink-muted">
                    {categoryLabels[acc.category] || acc.category}
                  </td>
                  <td className="p-4 font-mono font-semibold text-amber">
                    {formatPrice(acc.price)}
                  </td>
                  <td className="p-4">
                    <span className={`font-mono text-xs font-semibold px-2 py-1 rounded-full ${
                      acc.stock === 0
                        ? 'bg-red-50 text-red-700'
                        : acc.stock <= 2
                        ? 'bg-yellow-50 text-yellow-700'
                        : 'bg-green-50 text-green-700'
                    }`}>
                      {acc.stock}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      acc.isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-stone-100 text-stone-600'
                    }`}>
                      {acc.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => navigate(`/admin/accesorios/editar/${acc.id}`)}
                        className="text-xs px-2.5 py-1 border border-stone-300 font-semibold"
                      >
                        Editar
                      </Button>
                      {activeTab === 'available' ? (
                        <Button
                          variant="danger"
                          disabled={deleteMutation.isPending}
                          onClick={() => handleDeleteClick(acc)}
                          className="text-xs px-2.5 py-1 font-semibold"
                        >
                          Baja
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          disabled={reactivateMutation.isPending}
                          onClick={() => handleReactivateClick(acc)}
                          className="text-xs px-2.5 py-1 font-semibold bg-forest text-white hover:bg-forest-light"
                        >
                          Reactivar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Grid / Cards (Móvil) */}
      <div className="block md:hidden space-y-4">
        {accessories.length === 0 ? (
          <div className="bg-paper border border-paper-dark rounded-xl p-8 text-center text-ink-muted italic">
            No se encontraron accesorios.
          </div>
        ) : (
          accessories.map((acc) => (
            <div
              key={acc.id}
              className="flex flex-col p-4 bg-paper-dark/40 border border-paper-dark rounded-xl shadow-sm"
            >
              {/* Fila Superior */}
              <div className="flex items-start">
                {acc.coverUrl ? (
                  <img
                    src={acc.coverUrl}
                    alt={acc.title}
                    className="w-12 h-16 object-cover rounded shadow"
                  />
                ) : (
                  <div className="w-12 h-16 bg-paper/50 rounded shadow flex items-center justify-center text-[10px] text-stone-400 font-serif text-center">
                    Sin Foto
                  </div>
                )}
                <div className="flex flex-col min-w-0 pl-3">
                  <div className="text-sm font-bold text-ink truncate">
                    {acc.title}
                  </div>
                  <div className="text-xs text-ink-muted mt-0.5 truncate">
                    {categoryLabels[acc.category] || acc.category}
                  </div>
                  {acc.description && (
                    <div className="text-[10px] text-stone-500 mt-1 truncate">
                      {acc.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Fila Intermedia */}
              <div className="flex justify-between items-center bg-paper-dark p-2.5 rounded-lg my-2">
                <span className="text-sm font-semibold text-amber font-mono">
                  {formatPrice(acc.price)}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  acc.isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-stone-100 text-stone-600'
                }`}>
                  {acc.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {/* Fila Inferior */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 bg-paper-dark border border-stone-300 px-3 py-2 rounded-lg font-semibold text-xs transition-colors">
                  <span className="text-ink-muted">Stock:</span>
                  <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                    acc.stock === 0
                      ? 'bg-red-50 text-red-700'
                      : acc.stock <= 2
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-green-50 text-green-700'
                  }`}>
                    {acc.stock}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/admin/accesorios/editar/${acc.id}`)}
                    className="text-xs px-2.5 py-1 border border-stone-300 font-semibold"
                  >
                    Editar
                  </Button>
                  {activeTab === 'available' ? (
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={deleteMutation.isPending}
                      onClick={() => handleDeleteClick(acc)}
                      className="text-xs px-2.5 py-1 font-semibold"
                    >
                      Baja
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={reactivateMutation.isPending}
                      onClick={() => handleReactivateClick(acc)}
                      className="text-xs px-2.5 py-1 font-semibold bg-forest text-white hover:bg-forest-light"
                    >
                      Reactivar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
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
