import React, { useState } from 'react';
import type { CustomerFormData } from '../../types/api';
import { Button } from '../../components/ui/Button';

interface StepCustomerProps {
  initialData: CustomerFormData | null;
  onNext: (data: CustomerFormData) => void;
  onBack: () => void;
}

export function StepCustomer({ initialData, onNext, onBack }: StepCustomerProps) {
  const [customerName, setCustomerName] = useState(initialData?.customerName ?? '');
  const [customerEmail, setCustomerEmail] = useState(initialData?.customerEmail ?? '');
  const [customerDni, setCustomerDni] = useState(initialData?.customerDni ?? '');
  const [customerPhone, setCustomerPhone] = useState(initialData?.customerPhone ?? '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerEmail.trim() || !customerDni.trim() || !customerPhone.trim()) {
      setError('Por favor completá todos los campos personales.');
      return;
    }
    // Simple email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      setError('Por favor ingresá un formato de email válido.');
      return;
    }
    setError('');
    onNext({ customerName, customerEmail, customerDni, customerPhone });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-bold font-serif text-ink mb-1">Datos Personales</h3>
        <p className="text-xs text-stone-500">
          Completá tus datos de contacto y facturación.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Nombre completo */}
        <div>
          <label htmlFor="customerName" className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
            Nombre Completo *
          </label>
          <input
            type="text"
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Ej: Juan Pérez"
            className="block w-full border border-stone-300 rounded-md bg-paper px-3.5 py-2.5 text-sm text-ink placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-forest/25 focus:border-forest transition-colors duration-200"
            required
          />
        </div>

        {/* DNI/CUIT */}
        <div>
          <label htmlFor="customerDni" className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
            DNI o CUIT *
          </label>
          <input
            type="text"
            id="customerDni"
            value={customerDni}
            onChange={(e) => setCustomerDni(e.target.value)}
            placeholder="Ej: 20-12345678-9 o 30123456"
            className="block w-full border border-stone-300 rounded-md bg-paper px-3.5 py-2.5 text-sm text-ink placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-forest/25 focus:border-forest transition-colors duration-200"
            required
          />
        </div>

        {/* Teléfono */}
        <div>
          <label htmlFor="customerPhone" className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
            Teléfono de Contacto *
          </label>
          <input
            type="tel"
            id="customerPhone"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Ej: +54 9 387 1234567"
            className="block w-full border border-stone-300 rounded-md bg-paper px-3.5 py-2.5 text-sm text-ink placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-forest/25 focus:border-forest transition-colors duration-200"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="customerEmail" className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
            Correo Electrónico *
          </label>
          <input
            type="email"
            id="customerEmail"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="Ej: juan.perez@email.com"
            className="block w-full border border-stone-300 rounded-md bg-paper px-3.5 py-2.5 text-sm text-ink placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-forest/25 focus:border-forest transition-colors duration-200"
            required
          />
        </div>
      </div>

      <div className="pt-4 border-t border-paper-dark flex justify-between gap-4">
        <Button type="button" variant="ghost" onClick={onBack} className="text-sm font-semibold">
          Atrás
        </Button>
        <Button type="submit" className="text-sm font-semibold">
          Siguiente paso
        </Button>
      </div>
    </form>
  );
}
