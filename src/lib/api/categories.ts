import { api } from "@/lib/api/client";
import type { Category, CategoryKind, CategoryRule } from "@/types/api";

export function getCategories() {
  return api.get<Category[]>("/categories");
}

export function createCategory(input: { name: string; kind: CategoryKind }) {
  return api.post<Category>("/categories", input);
}

export function deleteCategory(id: string) {
  return api.delete<void>(`/categories/${id}`);
}

export function getCategoryRules(categoryId: string) {
  return api.get<CategoryRule[]>(`/categories/${categoryId}/rules`);
}

export function createCategoryRule(categoryId: string, keyword: string) {
  return api.post<CategoryRule>(`/categories/${categoryId}/rules`, { keyword });
}

export function deleteCategoryRule(ruleId: string) {
  return api.delete<void>(`/categories/rules/${ruleId}`);
}
