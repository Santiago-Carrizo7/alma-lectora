import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStoreConfig } from '../../features/admin/hooks/config.queries';

const FALLBACK_IG = 'https://www.instagram.com/alma.lectora.al/?hl=es-la';

export function InstagramFAB() {
  const location = useLocation();
  const { data } = useStoreConfig();
  const href = data?.instagramUrl ?? FALLBACK_IG;

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Monitor DOM body style attribute for modal/drawer overflow lock
  useEffect(() => {
    const checkModalOpen = () => {
      setIsModalOpen(document.body.style.overflow === 'hidden');
    };

    checkModalOpen();

    const observer = new MutationObserver(checkModalOpen);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style'],
    });

    return () => observer.disconnect();
  }, []);

  // Hide condition A: Admin Panel
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  // Hide condition B: Modal or Drawer active
  if (isModalOpen) {
    return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-40 hidden sm:flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 text-white shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
      aria-label="Seguinos en Instagram"
    >
      <svg
        className="h-7 w-7"
        fill="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    </a>
  );
}
