

interface BadgeProps {
  variant?: 'agotado' | 'oferta' | 'custom' | 'warning' | 'danger';
  label: string;
  className?: string;
}

export function Badge({ variant = 'custom', label, className = '' }: BadgeProps) {
  const baseStyle = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase shadow-sm';
  
  const variants = {
    agotado: 'bg-stone-600 text-stone-100 border border-stone-500',
    oferta: 'bg-amber-700 text-amber-50 border border-amber-600',
    custom: 'bg-forest text-stone-100 border border-forest-light',
    warning: 'bg-amber-600 text-stone-50 border border-amber-500',
    danger: 'bg-red-700 text-stone-100 border border-red-600',
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${className}`}>
      {label}
    </span>
  );
}
