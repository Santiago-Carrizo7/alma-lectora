import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../services/api-client';
import type { StoreConfig } from '../../../types/api';

export const storeConfigKeys = {
  all: ['store-config'] as const,
  lists: () => ['store-config', 'list'] as const,
  list: () => ['store-config', 'list'] as const,
  details: () => ['store-config', 'detail'] as const,
  detail: () => ['store-config', 'detail'] as const,
};

export function useStoreConfig(isAdmin = false) {
  return useQuery({
    queryKey: storeConfigKeys.detail(),
    queryFn: () => apiClient.get<StoreConfig>('/config'),
    staleTime: isAdmin ? 0 : 10 * 60 * 1000,
  });
}
