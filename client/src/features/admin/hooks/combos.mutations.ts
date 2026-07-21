import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../services/api-client';
import type { Combo, CreateComboPayload, UpdateComboPayload } from '../../../types/api';
import { combosKeys } from '../../catalog/hooks/catalog.queries';
import { adminCombosKeys } from './combos.queries';

export function useCreateCombo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newCombo: CreateComboPayload) =>
      apiClient.post<Combo>('/combos', newCombo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCombosKeys.all });
      queryClient.invalidateQueries({ queryKey: combosKeys.all });
    },
  });
}

export function useUpdateCombo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateComboPayload }) =>
      apiClient.patch<Combo>(`/combos/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCombosKeys.all });
      queryClient.invalidateQueries({ queryKey: combosKeys.all });
    },
  });
}

export function useDeleteCombo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/combos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCombosKeys.all });
      queryClient.invalidateQueries({ queryKey: combosKeys.all });
    },
  });
}

export function useReactivateCombo() {
  const updateMutation = useUpdateCombo();

  return {
    ...updateMutation,
    mutate: (id: string, options?: any) => updateMutation.mutate({ id, data: { isActive: true } }, options),
    mutateAsync: (id: string, options?: any) => updateMutation.mutateAsync({ id, data: { isActive: true } }, options),
  };
}

export function useUpdateComboStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) =>
      apiClient.patch<Combo>(`/combos/${id}`, { stock }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminCombosKeys.all });
      queryClient.invalidateQueries({ queryKey: combosKeys.all });
    },
  });
}
