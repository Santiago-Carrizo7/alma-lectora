import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { useStoreConfig } from './config.queries';
import { useUpdateStoreConfig } from './config.mutations';
import { useToast } from '../../components/ui/Toast';

export function StoreConfigPanel() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data, isLoading } = useStoreConfig(true); // isAdmin = true for staleTime: 0
  const mutation = useUpdateStoreConfig();

  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [freeShippingMin, setFreeShippingMin] = useState('');
  const [bannerMessage, setBannerMessage] = useState('');
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  useEffect(() => {
    if (data) {
      setWhatsappPhone(data.whatsappPhone);
      setInstagramUrl(data.instagramUrl);
      setShippingCost(data.shippingCost ? String(data.shippingCost) : '0');
      setFreeShippingMin(data.freeShippingMin ? String(data.freeShippingMin) : '0');
      setBannerMessage(data.bannerMessage || '');
      setIsStoreOpen(data.isStoreOpen);
    }
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(
      {
        whatsappPhone,
        instagramUrl,
        shippingCost: parseFloat(shippingCost) || 0,
        freeShippingMin: parseFloat(freeShippingMin) || 0,
        bannerMessage: bannerMessage.trim() || null,
        isStoreOpen,
      },
      {
        onSuccess: () => {
          toast.success('Configuración guardada exitosamente.');
        },
        onError: (err: any) => {
          toast.error('Error al guardar la configuración: ' + err.message);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="text-xs text-forest hover:underline flex items-center gap-1 mb-2 font-medium"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Volver al panel
        </button>
        <h2 className="text-2xl font-serif font-bold text-ink">Configuración de la Tienda</h2>
        <p className="text-xs text-ink-muted">Ajustá las variables operativas, datos de contacto y envíos de la tienda.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-paper-dark/30 border border-paper-dark/60 rounded-xl p-6 space-y-8 shadow-sm">
        {/* Sección 1: Contacto y Redes */}
        <div className="space-y-4">
          <div className="border-b border-stone-300 pb-2">
            <h3 className="font-serif font-bold text-base text-ink">Contacto y Redes</h3>
            <p className="text-[11px] text-ink-muted">Configuración del número de atención al cliente y enlace social.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="whatsappPhone" className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                WhatsApp de la Tienda (con código de país)
              </label>
              <input
                id="whatsappPhone"
                name="whatsappPhone"
                type="text"
                required
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                disabled={mutation.isPending}
                className="w-full bg-paper border border-stone-300 rounded p-2 text-ink text-sm focus:ring-1 focus:ring-forest focus:outline-none font-bold"
                placeholder="Ej: 5493876235245"
              />
            </div>

            <div>
              <label htmlFor="instagramUrl" className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                Enlace a Perfil de Instagram
              </label>
              <input
                id="instagramUrl"
                name="instagramUrl"
                type="url"
                required
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                disabled={mutation.isPending}
                className="w-full bg-paper border border-stone-300 rounded p-2 text-ink text-sm focus:ring-1 focus:ring-forest focus:outline-none"
                placeholder="Ej: https://instagram.com/usuario"
              />
            </div>
          </div>
        </div>

        {/* Sección 2: Logística de Envío */}
        <div className="space-y-4">
          <div className="border-b border-stone-300 pb-2">
            <h3 className="font-serif font-bold text-base text-ink">Logística de Envío</h3>
            <p className="text-[11px] text-ink-muted">Ajustá las tarifas y umbrales mínimos para envíos bonificados.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="shippingCost" className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                Costo Base de Envío ($)
              </label>
              <input
                id="shippingCost"
                name="shippingCost"
                type="number"
                step="0.01"
                min="0"
                required
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
                disabled={mutation.isPending}
                className="w-full bg-paper border border-stone-300 rounded p-2 text-ink text-sm focus:ring-1 focus:ring-forest focus:outline-none font-bold"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="freeShippingMin" className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                Mínimo de Compra para Envío Gratis ($)
              </label>
              <input
                id="freeShippingMin"
                name="freeShippingMin"
                type="number"
                step="0.01"
                min="0"
                required
                value={freeShippingMin}
                onChange={(e) => setFreeShippingMin(e.target.value)}
                disabled={mutation.isPending}
                className="w-full bg-paper border border-stone-300 rounded p-2 text-ink text-sm focus:ring-1 focus:ring-forest focus:outline-none font-bold"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Sección 3: Operaciones de la Tienda */}
        <div className="space-y-4">
          <div className="border-b border-stone-300 pb-2">
            <h3 className="font-serif font-bold text-base text-ink">Operaciones de la Tienda</h3>
            <p className="text-[11px] text-ink-muted">Configurá el estado de la tienda y notificaciones dinámicas en tiempo real.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="bannerMessage" className="block text-xs font-semibold uppercase tracking-wider text-ink mb-1">
                Mensaje del Banner Informativo / Alerta
              </label>
              <textarea
                id="bannerMessage"
                name="bannerMessage"
                value={bannerMessage}
                onChange={(e) => setBannerMessage(e.target.value)}
                disabled={mutation.isPending}
                rows={2}
                className="w-full bg-paper border border-stone-300 rounded p-2 text-ink text-sm focus:ring-1 focus:ring-forest focus:outline-none resize-y"
                placeholder="Ingresá un mensaje para mostrar en el banner de la tienda, o dejalo vacío para ocultarlo..."
              />
            </div>

            <div className="flex items-center justify-between bg-paper border border-stone-300 rounded-lg p-4">
              <div className="space-y-1">
                <label htmlFor="isStoreOpen" className="block text-sm font-bold text-ink cursor-pointer select-none">
                  ¿La tienda se encuentra abierta?
                </label>
                <span className="block text-xs text-ink-muted leading-relaxed">
                  Desactivar esta opción impedirá que los clientes finalicen compras en el checkout.
                </span>
              </div>
              <button
                id="isStoreOpen"
                name="isStoreOpen"
                type="button"
                role="switch"
                aria-checked={isStoreOpen}
                disabled={mutation.isPending}
                onClick={() => setIsStoreOpen(!isStoreOpen)}
                className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2 ${
                  isStoreOpen ? 'bg-forest' : 'bg-stone-300'
                } ${mutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isStoreOpen ? 'translate-x-8' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            isLoading={mutation.isPending}
            disabled={mutation.isPending}
            className="w-full sm:w-auto font-serif font-bold text-sm py-2.5 px-6 shadow-sm"
          >
            Guardar cambios
          </Button>
        </div>
      </form>
    </div>
  );
}

export default StoreConfigPanel;
