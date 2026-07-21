import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { useComboById } from '../hooks/combos.queries';
import { useCreateCombo, useUpdateCombo } from '../hooks/combos.mutations';
import { useAdminBooks } from '../hooks/admin.queries';
import { useAdminAccessories } from '../hooks/accessories.queries';
import { apiClient } from '../../../services/api-client';
import { formatPrice } from '../../../services/price';
import { BookThumbnail } from '../../../components/ui/BookThumbnail';
import type { AccessoryCategory } from '../../../types/api';
import { useToast } from '../../../components/ui/Toast';
import { compressImage } from '../../../services/image-compressor';

const categoryLabels: Record<AccessoryCategory, string> = {
  VELAS: 'Velas',
  SEPARADORES: 'Separadores',
  TRES_D: '3D',
};

interface ComboFormPanelProps {
  mode: 'create' | 'edit';
}

interface SelectedProduct {
  id: string;
  title: string;
  coverUrl: string | null;
  price: string;
  quantity: number;
}

export function ComboFormPanel({ mode }: ComboFormPanelProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  // General fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);

  // Search fields
  const [bookSearch, setBookSearch] = useState('');
  const [debouncedBookSearch, setDebouncedBookSearch] = useState('');
  const [accSearch, setAccSearch] = useState('');
  const [debouncedAccSearch, setDebouncedAccSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedBookSearch(bookSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [bookSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedAccSearch(accSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [accSearch]);

  // Selected arrays
  const [selectedBooks, setSelectedBooks] = useState<SelectedProduct[]>([]);
  const [selectedAccessories, setSelectedAccessories] = useState<SelectedProduct[]>([]);

  const [uploadingImage, setUploadingImage] = useState(false);

  // Queries
  const { data: comboData, isLoading: isComboLoading } = useComboById(id || '');

  // Product searches
  const { data: booksResult } = useAdminBooks({
    search: debouncedBookSearch,
    page: 1,
    limit: 5,
    isActive: true,
  });

  const { data: accsResult } = useAdminAccessories({
    search: debouncedAccSearch,
    page: 1,
    limit: 5,
    isActive: true,
  });

  // Mutations
  const createMutation = useCreateCombo();
  const updateMutation = useUpdateCombo();

  const isPending = createMutation.isPending || updateMutation.isPending || uploadingImage;

  useEffect(() => {
    if (mode === 'edit' && comboData) {
      setTitle(comboData.title);
      setDescription(comboData.description || '');
      setPrice(comboData.price ? String(comboData.price) : '');
      setStock(comboData.stock !== undefined ? String(comboData.stock) : '0');
      setExistingCoverUrl(comboData.coverUrl);
      setPreviewUrl(comboData.coverUrl);

      // Populate selected books
      if (comboData.books) {
        setSelectedBooks(
          comboData.books.map((b: any) => ({
            id: b.book.id,
            title: b.book.title,
            coverUrl: b.book.coverUrl,
            price: String(b.book.price),
            quantity: b.quantity,
          }))
        );
      }

      // Populate selected accessories
      if (comboData.accessories) {
        setSelectedAccessories(
          comboData.accessories.map((a: any) => ({
            id: a.accessory.id,
            title: a.accessory.title,
            coverUrl: a.accessory.coverUrl,
            price: String(a.accessory.price),
            quantity: a.quantity,
          }))
        );
      }
    } else if (mode === 'create') {
      setTitle('');
      setDescription('');
      setPrice('');
      setStock('0');
      setExistingCoverUrl(null);
      setPreviewUrl(null);
      setFile(null);
      setSelectedBooks([]);
      setSelectedAccessories([]);
    }
  }, [mode, comboData]);

  // Clean blob URL
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    if (selectedFile) {
      try {
        const optimizedFile = await compressImage(selectedFile);
        setFile(optimizedFile);
        if (previewUrl && previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(URL.createObjectURL(optimizedFile));
      } catch (err: any) {
        console.error('Error compressing image:', err);
        toast.error('Error al procesar la imagen: ' + err.message);
      }
    }
  };

  const handleAddBook = (book: any) => {
    setSelectedBooks((prev) => {
      const exists = prev.find((b) => b.id === book.id);
      if (exists) {
        return prev.map((b) => b.id === book.id ? { ...b, quantity: b.quantity + 1 } : b);
      }
      return [
        ...prev,
        {
          id: book.id,
          title: book.title,
          coverUrl: book.coverUrl,
          price: String(book.price),
          quantity: 1,
        },
      ];
    });
    setBookSearch('');
  };

  const handleAddAccessory = (acc: any) => {
    setSelectedAccessories((prev) => {
      const exists = prev.find((a) => a.id === acc.id);
      if (exists) {
        return prev.map((a) => a.id === acc.id ? { ...a, quantity: a.quantity + 1 } : a);
      }
      return [
        ...prev,
        {
          id: acc.id,
          title: acc.title,
          coverUrl: acc.coverUrl,
          price: String(acc.price),
          quantity: 1,
        },
      ];
    });
    setAccSearch('');
  };

  const updateBookQty = (id: string, delta: number) => {
    setSelectedBooks((prev) =>
      prev
        .map((b) => (b.id === id ? { ...b, quantity: Math.max(1, b.quantity + delta) } : b))
    );
  };

  const updateAccQty = (id: string, delta: number) => {
    setSelectedAccessories((prev) =>
      prev
        .map((a) => (a.id === id ? { ...a, quantity: Math.max(1, a.quantity + delta) } : a))
    );
  };

  const removeBook = (id: string) => {
    setSelectedBooks((prev) => prev.filter((b) => b.id !== id));
  };

  const removeAccessory = (id: string) => {
    setSelectedAccessories((prev) => prev.filter((a) => a.id !== id));
  };

  // Calculate sum of individual items
  const sumOfItems = [...selectedBooks, ...selectedAccessories].reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !price) {
      toast.error('Por favor completa los campos obligatorios (*)');
      return;
    }

    if (selectedBooks.length === 0 && selectedAccessories.length === 0) {
      toast.error('El combo debe contener al menos un producto (libro o accesorio)');
      return;
    }

    try {
      let finalCoverUrl = existingCoverUrl;

      // Stage 1: Upload image if file is selected
      if (file) {
        setUploadingImage(true);
        const uploadFd = new FormData();
        uploadFd.append('file', file);
        const res = await apiClient.post<{ success: boolean; imageUrl: string }>(
          '/admin/upload',
          uploadFd
        );
        finalCoverUrl = res.imageUrl;
        setUploadingImage(false);
      }

      // Stage 2: Submit JSON payload
      const payload = {
        title,
        description,
        price: Number(price),
        coverUrl: finalCoverUrl,
        stock: parseInt(stock, 10),
        books: selectedBooks.map((b) => ({ bookId: b.id, quantity: b.quantity })),
        accessories: selectedAccessories.map((a) => ({ accessoryId: a.id, quantity: a.quantity })),
      };

      if (mode === 'create') {
        createMutation.mutate(payload, {
          onSuccess: () => {
            toast.success('¡Combo creado correctamente!');
            navigate('/admin/combos');
          },
          onError: (err: any) => {
            toast.error('Error al crear el combo: ' + err.message);
          },
        });
      } else {
        updateMutation.mutate(
          { id: id!, data: payload },
          {
            onSuccess: () => {
              toast.success('¡Combo actualizado correctamente!');
              navigate('/admin/combos');
            },
            onError: (err: any) => {
              toast.error('Error al actualizar el combo: ' + err.message);
            },
          }
        );
      }
    } catch (err: any) {
      setUploadingImage(false);
      toast.error('Error en el proceso de subida de imagen: ' + err.message);
    }
  };

  if (mode === 'edit' && isComboLoading) {
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
          onClick={() => navigate('/admin/combos')}
          className="text-xs text-forest hover:underline flex items-center gap-1 mb-2 font-medium"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Volver al listado
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Image Previews */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-paper-dark/30 border border-paper-dark p-3 md:p-5 rounded-xl text-center space-y-3">
            <span className="block text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Imagen del Combo
            </span>

            {previewUrl ? (
              <div className="space-y-4">
                <div className="max-h-32 overflow-hidden flex items-center justify-center rounded shadow-sm border border-stone-200">
                  <img
                    src={previewUrl}
                    alt="Vista previa del combo"
                    className="w-full h-full object-cover"
                  />
                </div>
                {file && (
                  <span className="block text-[10px] text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded-full inline-block">
                    Nueva imagen seleccionada
                  </span>
                )}
              </div>
            ) : (
              <div className="h-24 md:h-36 bg-paper/50 rounded-lg border border-dashed border-stone-300 flex flex-col items-center justify-center text-xs text-stone-400 font-serif">
                <span>Sin Imagen</span>
                <span className="text-[10px] text-stone-400 mt-1">Sube un archivo o toma una foto</span>
              </div>
            )}

            <div className="pt-2">
              <label className="block w-full text-center bg-paper border border-stone-300 hover:bg-stone-50 text-ink rounded-lg p-2.5 text-xs font-semibold cursor-pointer transition-colors">
                <span>{previewUrl ? 'Cambiar Imagen' : 'Subir Imagen'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isPending}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          <div className="bg-paper-dark/30 border border-paper-dark p-3 md:p-5 rounded-xl space-y-2">
            <h4 className="font-serif font-bold text-sm text-ink">Información de Precio</h4>
            <div className="text-xs text-ink-muted leading-relaxed space-y-1">
              <div className="flex justify-between">
                <span>Suma de productos:</span>
                <span className="font-mono">{formatPrice(sumOfItems)}</span>
              </div>
              <div className="flex justify-between font-bold text-amber">
                <span>Precio Combo:</span>
                <span className="font-mono">{price ? formatPrice(price) : '$0.00'}</span>
              </div>
              {sumOfItems > 0 && price && (
                <div className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded mt-2 text-center font-bold">
                  Descuento aplicado: {(((sumOfItems - Number(price)) / sumOfItems) * 100).toFixed(0)}%
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-paper-dark border border-paper-dark rounded-xl p-4 md:p-6 space-y-4">
            <h3 className="font-serif font-bold text-xl text-ink border-b border-paper-dark pb-3">
              {mode === 'create' ? 'Crear Nuevo Combo' : 'Editar Combo'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                  Título del Combo *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isPending}
                  className="w-full bg-paper border border-stone-300 rounded p-2 text-ink text-sm focus:ring-1 focus:ring-forest focus:outline-none"
                  placeholder="Ej: Combo Lector Apasionado"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                  Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isPending}
                  rows={3}
                  className="w-full bg-paper border border-stone-300 rounded p-2 text-ink text-sm focus:ring-1 focus:ring-forest focus:outline-none"
                  placeholder="Escribe una breve descripción del combo..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                  Precio Final Combo (ARS) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={isPending}
                  className="w-full bg-paper border border-stone-300 rounded p-2 text-ink text-sm focus:ring-1 focus:ring-forest focus:outline-none font-mono"
                  placeholder="Ej: 8500.00"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                  Stock Disponible *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  disabled={isPending}
                  className="w-full bg-paper border border-stone-300 rounded p-2 text-ink text-sm focus:ring-1 focus:ring-forest focus:outline-none font-mono"
                  placeholder="Ej: 10"
                />
              </div>

              <hr className="border-paper-dark/60 my-4" />

              {/* Books linking */}
              <div className="space-y-2 relative">
                <label className="block text-xs font-bold uppercase tracking-wider text-forest">
                  Enlazar Libros del Catálogo
                </label>
                <input
                  type="text"
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  placeholder="Buscar libro por título o autor..."
                  disabled={isPending}
                  className="w-full bg-paper border border-stone-300 rounded p-2 text-ink text-sm focus:ring-1 focus:ring-forest focus:outline-none"
                />

                {bookSearch.trim() && booksResult?.data && (
                  <div className="absolute z-50 w-full bg-paper border border-stone-300 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1 divide-y divide-stone-100">
                    {booksResult.data.length === 0 ? (
                      <div className="p-3 text-xs text-ink-muted italic">No se encontraron libros</div>
                    ) : (
                      booksResult.data.map((book: any) => (
                        <div
                          key={book.id}
                          onClick={() => handleAddBook(book)}
                          className="flex items-center justify-between p-2.5 hover:bg-stone-50 cursor-pointer transition-colors gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <BookThumbnail src={book.coverUrl} title={book.title} className="w-8 h-10 object-cover rounded border border-stone-200 shrink-0" />
                            <div className="min-w-0 flex-1 flex flex-col">
                              <div className="font-bold text-xs text-ink truncate">{book.title}</div>
                              <div className="text-[10px] text-ink-muted truncate">
                                {book.authors && book.authors.length > 0
                                  ? book.authors.map((a: any) => a.name).join(', ')
                                  : 'Sin autor'}
                              </div>
                            </div>
                          </div>
                          <div className="font-mono text-xs text-amber font-semibold shrink-0">
                            {formatPrice(book.price)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Selected books list */}
                {selectedBooks.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {selectedBooks.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between bg-paper-dark p-2 md:p-3 rounded-lg border border-stone-200"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <BookThumbnail src={item.coverUrl} title={item.title} className="w-8 h-11 object-cover rounded shadow shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-ink truncate">{item.title}</div>
                            <div className="text-[10px] text-stone-500 font-mono">Unitario: {formatPrice(item.price)}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <div className="flex items-center border border-stone-300 rounded bg-paper">
                            <button
                              type="button"
                              onClick={() => updateBookQty(item.id, -1)}
                              disabled={isPending}
                              className="px-2.5 py-1 text-xs hover:bg-stone-100 transition-colors disabled:opacity-50"
                            >
                              -
                            </button>
                            <span className="px-3 py-1 text-xs font-mono font-bold text-ink">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateBookQty(item.id, 1)}
                              disabled={isPending}
                              className="px-2.5 py-1 text-xs hover:bg-stone-100 transition-colors disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeBook(item.id)}
                            disabled={isPending}
                            className="p-2 text-stone-400 hover:text-red-600 transition-colors"
                            title="Eliminar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <hr className="border-paper-dark/60 my-4" />

              {/* Accessories linking */}
              <div className="space-y-2 relative">
                <label className="block text-xs font-bold uppercase tracking-wider text-forest">
                  Enlazar Accesorios del Catálogo
                </label>
                <input
                  type="text"
                  value={accSearch}
                  onChange={(e) => setAccSearch(e.target.value)}
                  placeholder="Buscar accesorio por título o descripción..."
                  disabled={isPending}
                  className="w-full bg-paper border border-stone-300 rounded p-2 text-ink text-sm focus:ring-1 focus:ring-forest focus:outline-none"
                />

                {accSearch.trim() && accsResult?.data && (
                  <div className="absolute z-50 w-full bg-paper border border-stone-300 rounded-lg shadow-lg max-h-48 overflow-y-auto mt-1 divide-y divide-stone-100">
                    {accsResult.data.length === 0 ? (
                      <div className="p-3 text-xs text-ink-muted italic">No se encontraron accesorios</div>
                    ) : (
                      accsResult.data.map((acc: any) => (
                        <div
                          key={acc.id}
                          onClick={() => handleAddAccessory(acc)}
                          className="flex items-center justify-between p-2.5 hover:bg-stone-50 cursor-pointer transition-colors gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {acc.coverUrl ? (
                              <img src={acc.coverUrl} className="w-8 h-10 object-cover rounded border border-stone-200" alt={acc.title} />
                            ) : (
                              <div className="w-8 h-10 bg-stone-100 rounded border border-stone-200 flex items-center justify-center text-xs">
                                🕯️
                              </div>
                            )}
                            <div className="min-w-0 flex-1 flex flex-col">
                              <div className="font-bold text-xs text-ink truncate">{acc.title}</div>
                              <div className="text-[10px] text-ink-muted truncate">
                                {categoryLabels[acc.category as AccessoryCategory] || acc.category}
                              </div>
                            </div>
                          </div>
                          <div className="font-mono text-xs text-amber font-semibold shrink-0">
                            {formatPrice(acc.price)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Selected accessories list */}
                {selectedAccessories.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {selectedAccessories.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between bg-paper-dark p-2 md:p-3 rounded-lg border border-stone-200"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {item.coverUrl ? (
                            <img src={item.coverUrl} className="w-8 h-11 object-cover rounded shadow" alt={item.title} />
                          ) : (
                            <div className="w-8 h-11 bg-stone-100 rounded text-[8px] flex items-center justify-center text-stone-400 font-serif">Sin Foto</div>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-ink truncate">{item.title}</div>
                            <div className="text-[10px] text-stone-500 font-mono">Unitario: {formatPrice(item.price)}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <div className="flex items-center border border-stone-300 rounded bg-paper">
                            <button
                              type="button"
                              onClick={() => updateAccQty(item.id, -1)}
                              disabled={isPending}
                              className="px-2.5 py-1 text-xs hover:bg-stone-100 transition-colors disabled:opacity-50"
                            >
                              -
                            </button>
                            <span className="px-3 py-1 text-xs font-mono font-bold text-ink">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateAccQty(item.id, 1)}
                              disabled={isPending}
                              className="px-2.5 py-1 text-xs hover:bg-stone-100 transition-colors disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeAccessory(item.id)}
                            disabled={isPending}
                            className="p-2 text-stone-400 hover:text-red-600 transition-colors"
                            title="Eliminar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-paper-dark pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/admin/combos')}
                disabled={isPending}
                className="text-xs px-4 border border-stone-300 font-semibold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isPending}
                className="text-xs px-6 font-serif font-bold shadow-sm flex items-center justify-center gap-2"
              >
                {isPending && <Spinner size="sm" />}
                {mode === 'create' ? 'Guardar Combo' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
