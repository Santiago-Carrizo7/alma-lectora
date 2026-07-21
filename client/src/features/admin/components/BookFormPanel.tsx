import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { apiClient } from '../../../services/api-client';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { useBookById } from '../hooks/admin.queries';
import { useCreateBook, useUpdateBook } from '../hooks/admin.mutations';
import { useToast } from '../../../components/ui/Toast';
import { compressImage } from '../../../services/image-compressor';

interface BookFormPanelProps {
  mode: 'create' | 'edit';
}

export function BookFormPanel({ mode }: BookFormPanelProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [isbn, setIsbn] = useState('');
  const [title, setTitle] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [googleBooksId, setGoogleBooksId] = useState('');
  const [authors, setAuthors] = useState<string[]>([]);
  const [synopsis, setSynopsis] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [badge, setBadge] = useState('');
  const [genre, setGenre] = useState('');

  // Local file and preview states
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Form errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Upload state and ref
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scanner states
  const [isScanning, setIsScanning] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Queries and mutations
  const { data: bookData, isLoading: isBookLoading } = useBookById(id || '');
  const createMutation = useCreateBook();
  const updateMutation = useUpdateBook();

  const isMutating = createMutation.isPending || updateMutation.isPending;

  const validateField = (name: string, value: string) => {
    let errorMsg = '';
    if (name === 'isbn') {
      if (!value.trim()) {
        errorMsg = 'El código ISBN es obligatorio.';
      } else if (!/^\d{10}(\d{3})?$/.test(value.trim())) {
        errorMsg = 'El ISBN debe tener exactamente 10 o 13 dígitos numéricos.';
      }
    } else if (name === 'title') {
      if (!value.trim()) {
        errorMsg = 'El título para catálogo es obligatorio.';
      }
    } else if (name === 'price') {
      if (!value.trim()) {
        errorMsg = 'El precio de venta es obligatorio.';
      } else {
        const val = parseFloat(value);
        if (isNaN(val) || val <= 0) {
          errorMsg = 'El precio debe ser un número mayor a 0.';
        }
      }
    } else if (name === 'stock') {
      if (value === undefined || value === null || value.trim() === '') {
        errorMsg = 'El stock disponible es obligatorio.';
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
    if (mode === 'edit' && bookData) {
      setIsbn(bookData.isbn);
      setTitle(bookData.title);
      setOriginalTitle(bookData.originalTitle || '');
      setGoogleBooksId(bookData.googleBooksId || '');
      setAuthors(bookData.authors ? bookData.authors.map((a) => a.name) : []);
      setSynopsis(bookData.synopsis || '');
      setCoverUrl(bookData.coverUrl || '');
      setPreviewUrl(bookData.coverUrl || null);
      setPrice(bookData.price ? String(bookData.price) : '');
      setStock(bookData.stock !== undefined ? String(bookData.stock) : '0');
      setBadge(bookData.badge || '');
      setGenre(bookData.genre || '');
    } else if (mode === 'create') {
      setIsbn('');
      setTitle('');
      setOriginalTitle('');
      setGoogleBooksId('');
      setAuthors([]);
      setSynopsis('');
      setCoverUrl('');
      setPreviewUrl(null);
      setFile(null);
      setPrice('');
      setStock('');
      setBadge('');
      setGenre('');
    }
  }, [mode, bookData]);

  // Cleanup object URL on unmount to prevent leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handler for text input change of coverUrl
  const handleCoverUrlChange = (value: string) => {
    setCoverUrl(value);
    setPreviewUrl(value || null);
    if (file) {
      setFile(null);
    }
  };

  // Auto-fill from ISBN lookup
  const handleIsbnLookup = async (lookupIsbn: string) => {
    if (!lookupIsbn) return;
    setLookupLoading(true);
    try {
      const data = await apiClient.get<{
        title: string | null;
        originalTitle: string | null;
        googleBooksId: string | null;
        authors: string[];
        synopsis: string | null;
        coverUrl: string | null;
      }>(`/books/lookup/${lookupIsbn.trim()}`);

      if (data && (data.title || (data.authors && data.authors.length > 0))) {
        setTitle(data.originalTitle || data.title || '');
        setOriginalTitle(data.originalTitle || data.title || '');
        setGoogleBooksId(data.googleBooksId || '');
        setAuthors(data.authors || []);
        setSynopsis(data.synopsis || '');
        setCoverUrl(data.coverUrl || '');
        setPreviewUrl(data.coverUrl || null);
        setFile(null); // Clear local preview since we're using external data
        toast.success('Metadatos autocompletados desde el ISBN exitosamente.');
      } else {
        toast.error('No se encontraron metadatos para este ISBN. Por favor ingresá los datos manualmente.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Error al buscar metadatos: ' + err.message);
    } finally {
      setLookupLoading(false);
    }
  };

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
        toast.success('Imagen de portada seleccionada y optimizada localmente.');
      } catch (err: any) {
        console.error('Error compressing image:', err);
        toast.error('Error al procesar la imagen: ' + err.message);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  // HTML5 Barcode scanner lifecycle
  useEffect(() => {
    let isMounted = true;
    let isStopping = false;

    if (isScanning) {
      const timer = setTimeout(() => {
        try {
          const scanner = new Html5Qrcode('reader', {
            formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13],
            verbose: false,
          });

          scanner
            .start(
              { facingMode: 'environment' },
              {
                fps: 10,
                qrbox: { width: 280, height: 160 },
              },
              async (decodedText) => {
                if (!isMounted) return;
                setIsScanning(false);
                if (scannerRef.current && !isStopping) {
                  isStopping = true;
                  try {
                    await scannerRef.current.stop();
                  } catch (err) {
                    console.error('Error stopping scanner', err);
                  }
                }
                scannerRef.current = null;
                setIsbn(decodedText);
                await handleIsbnLookup(decodedText);
              },
              () => {
                // quiet error callback
              }
            )
            .then(() => {
              if (isMounted) {
                scannerRef.current = scanner;
              } else {
                scanner.stop().catch((err) => console.error('Error stopping scanner after unmount', err));
              }
            })
            .catch((err) => {
              console.error('Error starting html5-qrcode scanner', err);
              if (isMounted) setIsScanning(false);
            });
        } catch (err) {
          console.error('Error initializing html5-qrcode scanner', err);
          setIsScanning(false);
        }
      }, 100);

      return () => {
        isMounted = false;
        clearTimeout(timer);
        if (scannerRef.current && !isStopping) {
          isStopping = true;
          const currentScanner = scannerRef.current;
          scannerRef.current = null;
          currentScanner.stop().catch((err) => console.error('Error stopping scanner on cleanup', err));
        }
      };
    }
  }, [isScanning]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar todos los campos antes del submit
    const isIsbnValid = validateField('isbn', isbn);
    const isTitleValid = validateField('title', title);
    const isPriceValid = validateField('price', price);
    const isStockValid = validateField('stock', stock);

    if (!isIsbnValid || !isTitleValid || !isPriceValid || !isStockValid) {
      toast.error('Por favor corrige los errores del formulario antes de guardar.');
      return;
    }

    setUploadingImage(true);
    try {
      let finalCoverUrl = coverUrl;

      // Si hay un archivo optimizado local seleccionado, subirlo ahora
      if (file) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await apiClient.post<{ success: boolean; imageUrl: string }>(
          '/admin/upload',
          formData
        );
        finalCoverUrl = res.imageUrl;
      }

      const payload = {
        isbn,
        title,
        originalTitle: originalTitle || null,
        googleBooksId: googleBooksId || null,
        authors,
        synopsis: synopsis || null,
        coverUrl: finalCoverUrl || null,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        badge: badge || null,
        genre: genre || null,
      };

      if (mode === 'create') {
        createMutation.mutate(payload, {
          onSuccess: () => {
            toast.success('¡Libro registrado exitosamente en el catálogo!');
            navigate('/admin');
          },
          onError: (err: any) => {
            toast.error('Error al registrar libro: ' + err.message);
          },
        });
      } else {
        if (!id) return;
        updateMutation.mutate(
          { id, data: payload },
          {
            onSuccess: () => {
              toast.success('¡Libro actualizado exitosamente en el catálogo!');
              navigate('/admin');
            },
            onError: (err: any) => {
              toast.error('Error al actualizar libro: ' + err.message);
            },
          }
        );
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Error al procesar la subida de imagen: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  if (mode === 'edit' && isBookLoading) {
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
          onClick={() => navigate('/admin')}
          className="text-xs text-forest hover:underline flex items-center gap-1 mb-2 font-medium"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Volver al listado
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Scanner section (Only shown in create mode) */}
        <div className="md:col-span-1 space-y-6">
          {mode === 'create' ? (
            <div className="bg-paper-dark/50 border border-paper-dark p-5 rounded-xl space-y-4">
              <h3 className="font-serif font-bold text-lg text-ink">Carga con Escáner</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Pulsá el botón para encender la cámara y escanear el código de barras (EAN-13) de un libro para autocompletar su información.
              </p>

              {isScanning ? (
                <div className="space-y-4">
                  <div id="reader" className="w-full rounded-lg overflow-hidden border border-stone-300 bg-black/5" />
                  <Button
                    variant="danger"
                    type="button"
                    onClick={() => setIsScanning(false)}
                    className="w-full text-xs font-semibold py-2"
                  >
                    Cancelar Escaneo
                  </Button>
                </div>
              ) : (
                <Button
                  variant="primary"
                  type="button"
                  onClick={() => setIsScanning(true)}
                  className="w-full py-2.5 flex items-center justify-center gap-2 font-serif font-bold text-sm shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                  </svg>
                  Escanear Código de Barras
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-paper-dark/30 border border-paper-dark p-5 rounded-xl text-center space-y-2">
              <span className="block text-xs font-semibold text-ink-muted uppercase tracking-wider">Modo Edición</span>
              <p className="text-xs text-ink-muted leading-relaxed">
                Estás editando la información de un libro ya registrado. El código ISBN no puede ser modificado.
              </p>
            </div>
          )}

          {previewUrl && (
            <div className="bg-paper-dark/30 border border-paper-dark p-4 rounded-xl text-center space-y-2">
              <span className="block text-xs font-semibold text-ink-muted uppercase tracking-wider">Vista Previa Portada</span>
              <img src={previewUrl} alt="Portada del libro" className="mx-auto max-h-48 object-cover rounded shadow-md border border-stone-200" />
              {file && (
                <span className="block text-[10px] text-green-700 font-semibold bg-green-50 px-2 py-0.5 rounded-full inline-block mt-1">
                  Nueva imagen seleccionada
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="bg-paper-dark border border-paper-dark rounded-xl p-6 space-y-5">
            <h3 className="font-serif font-bold text-xl text-ink border-b border-paper-dark pb-3">
              {mode === 'create' ? 'Registrar Nuevo Libro' : 'Editar Libro'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="isbn" className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                  Código ISBN (10 o 13 dígitos) *
                </label>
                <div className="flex gap-2">
                  <input
                    id="isbn"
                    name="isbn"
                    type="text"
                    required
                    readOnly={mode === 'edit'}
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    onBlur={(e) => validateField('isbn', e.target.value)}
                    className={`flex-1 bg-paper border border-stone-300 rounded p-2 text-ink text-sm focus:ring-1 focus:ring-forest focus:outline-none font-mono ${mode === 'edit' ? 'bg-stone-100 cursor-not-allowed text-stone-500' : ''}`}
                    placeholder="Ej: 9789878317315"
                  />
                  {mode === 'create' && (
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={lookupLoading || !isbn || isMutating || uploadingImage}
                      onClick={() => handleIsbnLookup(isbn)}
                      className="text-xs border border-stone-300 font-semibold px-4"
                    >
                      {lookupLoading ? <Spinner size="sm" /> : 'Buscar'}
                    </Button>
                  )}
                </div>
                {errors.isbn && <span className="text-[11px] text-red-700 font-bold tracking-wide mt-1 animate-fade-in block">{errors.isbn}</span>}
              </div>

              <div>
                <label htmlFor="title" className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                  Título para Catálogo *
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={(e) => validateField('title', e.target.value)}
                  disabled={isMutating || uploadingImage}
                  className="w-full bg-paper border border-stone-300 rounded p-2 text-ink text-sm focus:ring-1 focus:ring-forest focus:outline-none font-bold"
                  placeholder="Ej: Pecados 1: Rey de la ira"
                />
                {errors.title && <span className="text-[11px] text-red-700 font-bold tracking-wide mt-1 animate-fade-in block">{errors.title}</span>}
              </div>

              <div>
                <label htmlFor="originalTitle" className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                  Título Original (Google Books)
                </label>
                <input
                  id="originalTitle"
                  name="originalTitle"
                  type="text"
                  readOnly
                  value={originalTitle}
                  className="w-full bg-paper/50 border border-stone-300 rounded p-2 text-ink-muted text-sm focus:outline-none cursor-not-allowed"
                  placeholder="Ej: King of Wrath"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="authors" className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                  Autor(es) (No editable)
                </label>
                <input
                  id="authors"
                  name="authors"
                  type="text"
                  readOnly
                  value={authors.join(', ')}
                  className="w-full bg-paper/50 border border-stone-300 rounded p-2 text-ink-muted text-sm focus:outline-none cursor-not-allowed"
                  placeholder="No se cargaron autores"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="synopsis" className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                  Sinopsis / Resumen
                </label>
                <textarea
                  id="synopsis"
                  name="synopsis"
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  disabled={isMutating || uploadingImage}
                  rows={3}
                  className="w-full bg-paper border border-stone-300 rounded p-2 text-ink text-sm focus:ring-1 focus:ring-forest focus:outline-none resize-y"
                  placeholder="Escribí una breve descripción del libro..."
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="coverUrl" className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                  URL de la Portada (Imagen)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="coverUrl"
                    name="coverUrl"
                    type="url"
                    value={coverUrl}
                    onChange={(e) => handleCoverUrlChange(e.target.value)}
                    disabled={isMutating || uploadingImage}
                    className="w-full min-w-0 bg-paper border border-stone-300 rounded p-2 text-ink text-sm focus:ring-1 focus:ring-forest focus:outline-none"
                    placeholder="https://ejemplo.com/portada.jpg"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isMutating || uploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto text-xs border border-stone-300 font-semibold px-4 py-2 sm:py-0 flex items-center justify-center gap-1.5 min-w-[120px]"
                  >
                    {uploadingImage ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                        </svg>
                        Subir Archivo
                      </>
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isMutating || uploadingImage}
                    className="sr-only"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="price" className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                  Precio de Venta ($) *
                </label>
                <input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  onBlur={(e) => validateField('price', e.target.value)}
                  disabled={isMutating || uploadingImage}
                  className="w-full bg-paper border border-stone-300 rounded p-2 text-ink text-sm focus:ring-1 focus:ring-forest focus:outline-none"
                  placeholder="Ej: 14500.00"
                />
                {errors.price && <span className="text-[11px] text-red-700 font-bold tracking-wide mt-1 animate-fade-in block">{errors.price}</span>}
              </div>

              <div>
                <label htmlFor="stock" className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                  Stock Disponible *
                </label>
                <input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  onBlur={(e) => validateField('stock', e.target.value)}
                  disabled={isMutating || uploadingImage}
                  className="w-full bg-paper border border-stone-300 rounded p-2 text-ink text-sm focus:ring-1 focus:ring-forest focus:outline-none"
                  placeholder="Ej: 5"
                />
                {errors.stock && <span className="text-[11px] text-red-700 font-bold tracking-wide mt-1 animate-fade-in block">{errors.stock}</span>}
              </div>

              <div>
                <label htmlFor="genre" className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                  Género
                </label>
                <input
                  id="genre"
                  name="genre"
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  disabled={isMutating || uploadingImage}
                  className="w-full bg-paper border border-stone-300 rounded p-2 text-ink text-sm focus:ring-1 focus:ring-forest focus:outline-none"
                  placeholder="Ej: Romance Contemporáneo"
                />
              </div>

              <div>
                <label htmlFor="badge" className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                  Etiqueta Especial (Badge)
                </label>
                <select
                  id="badge"
                  name="badge"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  disabled={isMutating || uploadingImage}
                  className="w-full bg-paper border border-stone-300 rounded p-2 text-ink text-sm focus:ring-1 focus:ring-forest focus:outline-none"
                >
                  <option value="">Ninguna</option>
                  <option value="Novedad">Novedad</option>
                  <option value="Destacado">Destacado</option>
                  <option value="Más vendido">Más vendido</option>
                  <option value="Oferta">Oferta</option>
                  <option value="Últimas unidades">Últimas unidades</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/admin')}
                disabled={isMutating || uploadingImage}
                className="flex-1 py-3 border border-stone-300 font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isMutating || uploadingImage}
                disabled={isMutating || uploadingImage}
                className="flex-1 py-3 font-serif text-lg font-bold shadow-md"
              >
                {mode === 'create' ? 'Guardar Libro' : 'Actualizar Libro'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
