import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const isListMode = /^\/admin\/(libros|accesorios|combos|pedidos)\/?$/.test(location.pathname);
  const isHubMode = location.pathname === '/admin' || location.pathname === '/admin/';
  const isAccessoriesArea = location.pathname.includes('/accesorios');
  const isCombosArea = location.pathname.includes('/combos');
  const isPedidosArea = location.pathname.includes('/pedidos');

  let title = 'Panel de Administración';
  let subtitle = 'Módulos de gestión y mantenimiento de Alma Lectora';
  let breadcrumbText = 'Volver al Catálogo';
  let breadcrumbPath = '/';

  if (!isHubMode) {
    breadcrumbText = 'Volver al Panel Central';
    breadcrumbPath = '/admin';
  }

  if (isListMode) {
    if (isAccessoriesArea) {
      title = 'Panel de Accesorios';
      subtitle = 'Gestión de Velas, Separadores y Modelos 3D';
    } else if (isCombosArea) {
      title = 'Panel de Combos';
      subtitle = 'Gestión de Combos Promocionales y Paquetes de Regalo';
    } else if (isPedidosArea) {
      title = 'Gestión de Pedidos';
      subtitle = 'Control de confirmaciones de compras, envíos y stock';
    } else {
      title = 'Panel de Libros';
      subtitle = 'Mantenimiento de inventario, ABM y carga rápida con escáner';
    }
  } else if (location.pathname.includes('/nuevo')) {
    if (isAccessoriesArea) {
      title = 'Nuevo Accesorio';
      subtitle = 'Registrar un nuevo accesorio';
    } else if (isCombosArea) {
      title = 'Nuevo Combo';
      subtitle = 'Crear un nuevo combo promocional';
    } else {
      title = 'Nuevo Libro';
      subtitle = 'Registrar un nuevo libro en el catálogo';
    }
  } else if (location.pathname.includes('/editar')) {
    if (isAccessoriesArea) {
      title = 'Editar Accesorio';
      subtitle = 'Modificar información y stock del accesorio';
    } else if (isCombosArea) {
      title = 'Editar Combo';
      subtitle = 'Modificar información y productos del combo';
    } else {
      title = 'Editar Libro';
      subtitle = 'Modificar información y stock del libro';
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-8 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-paper-dark/60 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to={breadcrumbPath} className="text-xs text-forest hover:underline flex items-center gap-1 font-semibold">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              {breadcrumbText}
            </Link>
          </div>
          <h1 className="text-3xl font-bold font-serif text-ink">{title}</h1>
          <p className="text-xs text-ink-muted">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {(location.pathname === '/admin/libros' || location.pathname === '/admin/libros/') && (
            <Button
              variant="primary"
              onClick={() => navigate('/admin/nuevo')}
              className="text-xs font-serif font-bold py-2 px-4 shadow-sm"
            >
              + Nuevo Libro
            </Button>
          )}
          {(location.pathname === '/admin/accesorios' || location.pathname === '/admin/accesorios/') && (
            <Button
              variant="primary"
              onClick={() => navigate('/admin/accesorios/nuevo')}
              className="text-xs font-serif font-bold py-2 px-4 shadow-sm"
            >
              + Nuevo Accesorio
            </Button>
          )}
          {(location.pathname === '/admin/combos' || location.pathname === '/admin/combos/') && (
            <Button
              variant="primary"
              onClick={() => navigate('/admin/combos/nuevo')}
              className="text-xs font-serif font-bold py-2 px-4 shadow-sm"
            >
              + Nuevo Combo
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Rendered by Nested Routes */}
      <div>
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;
