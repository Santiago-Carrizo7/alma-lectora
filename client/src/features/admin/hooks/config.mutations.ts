import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../services/api-client';
import type { StoreConfig, UpdateConfigPayload } from '../../../types/api';
import { storeConfigKeys } from './config.queries';

export function useUpdateStoreConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateConfigPayload) =>
      apiClient.patch<StoreConfig>('/config', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storeConfigKeys.all });
    },
  });
}
