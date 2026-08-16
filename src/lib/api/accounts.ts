import { api } from "@/lib/api/client";
import type { Account } from "@/types/api";

export function getAccounts() {
  return api.get<Account[]>("/accounts");
}

export function createAccount(input: { label: string; bankName?: string; currency?: string }) {
  return api.post<Account>("/accounts", input);
}

export function updateAccountBalance(
  id: string,
  input: { referenceBalance: number; referenceDate: string },
) {
  return api.patch<Account>(`/accounts/${id}`, input);
}
