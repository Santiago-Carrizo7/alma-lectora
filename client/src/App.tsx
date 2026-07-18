import { Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { PageShell } from './components/layout/PageShell';
import { CartDrawer } from './features/cart/CartDrawer';
import { HomePage } from './pages/HomePage';
import { BooksPage } from './pages/BooksPage';
import { AccessoriesPage } from './pages/AccessoriesPage';
import Checkout from './pages/CheckoutPage';
import { ProtectedRoute } from './components/router/ProtectedRoute';
import { AdminLayout } from './features/admin/AdminLayout';
import { AdminHub } from './features/admin/AdminHub';
import { BookManagementTable } from './features/admin/BookManagementTable';
import { BookFormPanel } from './features/admin/BookFormPanel';
import { AccessoryManagementTable } from './features/admin/AccessoryManagementTable';
import { AccessoryFormPanel } from './features/admin/AccessoryFormPanel';
import { ComboManagementTable } from './features/admin/ComboManagementTable';
import { ComboFormPanel } from './features/admin/ComboFormPanel';
import { LoginPage } from './pages/LoginPage';
import { InstagramFAB } from './components/ui/InstagramFAB';
import { StoreConfigPanel } from './features/admin/StoreConfigPanel';
import { ToastProvider } from './components/ui/Toast';
import { OrderManagementTable } from './features/admin/OrderManagementTable';

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
          <Route path="/checkout" element={<Checkout />} />
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
