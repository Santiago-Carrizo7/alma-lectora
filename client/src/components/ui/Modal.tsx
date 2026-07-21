import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }: ModalProps) {
  // Handle escape key & lock background scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog Box */}
      <div
        className={`relative w-full ${maxWidth} bg-paper border border-paper-dark rounded-2xl shadow-2xl overflow-hidden animate-fade-in flex flex-col z-10 max-h-[85dvh] sm:max-h-[90vh] my-auto`}
      >
        {/* Sticky Header - Close button and title always accessible */}
        <div className="sticky top-0 z-20 bg-paper/95 backdrop-blur-md px-4 sm:px-6 py-3.5 sm:py-4 border-b border-paper-dark flex items-center justify-between shrink-0">
          <h3 className="text-lg sm:text-xl font-bold font-serif text-ink leading-tight truncate pr-2">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full text-ink-muted hover:text-ink hover:bg-paper-dark p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-forest/30 active:scale-95 shrink-0 cursor-pointer"
            aria-label="Cerrar modal"
          >
            <svg
              className="h-5 w-5 sm:h-6 sm:w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
