import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Customer, Transaction, Notification, UserProfile, CustomerPortalView } from '../backend';
import { PaymentType } from '../backend';

export type { Customer, Transaction, Notification, UserProfile, CustomerPortalView };
export { PaymentType };

// Re-export period type used by PeriodSelector and dashboard
export type StatsPeriod = 'daily' | 'weekly' | 'monthly';

// ─── User Profile ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ─── Customers ───────────────────────────────────────────────────────────────

export function useGetAllCustomers() {
  const { actor, isFetching } = useActor();

  return useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCustomers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCustomer(customerId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Customer>({
    queryKey: ['customer', customerId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCustomer(customerId);
    },
    enabled: !!actor && !isFetching && !!customerId,
  });
}

export function useCreateCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, phone, address }: { name: string; phone: string; address: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createCustomer(name, phone, address);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useDeleteCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteCustomer(customerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export function useGetAllTransactions() {
  const { actor, isFetching } = useActor();

  return useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTransactions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCustomerTransactions(customerId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Transaction[]>({
    queryKey: ['transactions', 'customer', customerId],
    queryFn: async () => {
      if (!actor || !customerId) return [];
      // Filter from all transactions since getCustomerTransactions returns [] per backend
      const all = await actor.getAllTransactions();
      return all.filter((t) => t.customerId === customerId);
    },
    enabled: !!actor && !isFetching && !!customerId,
  });
}

export function useGetReceipt(transactionId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Transaction | null>({
    queryKey: ['receipt', transactionId],
    queryFn: async () => {
      if (!actor || !transactionId) return null;
      // Fetch from all transactions and find by ID
      const all = await actor.getAllTransactions();
      return all.find((t) => t.id === transactionId) ?? null;
    },
    enabled: !!actor && !isFetching && !!transactionId,
  });
}

export function useCreateTransaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      customerId,
      weight,
      payment,
      paymentType,
      shopName,
    }: {
      customerId: string;
      weight: number;
      payment: number;
      paymentType: PaymentType;
      shopName: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTransaction(customerId, weight, payment, paymentType, shopName);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', variables.customerId] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

export function useDeleteTransaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteTransaction(transactionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

export function useEditTransaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      transactionId,
      weight,
      payment,
      paymentType,
      shopName,
    }: {
      transactionId: string;
      weight: number;
      payment: number;
      paymentType: PaymentType;
      shopName: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.editTransaction(transactionId, weight, payment, paymentType, shopName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function useGetUnreadNotifications(customerId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Notification[]>({
    queryKey: ['notifications', customerId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUnreadNotifications(customerId);
    },
    enabled: !!actor && !isFetching && !!customerId,
  });
}

export function useSendNotification() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      customerId,
      message,
      shopName,
    }: {
      customerId: string;
      message: string;
      shopName: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendNotification(customerId, message, shopName);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', variables.customerId] });
    },
  });
}

export function useMarkNotificationsRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.markNotificationsRead(customerId);
    },
    onSuccess: (_data, customerId) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customerPortal', customerId] });
    },
  });
}

// ─── Pending Customers ────────────────────────────────────────────────────────

export function useGetPendingCustomers() {
  const { actor, isFetching } = useActor();

  return useQuery<Customer[]>({
    queryKey: ['pendingCustomers'],
    queryFn: async () => {
      if (!actor) return [];
      const customers = await actor.getAllCustomers();
      return customers.filter((c) => c.balance > 0);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSendPendingReminder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, shopName }: { customerId: string; shopName: string }) => {
      if (!actor) throw new Error('Actor not available');
      const customers = await actor.getAllCustomers();
      const customer = customers.find((c) => c.id === customerId);
      if (!customer) throw new Error('Customer not found');
      const message = `Reminder: You have a pending balance of ₹${customer.balance.toFixed(2)} at ${shopName}. Please clear your dues at your earliest convenience.`;
      return actor.sendNotification(customerId, message, shopName);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', variables.customerId] });
    },
  });
}

export function useSendBulkPendingReminders() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shopName: string) => {
      if (!actor) throw new Error('Actor not available');
      const customers = await actor.getAllCustomers();
      const pending = customers.filter((c) => c.balance > 0);
      await Promise.all(
        pending.map((c) => {
          const message = `Reminder: You have a pending balance of ₹${c.balance.toFixed(2)} at ${shopName}. Please clear your dues at your earliest convenience.`;
          return actor.sendNotification(c.id, message, shopName);
        })
      );
      return pending.length;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export function useGetDashboardStats(period: StatsPeriod, shopName: string) {
  const { actor, isFetching } = useActor();

  return useQuery<{ totalSales: number; totalPayments: number; totalBalance: number }>({
    queryKey: ['dashboardStats', period, shopName],
    queryFn: async () => {
      if (!actor) return { totalSales: 0, totalPayments: 0, totalBalance: 0 };
      if (period === 'daily') return actor.getDailyStats(shopName);
      if (period === 'weekly') return actor.getWeeklyStats(shopName);
      return actor.getMonthlyStats(shopName);
    },
    enabled: !!actor && !isFetching,
  });
}

// Keep old name as alias for backward compatibility with AdminDashboard
export const useDashboardStats = useGetDashboardStats;

// ─── KG Rate ──────────────────────────────────────────────────────────────────

export function useGetCurrentKgRate() {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ['currentKgRate'],
    queryFn: async () => {
      if (!actor) return 140;
      return actor.getCurrentKgRate();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetKgRate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newRate: number) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setKgRate(newRate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentKgRate'] });
    },
  });
}

// ─── Customer Portal (Public) ─────────────────────────────────────────────────

export function useGetCustomerPortalView(customerId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<CustomerPortalView | null>({
    queryKey: ['customerPortal', customerId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCustomerPortalView(customerId);
    },
    enabled: !!actor && !isFetching && !!customerId,
  });
}
