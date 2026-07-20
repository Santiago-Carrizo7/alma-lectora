import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCart } from '../../hooks/useCart';
import { apiClient } from '../../services/api-client';

interface UserProfile {
  id: string;
  email: string;
  rol: string;
}

export function Header() {
  const { totalItems, openCart } = useCart();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: user } = useQuery<UserProfile>({
    queryKey: ['auth-user'],
    queryFn: () => apiClient.get<UserProfile>('/auth/me'),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiClient.post('/auth/logout', {}),
    onSuccess: () => {
      queryClient.setQueryData(['auth-user'], null);
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
      navigate('/login');
    },
    onError: (err: any) => {
      alert('Error al cerrar sesión: ' + err.message);
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur-md border-b border-paper-dark/60 py-4 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="group flex items-center gap-2">
          <svg className="w-6 h-6 text-forest group-hover:scale-105 transition-transform duration-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="text-xl font-bold font-serif text-ink tracking-tight">
            Alma Lectora
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden sm:flex items-center gap-6 text-sm font-bold text-ink-muted">
          <Link to="/libros" className="hover:text-forest transition-colors uppercase tracking-wider text-xs">Libros</Link>
          <Link to="/accesorios" className="hover:text-forest transition-colors uppercase tracking-wider text-xs">Accesorios</Link>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          {user && user.rol === 'ADMIN' ? (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-forest/30 text-forest hover:bg-forest/10 transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-forest" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
              Panel Admin
            </Link>
          ) : (
            <Link
              to="/login"
              className="p-2 rounded-full hover:bg-paper-dark/70 text-ink hover:text-forest transition-all duration-300 focus:outline-none"
              aria-label="Perfil de Administrador"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
            </Link>
          )}

          {user && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              disabled={logoutMutation.isPending}
            >
              Cerrar Sesión
            </button>
          )}

          {/* Cart Icon trigger */}
          <button
            onClick={openCart}
            className="relative p-2 rounded-full hover:bg-paper-dark/70 text-ink hover:text-forest transition-all duration-300 focus:outline-none"
            aria-label="Ver Carrito"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber text-stone-100 text-[10px] font-extrabold h-4 w-4 rounded-full flex items-center justify-center animate-pulse">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
