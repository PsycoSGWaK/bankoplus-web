import { api } from "@/lib/api/client";
import type { Transaction } from "@/types/api";

export function getTransactions(accountId?: string) {
  const query = accountId ? `?accountId=${encodeURIComponent(accountId)}` : "";
  return api.get<Transaction[]>(`/transactions${query}`);
}

export function updateTransactionCategory(id: string, categoryId: string | null) {
  return api.patch<Transaction>(`/transactions/${id}/category`, { categoryId });
}
