import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';
import type { Accessory } from '../../types/api';
import { accessoriesKeys } from '../catalog/catalog.queries';
import { adminAccessoriesKeys } from './accessories.queries';

export function useCreateAccessory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      apiClient.post<Accessory>('/accessories', formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminAccessoriesKeys.all });
      queryClient.invalidateQueries({ queryKey: accessoriesKeys.all });
    },
  });
}

export function useUpdateAccessory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData | Record<string, unknown> }) =>
      apiClient.patch<Accessory>(`/accessories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminAccessoriesKeys.all });
      queryClient.invalidateQueries({ queryKey: accessoriesKeys.all });
    },
  });
}

export function useDeleteAccessory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/accessories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminAccessoriesKeys.all });
      queryClient.invalidateQueries({ queryKey: accessoriesKeys.all });
    },
  });
}

export function useReactivateAccessory() {
  const updateMutation = useUpdateAccessory();

  return {
    ...updateMutation,
    mutate: (id: string, options?: any) => updateMutation.mutate({ id, data: { isActive: true } }, options),
    mutateAsync: (id: string, options?: any) => updateMutation.mutateAsync({ id, data: { isActive: true } }, options),
  };
}
