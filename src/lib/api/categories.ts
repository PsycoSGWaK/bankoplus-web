import { api } from "@/lib/api/client";
import type { Category, CategoryKind, CategoryRule, CategoryRuleDirection } from "@/types/api";

export function getCategories() {
  return api.get<Category[]>("/categories");
}

export function createCategory(input: { name: string; kind: CategoryKind; isFixedExpense?: boolean }) {
  return api.post<Category>("/categories", input);
}

export function updateCategory(id: string, input: { isFixedExpense: boolean }) {
  return api.patch<Category>(`/categories/${id}`, input);
}

export function deleteCategory(id: string) {
  return api.delete<void>(`/categories/${id}`);
}

export function getCategoryRules(categoryId: string) {
  return api.get<CategoryRule[]>(`/categories/${categoryId}/rules`);
}

export function createCategoryRule(
  categoryId: string,
  input: { keyword: string; minAmount?: number; direction?: CategoryRuleDirection },
) {
  return api.post<CategoryRule>(`/categories/${categoryId}/rules`, input);
}

export function deleteCategoryRule(ruleId: string) {
  return api.delete<void>(`/categories/rules/${ruleId}`);
}
