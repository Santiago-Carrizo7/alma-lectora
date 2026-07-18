import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import type { Book, BooksListResponse } from '../../types/api';

interface UseAdminBooksParams {
  search?: string;
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export const adminBooksKeys = {
  all: ['admin-books'] as const,
  lists: () => ['admin-books', 'list'] as const,
  list: (params: UseAdminBooksParams) => ['admin-books', 'list', params] as const,
  details: () => ['admin-books', 'detail'] as const,
  detail: (id: string) => ['admin-books', 'detail', id] as const,
};

export function useAdminBooks(params: UseAdminBooksParams = {}) {
  const { search = '', page = 1, limit = 10, isActive = true } = params;

  const qs = new URLSearchParams();
  if (search) qs.append('search', search);
  qs.append('page', String(page));
  qs.append('limit', String(limit));
  qs.append('isActive', String(isActive));

  return useQuery({
    queryKey: adminBooksKeys.list(params),
    queryFn: () => apiClient.get<BooksListResponse>(`/books?${qs.toString()}`),
    staleTime: 0,
  });
}

export function useBookById(id: string) {
  return useQuery({
    queryKey: adminBooksKeys.detail(id),
    queryFn: () => apiClient.get<Book>(`/books/${id}`),
    enabled: !!id,
    staleTime: 0,
  });
}
