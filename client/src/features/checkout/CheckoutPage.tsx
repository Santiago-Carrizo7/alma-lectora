import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { StepIndicator } from '../../components/ui/StepIndicator';
import { StepShipping } from './StepShipping';
import { StepCustomer } from './StepCustomer';
import { StepSummary } from './StepSummary';
import { useCreateOrderLead } from './checkout.mutations';
import { buildWhatsAppUrl } from '../../services/whatsapp';
import { useStoreConfig } from '../admin/hooks/config.queries';
import type { ShippingFormData, CustomerFormData, CreateOrderLeadPayload } from '../../types/api';

type CheckoutStep = 0 | 1 | 2;

export function CheckoutPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const createOrderMutation = useCreateOrderLead();
  const { data: storeConfig } = useStoreConfig();

  const [step, setStep] = useState<CheckoutStep>(0);
  const [shipping, setShipping] = useState<ShippingFormData | null>(null);
  const [customer, setCustomer] = useState<CustomerFormData | null>(null);
  const [showRetryBanner, setShowRetryBanner] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');

  // Redirect if cart is empty and we are not in success redirect state
  useEffect(() => {
    if (cart.items.length === 0 && step !== 2 && !showRetryBanner) {
      navigate('/');
    }
  }, [cart.items.length, step, navigate, showRetryBanner]);

  const handleShippingNext = (data: ShippingFormData) => {
    setShipping(data);
    setStep(1);
  };

  const handleCustomerNext = (data: CustomerFormData) => {
    setCustomer(data);
    setStep(2);
  };

  const handleConfirmOrder = async () => {
    if (!shipping || !customer) return;

    const payload: CreateOrderLeadPayload = {
      customerName: customer.customerName,
      customerPhone: customer.customerPhone,
      customerEmail: customer.customerEmail,
      customerDni: customer.customerDni,
      postalCode: shipping.postalCode,
      address: shipping.address,
      items: cart.items.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
      totalAmount: cart.totalAmount,
    };

    try {
      // Fire-and-forget DB registration:
      // Try to save to DB, if it fails warn but still redirect to WhatsApp
      await createOrderMutation.mutateAsync(payload);
    } catch (err) {
      console.warn('[OrderLead] Error registering order lead in DB, proceeding with WhatsApp redirect.', err);
    }

    // Build URL & redirect
    const url = buildWhatsAppUrl(
      { ...shipping, ...customer },
      cart.items,
      cart.totalAmount,
      storeConfig?.whatsappPhone ?? '5493876235245'
    );

    setWhatsappUrl(url);

    // Redirect to WhatsApp
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');

    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      // Popup blocked
      setShowRetryBanner(true);
    } else {
      // Clear cart locally and return to catalog
      cart.clearCart();
      navigate('/');
    }
  };

  const handleRetryRedirect = () => {
    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      cart.clearCart();
      setShowRetryBanner(false);
      navigate('/');
    }
  };

  const stepsLabels = ['Envío', 'Datos Personales', 'Confirmación'];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {showRetryBanner && (
        <div className="fixed top-4 left-4 right-4 z-50 bg-amber border border-amber/30 text-stone-100 p-4 rounded-xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 shrink-0 text-stone-100" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <div className="text-xs sm:text-sm font-semibold leading-snug">
              ¡Ups! Tu navegador bloqueó la ventana de WhatsApp. Hacé click al lado para enviar tu pedido directamente.
            </div>
          </div>
          <button
            onClick={handleRetryRedirect}
            className="w-full sm:w-auto bg-stone-100 hover:bg-stone-200 text-amber font-extrabold px-4 py-2 rounded-lg text-xs tracking-wider uppercase transition-colors shrink-0 cursor-pointer"
          >
            Enviar Pedido
          </button>
        </div>
      )}

      <div className="bg-paper-dark/10 border border-paper-dark/50 rounded-xl p-6 sm:p-8 shadow-sm">
        {/* Progress Header */}
        <StepIndicator steps={stepsLabels} currentStep={step} />

        {/* Form Stepper */}
        <div className="mt-8">
          {step === 0 && (
            <StepShipping
              initialData={shipping}
              onNext={handleShippingNext}
              onCancel={() => navigate('/')}
            />
          )}

          {step === 1 && (
            <StepCustomer
              initialData={customer}
              onNext={handleCustomerNext}
              onBack={() => setStep(0)}
            />
          )}

          {step === 2 && shipping && customer && (
            <StepSummary
              shipping={shipping}
              customer={customer}
              onBack={() => setStep(1)}
              onConfirm={handleConfirmOrder}
              isSubmitting={createOrderMutation.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}
export default CheckoutPage;
