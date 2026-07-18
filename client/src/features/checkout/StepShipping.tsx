import React, { useState } from 'react';
import type { ShippingFormData } from '../../types/api';
import { Button } from '../../components/ui/Button';

interface StepShippingProps {
  initialData: ShippingFormData | null;
  onNext: (data: ShippingFormData) => void;
  onCancel: () => void;
}

export function StepShipping({ initialData, onNext, onCancel }: StepShippingProps) {
  const [postalCode, setPostalCode] = useState(initialData?.postalCode ?? '');
  const [address, setAddress] = useState(initialData?.address ?? '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postalCode.trim() || !address.trim()) {
      setError('Por favor completá todos los campos de envío requeridos.');
      return;
    }
    setError('');
    onNext({ postalCode, address });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-bold font-serif text-ink mb-1">Información de Envío</h3>
        <p className="text-xs text-stone-500">
          Ingresá tu código postal y dirección completa para que podamos calcular el envío.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Código Postal */}
        <div>
          <label htmlFor="postalCode" className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
            Código Postal *
          </label>
          <input
            type="text"
            id="postalCode"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="Ej: 4400"
            className="block w-full border border-stone-300 rounded-md bg-paper px-3.5 py-2.5 text-sm text-ink placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-forest/25 focus:border-forest transition-colors duration-200"
            required
          />
        </div>

        {/* Dirección Completa */}
        <div>
          <label htmlFor="address" className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
            Dirección Completa (Calle, Altura, Piso/Depto) *
          </label>
          <input
            type="text"
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ej: Av. Belgrano 1234, 4to B"
            className="block w-full border border-stone-300 rounded-md bg-paper px-3.5 py-2.5 text-sm text-ink placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-forest/25 focus:border-forest transition-colors duration-200"
            required
          />
        </div>
      </div>

      <div className="pt-4 border-t border-paper-dark flex justify-between gap-4">
        <Button type="button" variant="ghost" onClick={onCancel} className="text-sm font-semibold">
          Cancelar
        </Button>
        <Button type="submit" className="text-sm font-semibold">
          Siguiente paso
        </Button>
      </div>
    </form>
  );
}
