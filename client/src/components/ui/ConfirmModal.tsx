import React, { useEffect } from 'react';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'forest';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'primary',
  isLoading = false,
}: ConfirmModalProps) {
  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const getConfirmButtonVariantClass = () => {
    if (variant === 'danger') {
      return 'bg-red-700 hover:bg-red-800 text-white font-bold shadow-sm';
    }
    return 'bg-forest hover:bg-forest-light text-stone-100 font-bold shadow-sm';
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div className="bg-paper border border-stone-300 rounded-2xl p-6 sm:p-7 max-w-sm sm:max-w-md w-full shadow-2xl text-center space-y-4 animate-fade-in">
        {/* Header Icon / Badge */}
        <div className="mx-auto w-12 h-12 rounded-full bg-paper-dark border border-stone-300 flex items-center justify-center shadow-inner">
          {variant === 'danger' ? (
            <svg className="w-6 h-6 text-red-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-forest" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          )}
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h3 className="font-serif font-bold text-lg text-ink leading-snug">
            {title}
          </h3>
          <div className="text-xs sm:text-sm text-ink-muted leading-relaxed">
            {description}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 bg-paper-dark hover:bg-stone-300 border border-stone-300 rounded-xl text-xs font-semibold text-ink transition-colors cursor-pointer"
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={isLoading}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-serif transition-colors cursor-pointer ${getConfirmButtonVariantClass()}`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
