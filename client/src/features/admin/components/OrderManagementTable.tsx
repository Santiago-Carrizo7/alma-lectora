import { useState } from 'react';
import { useAdminOrders } from '../hooks/orders.queries';
import { useUpdateOrderStatus } from '../hooks/orders.mutations';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { formatPrice } from '../../../services/price';
import { BookThumbnail } from '../../../components/ui/BookThumbnail';
import { useToast } from '../../../components/ui/Toast';
import type { OrderLead, OrderStatus } from '../../../types/api';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';

interface OrderConfirmState {
  orderId: string;
  customerName: string;
  status: 'CONFIRMED' | 'CANCELLED';
}

export function OrderManagementTable() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<OrderStatus>('PENDING_WHATSAPP');
  const [page, setPage] = useState(1);
  const limit = 10;
  const [confirmState, setConfirmState] = useState<OrderConfirmState | null>(null);

  const { data, isLoading, error } = useAdminOrders({
    status: activeTab,
    page,
    limit,
  });

  const updateStatusMutation = useUpdateOrderStatus();

  const orders = data?.data || [];
  const total = data?.meta?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleTabChange = (tab: OrderStatus) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleStatusUpdate = (order: OrderLead, status: 'CONFIRMED' | 'CANCELLED') => {
    setConfirmState({
      orderId: order.id,
      customerName: order.customerName,
      status,
    });
  };

  const handleConfirmAction = () => {
    if (!confirmState) return;
    const { orderId, status } = confirmState;
    const actionText = status === 'CONFIRMED' ? 'confirmar' : 'cancelar';

    updateStatusMutation.mutate(
      { id: orderId, status },
      {
        onSuccess: () => {
          toast.success(`Pedido ${status === 'CONFIRMED' ? 'confirmado' : 'cancelado'} correctamente.`);
          setConfirmState(null);
        },
        onError: (err: any) => {
          toast.error(`Error al ${actionText} el pedido: ${err.message}`);
          setConfirmState(null);
        },
      }
    );
  };

  const getWhatsAppUrl = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    const withCountryCode = cleaned.startsWith('54')
      ? cleaned
      : cleaned.length === 10
      ? `549${cleaned}`
      : cleaned;
    return `https://wa.me/${withCountryCode}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg">
        Error al cargar los pedidos: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pestañas de Filtro */}
      <div className="flex border-b border-paper-dark pb-1 gap-2">
        <button
          type="button"
          onClick={() => handleTabChange('PENDING_WHATSAPP')}
          className={`px-4 py-1.5 text-xs font-semibold tracking-wide border-b-2 transition-all duration-200 cursor-pointer ${
            activeTab === 'PENDING_WHATSAPP'
              ? 'border-forest text-forest'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Pendientes ({activeTab === 'PENDING_WHATSAPP' ? total : '...'})
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('CONFIRMED')}
          className={`px-4 py-1.5 text-xs font-semibold tracking-wide border-b-2 transition-all duration-200 cursor-pointer ${
            activeTab === 'CONFIRMED'
              ? 'border-forest text-forest'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Confirmados ({activeTab === 'CONFIRMED' ? total : '...'})
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('CANCELLED')}
          className={`px-4 py-1.5 text-xs font-semibold tracking-wide border-b-2 transition-all duration-200 cursor-pointer ${
            activeTab === 'CANCELLED'
              ? 'border-forest text-forest'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Cancelados ({activeTab === 'CANCELLED' ? total : '...'})
        </button>
      </div>

      <div className="text-xs text-ink-muted px-1">
        Total de pedidos en esta sección: {total}
      </div>

      {/* Grid de Tarjetas (Enfoque Mobile-First) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {orders.length === 0 ? (
          <div className="col-span-full bg-paper-dark/20 border border-paper-dark border-dashed rounded-2xl p-12 text-center text-ink-muted italic">
            No hay pedidos en esta sección.
          </div>
        ) : (
          orders.map((order: OrderLead) => {
            const formattedDate = new Date(order.createdAt).toLocaleString('es-AR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            const isCurrentPending = activeTab === 'PENDING_WHATSAPP';
            const isProcessingThis =
              updateStatusMutation.isPending &&
              updateStatusMutation.variables?.id === order.id;

            return (
              <div
                key={order.id}
                className="flex flex-col bg-paper-dark/40 border border-paper-dark/80 rounded-2xl p-5 shadow-xs space-y-4 hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Cabecera de la Tarjeta */}
                <div className="flex justify-between items-start border-b border-paper-dark pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-ink-muted bg-paper-dark px-2 py-0.5 rounded-full uppercase">
                      ID: #{order.id.substring(0, 8)}
                    </span>
                    <div className="text-[10px] text-ink-muted mt-1 font-medium font-sans">
                      {formattedDate}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      order.status === 'PENDING_WHATSAPP'
                        ? 'bg-amber/10 text-amber border-amber/20'
                        : order.status === 'CONFIRMED'
                        ? 'bg-forest/10 text-forest border-forest/20'
                        : 'bg-red-50 text-red-700 border-red-100'
                    }`}
                  >
                    {order.status === 'PENDING_WHATSAPP'
                      ? 'PENDIENTE WA'
                      : order.status === 'CONFIRMED'
                      ? 'CONFIRMADO'
                      : 'CANCELADO'}
                  </span>
                </div>

                {/* Datos del Cliente */}
                <div className="space-y-1.5 text-xs">
                  <div className="font-serif text-sm font-bold text-ink">
                    {order.customerName}
                  </div>
                  <div className="text-ink-muted flex flex-wrap gap-x-3 gap-y-1">
                    <span>
                      <strong className="text-ink">DNI:</strong> {order.customerDni}
                    </span>
                    <span>
                      <strong className="text-ink">Email:</strong> {order.customerEmail}
                    </span>
                  </div>
                  {order.address && (
                    <div className="text-ink-muted">
                      <strong className="text-ink">Dirección:</strong> {order.address}
                      {order.postalCode && ` (CP: ${order.postalCode})`}
                    </div>
                  )}

                  {/* Botón WhatsApp */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        window.open(getWhatsAppUrl(order.customerPhone), '_blank')
                      }
                      className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.62.962 3.21 1.454 4.887 1.455 5.483 0 9.943-4.453 9.946-9.93.002-2.653-1.03-5.148-2.906-7.027-1.875-1.878-4.37-2.914-7.022-2.915-5.485 0-9.946 4.454-9.95 9.932-.001 1.839.492 3.633 1.427 5.22l-.993 3.626 3.71-.973zm13.125-9.664c-.3-.15-1.776-.875-2.05-.975-.274-.1-.475-.15-.676.15-.2.3-.775.975-.95 1.175-.175.2-.35.225-.65.075-.3-.15-1.265-.467-2.41-1.485-.89-.795-1.49-1.77-1.665-2.07-.175-.3-.02-.46.13-.61.135-.133.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.676-1.625-.926-2.225-.244-.589-.49-.51-.676-.52-.175-.01-.375-.01-.575-.01-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.11 3.224 5.112 4.525.715.31 1.273.495 1.71.635.717.227 1.37.195 1.885.118.574-.085 1.776-.725 2.025-1.425.25-.7.25-1.3 0-1.425-.075-.125-.275-.2-.575-.35z" />
                      </svg>
                      Chatear (+{order.customerPhone})
                    </button>
                  </div>
                </div>

                {/* Desglose de Productos */}
                <div className="space-y-3 pt-2">
                  <div className="text-[11px] font-bold text-ink uppercase tracking-wider">
                    Productos Solicitados
                  </div>
                  <div className="divide-y divide-paper-dark/60 max-h-48 overflow-y-auto pr-1">
                    {order.items.map((item, idx) => {
                      const itemSubtotal =
                        parseFloat(item.unitPrice) * item.quantity;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-2 gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <BookThumbnail
                              src={item.coverUrl || null}
                              title={item.title}
                              className="w-8 h-11 object-cover rounded shadow-xs shrink-0 bg-paper-dark/30 border border-stone-200"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-ink truncate max-w-[200px]">
                                {item.title}
                              </div>
                              <div className="text-[10px] text-ink-muted mt-0.5">
                                Tipo: {item.type} | Cantidad: {item.quantity}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-mono font-bold text-amber">
                              {formatPrice(itemSubtotal)}
                            </div>
                            <div className="text-[9px] text-ink-muted">
                              {formatPrice(item.unitPrice)} c/u
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pie de la Tarjeta con Total y Acciones */}
                <div className="border-t border-paper-dark pt-3 flex flex-col space-y-3 mt-auto">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-ink-muted font-semibold">
                      Monto Total:
                    </span>
                    <span className="text-base font-serif font-extrabold text-amber">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>

                  {isCurrentPending && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={isProcessingThis || updateStatusMutation.isPending}
                        isLoading={
                          isProcessingThis &&
                          updateStatusMutation.variables?.status === 'CANCELLED'
                        }
                        onClick={() => handleStatusUpdate(order, 'CANCELLED')}
                        className="py-2.5 text-xs font-bold font-serif shadow-xs cursor-pointer border border-transparent"
                      >
                        Rechazar
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={isProcessingThis || updateStatusMutation.isPending}
                        isLoading={
                          isProcessingThis &&
                          updateStatusMutation.variables?.status === 'CONFIRMED'
                        }
                        onClick={() => handleStatusUpdate(order, 'CONFIRMED')}
                        className="py-2.5 text-xs font-bold font-serif shadow-xs bg-forest hover:bg-forest-light text-white cursor-pointer border border-transparent"
                      >
                        Aceptar y Descontar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Controladores de Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <Button
            variant="ghost"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="text-xs px-3 border border-stone-300"
          >
            Anterior
          </Button>
          <span className="text-xs text-ink-muted">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="ghost"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="text-xs px-3 border border-stone-300"
          >
            Siguiente
          </Button>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmState}
        onClose={() => setConfirmState(null)}
        onConfirm={handleConfirmAction}
        isLoading={updateStatusMutation.isPending}
        variant={confirmState?.status === 'CANCELLED' ? 'danger' : 'forest'}
        title={
          confirmState?.status === 'CONFIRMED'
            ? '¿Confirmar pedido?'
            : '¿Rechazar pedido?'
        }
        description={
          confirmState?.status === 'CONFIRMED' ? (
            <>
              Estás por confirmar el pedido de <strong className="text-ink font-bold font-sans">{confirmState.customerName}</strong>. Se descontará automáticamente el stock correspondiente.
            </>
          ) : (
            <>
              Estás por rechazar el pedido de <strong className="text-ink font-bold font-sans">{confirmState?.customerName}</strong>. Se liberará el producto sin modificar el stock.
            </>
          )
        }
        confirmText={
          confirmState?.status === 'CONFIRMED'
            ? 'Sí, confirmar'
            : 'Sí, rechazar'
        }
      />
    </div>
  );
}
