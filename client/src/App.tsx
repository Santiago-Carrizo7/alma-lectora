import { Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { PageShell } from './components/layout/PageShell';
import { CartDrawer } from './features/cart/CartDrawer';
import { HomePage } from './features/catalog/pages/HomePage';
import { BooksPage } from './features/catalog/pages/BooksPage';
import { AccessoriesPage } from './features/catalog/pages/AccessoriesPage';
import { CheckoutPage } from './features/checkout/CheckoutPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminLayout } from './features/admin/pages/AdminLayout';
import { AdminHub } from './features/admin/pages/AdminHub';
import { BookManagementTable } from './features/admin/components/BookManagementTable';
import { BookFormPanel } from './features/admin/components/BookFormPanel';
import { AccessoryManagementTable } from './features/admin/components/AccessoryManagementTable';
import { AccessoryFormPanel } from './features/admin/components/AccessoryFormPanel';
import { ComboManagementTable } from './features/admin/components/ComboManagementTable';
import { ComboFormPanel } from './features/admin/components/ComboFormPanel';
import { LoginPage } from './features/auth/pages/LoginPage';
import { InstagramFAB } from './components/ui/InstagramFAB';
import { StoreConfigPanel } from './features/admin/components/StoreConfigPanel';
import { ToastProvider } from './components/ui/Toast';
import { OrderManagementTable } from './features/admin/components/OrderManagementTable';

export default function App() {
  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-forest/10 selection:text-forest">
      <Header />
      <CartDrawer />
      <PageShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/libros" element={<BooksPage />} />
          <Route path="/accesorios" element={<AccessoriesPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Rutas administrativas protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminHub />} />
              <Route path="libros" element={<BookManagementTable />} />
              <Route path="nuevo" element={<BookFormPanel mode="create" />} />
              <Route path="editar/:id" element={<BookFormPanel mode="edit" />} />
              <Route path="accesorios" element={<AccessoryManagementTable />} />
              <Route path="accesorios/nuevo" element={<AccessoryFormPanel mode="create" />} />
              <Route path="accesorios/editar/:id" element={<AccessoryFormPanel mode="edit" />} />
              <Route path="combos" element={<ComboManagementTable />} />
              <Route path="combos/nuevo" element={<ComboFormPanel mode="create" />} />
              <Route path="combos/editar/:id" element={<ComboFormPanel mode="edit" />} />
              <Route path="configuracion" element={<StoreConfigPanel />} />
              <Route path="pedidos" element={<OrderManagementTable />} />
            </Route>
          </Route>
        </Routes>
      </PageShell>
      <InstagramFAB />
    </div>
    </ToastProvider>
  );
}
