import { api } from "@/lib/api/client";
import type { Budget, BudgetProgress, BudgetSimulation, BudgetsOverview } from "@/types/api";

function monthQuery(month?: string) {
  return month ? `?month=${encodeURIComponent(month)}` : "";
}

export function getBudgetProgress(month?: string) {
  return api.get<BudgetProgress[]>(`/budgets${monthQuery(month)}`);
}

export function getBudgetsOverview(month?: string) {
  return api.get<BudgetsOverview>(`/budgets/overview${monthQuery(month)}`);
}

export function upsertBudget(input: { categoryId?: string; monthlyLimit: number }) {
  return api.post<Budget>("/budgets", input);
}

export function deleteBudget(id: string) {
  return api.delete<void>(`/budgets/${id}`);
}

export function simulateBudget(input: { amount: number; categoryId?: string }) {
  return api.post<BudgetSimulation>("/budgets/simulate", input);
}
