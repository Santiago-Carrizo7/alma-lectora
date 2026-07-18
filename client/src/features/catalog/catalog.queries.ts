import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import type { BooksListResponse } from '../../types/api';

interface UseBooksParams {
  search?: string;
  genre?: string;
  badge?: string;
  page?: number;
  limit?: number;
}

export const booksKeys = {
  all: ['books'] as const,
  list: (params: UseBooksParams) => ['books', 'list', params] as const,
};

export function useBooks(params: UseBooksParams = {}) {
  const { search = '', genre = '', badge = '', page = 1, limit = 24 } = params;

  const qs = new URLSearchParams();
  if (search) qs.append('search', search);
  if (genre) qs.append('genre', genre);
  if (badge) qs.append('badge', badge);
  qs.append('page', String(page));
  qs.append('limit', String(limit));

  return useQuery({
    queryKey: booksKeys.list(params),
    queryFn: () => apiClient.get<BooksListResponse>(`/books?${qs.toString()}`),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

export interface UseAccessoriesParams {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export const accessoriesKeys = {
  all: ['accessories'] as const,
  list: (params: UseAccessoriesParams) => ['accessories', 'list', params] as const,
};

export function useAccessories(params: UseAccessoriesParams = {}) {
  const { search = '', category = '', page = 1, limit = 24 } = params;

  const qs = new URLSearchParams();
  if (search) qs.append('search', search);
  if (category) qs.append('category', category);
  qs.append('page', String(page));
  qs.append('limit', String(limit));

  return useQuery({
    queryKey: accessoriesKeys.list(params),
    queryFn: () => apiClient.get<{ data: any[]; meta: any }>(`/accessories?${qs.toString()}`),
    staleTime: 1000 * 60 * 5,
  });
}

export interface UseCombosParams {
  search?: string;
  page?: number;
  limit?: number;
}

export const combosKeys = {
  all: ['combos'] as const,
  list: (params: UseCombosParams) => ['combos', 'list', params] as const,
};

export function useCombos(params: UseCombosParams = {}) {
  const { search = '', page = 1, limit = 24 } = params;

  const qs = new URLSearchParams();
  if (search) qs.append('search', search);
  qs.append('page', String(page));
  qs.append('limit', String(limit));

  return useQuery({
    queryKey: combosKeys.list(params),
    queryFn: () => apiClient.get<{ data: any[]; meta: any }>(`/combos?${qs.toString()}`),
    staleTime: 1000 * 60 * 5,
  });
}
