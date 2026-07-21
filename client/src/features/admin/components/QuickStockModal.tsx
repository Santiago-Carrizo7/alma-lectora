import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

interface QuickStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  initialStock: number;
  onSave: (newStock: number) => Promise<void> | void;
  isPending?: boolean;
}

export function QuickStockModal({ isOpen, onClose, title, subtitle, initialStock, onSave, isPending }: QuickStockModalProps) {
  const [localStock, setLocalStock] = useState<number>(0);

  useEffect(() => {
    setLocalStock(initialStock);
  }, [initialStock, isOpen]);

  const handleDecrement = () => {
    setLocalStock((prev) => Math.max(0, prev - 1));
  };

  const handleIncrement = () => {
    setLocalStock((prev) => prev + 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 0) {
      setLocalStock(val);
    } else if (e.target.value === '') {
      setLocalStock(0);
    }
  };

  const handleSave = async () => {
    try {
      await onSave(localStock);
      onClose();
    } catch (error) {
      console.error('Error saving stock:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Actualizar Inventario Rápido">
      <div className="flex flex-col items-center justify-center space-y-6 py-4">
        <div className="text-center max-w-xs sm:max-w-md">
          <h4 className="text-lg font-bold text-ink truncate" title={title}>{title}</h4>
          {subtitle && <p className="text-xs text-ink-muted mt-1 font-mono">{subtitle}</p>}
        </div>

        {/* Tactile Adjuster Layout */}
        <div className="flex items-center justify-center space-x-8">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={localStock <= 0 || isPending}
            className="w-20 h-20 rounded-full bg-paper-dark hover:bg-stone-200 border border-stone-300 text-3xl font-bold flex items-center justify-center text-ink select-none focus:outline-none focus:ring-2 focus:ring-forest active:scale-95 transition-all duration-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Disminuir stock"
          >
            -
          </button>

          <div className="flex flex-col items-center">
            <input
              type="number"
              min="0"
              value={localStock}
              onChange={handleInputChange}
              disabled={isPending}
              className="text-5xl font-mono font-bold text-ink text-center w-28 bg-transparent border-b-2 border-stone-300 focus:border-forest focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              aria-label="Cantidad de stock"
            />
            <span className="text-xs text-ink-muted mt-2 font-medium">Unidades</span>
          </div>

          <button
            type="button"
            onClick={handleIncrement}
            disabled={isPending}
            className="w-20 h-20 rounded-full bg-paper-dark hover:bg-stone-200 border border-stone-300 text-3xl font-bold flex items-center justify-center text-ink select-none focus:outline-none focus:ring-2 focus:ring-forest active:scale-95 transition-all duration-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Incrementar stock"
          >
            +
          </button>
        </div>

        {/* Dialog Actions */}
        <div className="w-full flex gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 py-3 text-sm font-semibold rounded-lg"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            isLoading={isPending}
            className="flex-1 py-3 text-sm font-semibold rounded-lg"
          >
            Guardar Stock
          </Button>
        </div>
      </div>
    </Modal>
  );
}
