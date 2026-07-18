import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import type { Book, UpdateBookPayload } from '../../types/api';
import { booksKeys } from '../catalog/catalog.queries';
import { adminBooksKeys } from './admin.queries';

export function useCreateBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newBook: any) => apiClient.post<Book>('/books', newBook),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminBooksKeys.all });
      queryClient.invalidateQueries({ queryKey: booksKeys.all });
    },
  });
}

export function useUpdateBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBookPayload }) =>
      apiClient.patch<Book>(`/books/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminBooksKeys.all });
      queryClient.invalidateQueries({ queryKey: booksKeys.all });
    },
  });
}

export function useDeleteBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/books/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminBooksKeys.all });
      queryClient.invalidateQueries({ queryKey: booksKeys.all });
    },
  });
}

export function useUpdateBookStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) =>
      apiClient.patch<Book>(`/books/${id}/stock`, { stock }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminBooksKeys.all }),
        queryClient.invalidateQueries({ queryKey: booksKeys.all }),
      ]);
    },
  });
}

