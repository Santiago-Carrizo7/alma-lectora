import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import type { Combo, CombosListResponse } from '../../types/api';

interface UseAdminCombosParams {
  search?: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export const adminCombosKeys = {
  all: ['admin-combos'] as const,
  lists: () => ['admin-combos', 'list'] as const,
  list: (params: UseAdminCombosParams) => ['admin-combos', 'list', params] as const,
  details: () => ['admin-combos', 'detail'] as const,
  detail: (id: string) => ['admin-combos', 'detail', id] as const,
};

export function useAdminCombos(params: UseAdminCombosParams = {}) {
  const { search = '', page = 1, limit = 10, isActive = true } = params;

  const qs = new URLSearchParams();
  if (search) qs.append('search', search);
  qs.append('page', String(page));
  qs.append('limit', String(limit));
  qs.append('isActive', String(isActive));

  return useQuery({
    queryKey: adminCombosKeys.list(params),
    queryFn: () => apiClient.get<CombosListResponse>(`/combos?${qs.toString()}`),
    staleTime: 2 * 60 * 1000,
  });
}

export function useComboById(id: string) {
  return useQuery({
    queryKey: adminCombosKeys.detail(id),
    queryFn: () => apiClient.get<Combo>(`/combos/${id}`),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}
