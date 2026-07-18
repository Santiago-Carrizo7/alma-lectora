import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import type { OrderStatus } from '../../types/api';
import { adminOrdersKeys } from './orders.queries';
import { booksKeys, accessoriesKeys, combosKeys } from '../catalog/catalog.queries';
import { adminBooksKeys } from './admin.queries';
import { adminAccessoriesKeys } from './accessories.queries';
import { adminCombosKeys } from './combos.queries';

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      apiClient.patch<{ id: string; status: OrderStatus }>(`/orders/admin/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminOrdersKeys.all });
      queryClient.invalidateQueries({ queryKey: booksKeys.all });
      queryClient.invalidateQueries({ queryKey: adminBooksKeys.all });
      queryClient.invalidateQueries({ queryKey: accessoriesKeys.all });
      queryClient.invalidateQueries({ queryKey: adminAccessoriesKeys.all });
      queryClient.invalidateQueries({ queryKey: combosKeys.all });
      queryClient.invalidateQueries({ queryKey: adminCombosKeys.all });
    },
  });
}
