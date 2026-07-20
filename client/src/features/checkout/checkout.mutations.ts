import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../services/api-client';
import type { CreateOrderLeadPayload, OrderLeadResponse } from '../../types/api';

export function useCreateOrderLead() {
  return useMutation({
    mutationFn: (payload: CreateOrderLeadPayload) =>
      apiClient.post<OrderLeadResponse>('/orders/lead', payload),
  });
}
