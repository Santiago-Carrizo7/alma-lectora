import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../services/api-client';
import type { Accessory, AccessoriesListResponse } from '../../../types/api';

interface UseAdminAccessoriesParams {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export const adminAccessoriesKeys = {
  all: ['admin-accessories'] as const,
  lists: () => ['admin-accessories', 'list'] as const,
  list: (params: UseAdminAccessoriesParams) => ['admin-accessories', 'list', params] as const,
  details: () => ['admin-accessories', 'detail'] as const,
  detail: (id: string) => ['admin-accessories', 'detail', id] as const,
};

export function useAdminAccessories(params: UseAdminAccessoriesParams = {}) {
  const { search = '', category = '', page = 1, limit = 10, isActive = true } = params;

  const qs = new URLSearchParams();
  if (search) qs.append('search', search);
  if (category) qs.append('category', category);
  qs.append('page', String(page));
  qs.append('limit', String(limit));
  qs.append('isActive', String(isActive));

  return useQuery({
    queryKey: adminAccessoriesKeys.list(params),
    queryFn: () => apiClient.get<AccessoriesListResponse>(`/accessories?${qs.toString()}`),
    staleTime: 2 * 60 * 1000,
  });
}

export function useAccessoryById(id: string) {
  return useQuery({
    queryKey: adminAccessoriesKeys.detail(id),
    queryFn: () => apiClient.get<Accessory>(`/accessories/${id}`),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}
