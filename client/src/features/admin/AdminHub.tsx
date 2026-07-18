import { Link } from 'react-router-dom';

export function AdminHub() {
  const modules = [
    {
      title: 'Gestión de Libros',
      description: 'Control de inventario, ABM y alta de libros mediante buscador ISBN o manual.',
      path: '/admin/libros',
      icon: (
        <svg className="w-10 h-10 text-forest" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
        </svg>
      ),
    },
    {
      title: 'Accesorios',
      description: 'Mantenimiento de catálogo de velas aromáticas, señaladores y complementos.',
      path: '/admin/accesorios',
      icon: (
        <svg className="w-10 h-10 text-forest" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.467 5.99 5.99 0 0 0-1.925 3.546 5.974 5.974 0 0 1-2.133-1A3.75 3.75 0 0 0 12 18Z" />
        </svg>
      ),
    },
    {
      title: 'Combos Promocionales',
      description: 'Creación y edición de paquetes de libros con accesorios y descuentos.',
      path: '/admin/combos',
      icon: (
        <svg className="w-10 h-10 text-forest" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0-2.625V7.5m0 0h-3.75M12 7.5h3.75M3.75 7.5h16.5a1.5 1.5 0 0 1 1.5 1.5v1.5a1.5 1.5 0 0 1-1.5 1.5H3.75A1.5 1.5 0 0 1 2.25 10.5V9a1.5 1.5 0 0 1 1.5-1.5Z" />
        </svg>
      ),
    },
    {
      title: 'Gestión de Pedidos',
      description: 'Control de confirmaciones de compras, chat directo con clientes y descuento de stock.',
      path: '/admin/pedidos',
      icon: (
        <svg className="w-10 h-10 text-forest" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.75A1.125 1.125 0 0 1 2.625 17.625V4.625A1.125 1.125 0 0 1 3.75 3.5h1.625c.621 0 1.125.504 1.125 1.125v9.75c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.75M16.5 9.75V3.5m0 0h1.625a1.125 1.125 0 0 1 1.125 1.125v4.375c0 .621-.504 1.125-1.125 1.125H16.5M16.5 3.5v6.25" />
        </svg>
      ),
    },
    {
      title: 'Configuración',
      description: 'Ajustes generales de la tienda, costos de envío y variables del sistema.',
      path: '/admin/configuracion',
      icon: (
        <svg className="w-10 h-10 text-forest" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-paper-dark/30 rounded-2xl p-6 border border-paper-dark/60 text-ink">
        <h2 className="text-xl font-bold font-serif mb-2 text-ink">Panel de Control General</h2>
        <p className="text-sm text-ink-muted leading-relaxed">
          Bienvenido al centro de administración de Alma Lectora. Desde aquí puedes gestionar los diferentes módulos de la tienda. Selecciona una opción para comenzar.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {modules.map((mod) => (
          <Link
            key={mod.title}
            to={mod.path}
            className="flex items-start gap-4 p-6 bg-paper-dark/40 border border-paper-dark/60 hover:border-forest/30 rounded-xl shadow-xs hover:shadow-md hover:scale-[1.01] transition-all duration-200 group cursor-pointer"
          >
            <div className="p-3 bg-paper rounded-lg group-hover:bg-forest/5 transition-colors shrink-0 border border-paper-dark">
              {mod.icon}
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold font-serif text-ink group-hover:text-forest transition-colors">
                {mod.title}
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                {mod.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default AdminHub;
