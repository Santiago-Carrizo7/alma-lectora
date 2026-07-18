import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { useAccessoryById } from './accessories.queries';
import { useCreateAccessory, useUpdateAccessory } from './accessories.mutations';
import type { AccessoryCategory } from '../../types/api';
import { useToast } from '../../components/ui/Toast';

interface AccessoryFormPanelProps {
  mode: 'create' | 'edit';
}

export function AccessoryFormPanel({ mode }: AccessoryFormPanelProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState<AccessoryCategory>('VELAS');
  
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Form errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Queries and mutations
  const { data: accessoryData, isLoading: isAccessoryLoading } = useAccessoryById(id || '');
  const createMutation = useCreateAccessory();
  const updateMutation = useUpdateAccessory();

  const isPending = createMutation.isPending || updateMutation.isPending;

  const validateField = (name: string, value: string) => {
    let errorMsg = '';
    if (name === 'title') {
      if (!value.trim()) {
        errorMsg = 'El título del accesorio es obligatorio.';
      }
    } else if (name === 'price') {
      if (!value.trim()) {
        errorMsg = 'El precio es obligatorio.';
      } else {
        const val = parseFloat(value);
        if (isNaN(val) || val <= 0) {
          errorMsg = 'El precio debe ser un número mayor a 0.';
        }
      }
    } else if (name === 'stock') {
      if (value === undefined || value === null || value.trim() === '') {
        errorMsg = 'El stock inicial es obligatorio.';
      } else {
        const val = parseInt(value, 10);
        if (isNaN(val) || val < 0) {
          errorMsg = 'El stock debe ser un número entero mayor o igual a 0.';
        }
      }
    }

    setErrors((prev) => {
      const next = { ...prev };
      if (errorMsg) {
        next[name] = errorMsg;
      } else {
        delete next[name];
      }
      return next;
    });

    return !errorMsg;
  };

  useEffect(() => {
    if (mode === 'edit' && accessoryData) {
      setTitle(accessoryData.title);
      setDescription(accessoryData.description || '');
      setPrice(accessoryData.price ? String(accessoryData.price) : '');
      setStock(accessoryData.stock !== undefined ? String(accessoryData.stock) : '0');
      setCategory(accessoryData.category);
      setPreviewUrl(accessoryData.coverUrl);
    } else if (mode === 'create') {
      setTitle('');
      setDescription('');
      setPrice('');
      setStock('');
      setCategory('VELAS');
      setPreviewUrl(null);
      setFile(null);
    }
  }, [mode, accessoryData]);

  // Cleanup object URL on unmount to prevent leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile) {
      setFile(selectedFile);
      // Revoke old blob url if it existed
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isTitleValid = validateField('title', title);
    const isPriceValid = validateField('price', price);
    const isStockValid = validateField('stock', stock);

    if (!isTitleValid || !isPriceValid || !isStockValid) {
      toast.error('Por favor corrige los errores del formulario antes de guardar.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('stock', stock);
    formData.append('category', category);
    
    if (file) {
      formData.append('file', file);
    }

    if (mode === 'create') {
      createMutation.mutate(formData, {
        onSuccess: () => {
          toast.success('¡Accesorio creado con éxito!');
          navigate('/admin/accesorios');
        },
        onError: (err: any) => {
          toast.error('Error al crear el accesorio: ' + err.message);
        },
      });
    } else {
      updateMutation.mutate(
        { id: id!, data: formData },
        {
          onSuccess: () => {
            toast.success('¡Accesorio actualizado con éxito!');
            navigate('/admin/accesorios');
          },
          onError: (err: any) => {
            toast.error('Error al actualizar el accesorio: ' + err.message);
          },
        }
      );
    }
  };

  if (mode === 'edit' && isAccessoryLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={() => navigate('/admin/accesorios')}
          className="text-xs text-forest hover:underline flex items-center gap-1 mb-2 font-medium"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Volver al listado
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Image preview & input */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-paper-dark/30 border border-paper-dark p-5 rounded-xl text-center space-y-4">
            <span className="block text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Imagen del Accesorio
            </span>

            {previewUrl ? (
              <div className="space-y-4">
                <img
                  src={previewUrl}
                  alt="Vista previa del accesorio"
                  className="mx-auto max-h-48 object-cover rounded shadow-md border border-stone-200"
                />
                {file && (
                  <span className="block text-[10px] text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded-full inline-block">
                    Nueva imagen seleccionada
                  </span>
                )}
              </div>
            ) : (
              <div className="h-48 bg-paper/50 rounded-lg border border-dashed border-stone-300 flex flex-col items-center justify-center text-xs text-stone-400 font-serif">
                <span>Sin Imagen</span>
                <span className="text-[10px] text-stone-400 mt-1">Sube un archivo o toma una foto</span>
              </div>
            )}

            <div className="pt-2">
              <label htmlFor="accessoryFile" className="block w-full text-center bg-paper border border-stone-300 hover:bg-stone-50 text-ink rounded-lg p-2.5 text-xs font-semibold cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-forest">
                {previewUrl ? 'Cambiar Imagen' : 'Subir Imagen'}
              </label>
              <input
                id="accessoryFile"
                name="accessoryFile"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                disabled={isPending}
                className="sr-only"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Form fields */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="bg-paper-dark border border-paper-dark rounded-xl p-6 space-y-5">
            <h3 className="font-serif font-bold text-xl text-ink border-b border-paper-dark pb-3">
              {mode === 'create' ? 'Registrar Nuevo Accesorio' : 'Editar Accesorio'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="title" className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                  Título *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={(e) => validateField('title', e.target.value)}
                  disabled={isPending}
                  className="w-full bg-paper border border-stone-300 rounded p-2 text-ink text-sm focus:ring-1 focus:ring-forest focus:outline-none"
                  placeholder="Ej: Vela Aromática de Vainilla"
                />
                {errors.title && <span className="text-[11px] text-red-700 font-bold tracking-wide mt-1 animate-fade-in block">{errors.title}</span>}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="description" className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                  Descripción
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isPending}
                  rows={4}
                  className="w-full bg-paper border border-stone-300 rounded p-2 text-ink text-sm focus:ring-1 focus:ring-forest focus:outline-none"
                  placeholder="Escribe una breve descripción del accesorio..."
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                  Categoría *
                </label>
                <select
                  id="category"
                  name="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AccessoryCategory)}
                  disabled={isPending}
                  className="w-full bg-paper border border-stone-300 rounded p-2 text-ink text-sm focus:ring-1 focus:ring-forest focus:outline-none"
                >
                  <option value="VELAS">Velas</option>
                  <option value="SEPARADORES">Separadores</option>
                  <option value="TRES_D">3D</option>
                </select>
              </div>

              <div>
                <label htmlFor="price" className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                  Precio (ARS) *
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  onBlur={(e) => validateField('price', e.target.value)}
                  disabled={isPending}
                  className="w-full bg-paper border border-stone-300 rounded p-2 text-ink text-sm focus:ring-1 focus:ring-forest focus:outline-none font-mono"
                  placeholder="Ej: 1500.00"
                />
                {errors.price && <span className="text-[11px] text-red-700 font-bold tracking-wide mt-1 animate-fade-in block">{errors.price}</span>}
              </div>

              <div>
                <label htmlFor="stock" className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                  Stock Inicial *
                </label>
                <input
                  id="stock"
                  name="stock"
                  type="number"
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  onBlur={(e) => validateField('stock', e.target.value)}
                  disabled={isPending}
                  className="w-full bg-paper border border-stone-300 rounded p-2 text-ink text-sm focus:ring-1 focus:ring-forest focus:outline-none font-mono"
                  placeholder="Ej: 20"
                />
                {errors.stock && <span className="text-[11px] text-red-700 font-bold tracking-wide mt-1 animate-fade-in block">{errors.stock}</span>}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-paper-dark pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/admin/accesorios')}
                disabled={isPending}
                className="text-xs px-4 border border-stone-300 font-semibold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isPending}
                disabled={isPending}
                className="text-xs px-6 font-serif font-bold shadow-sm flex items-center justify-center gap-2"
              >
                {mode === 'create' ? 'Guardar Registro' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
