import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../services/api-client';
import type { OrderLead, OrderStatus } from '../../../types/api';

interface UseAdminOrdersParams {
  status?: OrderStatus;
  page?: number;
  limit?: number;
}

export const adminOrdersKeys = {
  all: ['admin-orders'] as const,
  lists: () => ['admin-orders', 'list'] as const,
  list: (params: UseAdminOrdersParams) => ['admin-orders', 'list', params] as const,
};

export function useAdminOrders(params: UseAdminOrdersParams = {}) {
  const { status, page = 1, limit = 24 } = params;

  const qs = new URLSearchParams();
  if (status) qs.append('status', status);
  qs.append('page', String(page));
  qs.append('limit', String(limit));

  return useQuery({
    queryKey: adminOrdersKeys.list(params),
    queryFn: () =>
      apiClient.get<{ data: OrderLead[]; meta: { total: number; page: number; limit: number } }>(
        `/orders/admin?${qs.toString()}`
      ),
    staleTime: 0,
  });
}
