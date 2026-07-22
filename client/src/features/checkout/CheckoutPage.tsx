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

  // Redirect if cart is empty and we are not in step 2
  useEffect(() => {
    if (cart.items.length === 0 && step !== 2) {
      navigate('/');
    }
  }, [cart.items.length, step, navigate]);

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

    // Vaciar el carrito de forma incondicional tras confirmar el pedido
    cart.clearCart();

    // Redirigir directamente a WhatsApp
    window.location.href = url;
  };

  const stepsLabels = ['Envío', 'Datos Personales', 'Confirmación'];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">

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
