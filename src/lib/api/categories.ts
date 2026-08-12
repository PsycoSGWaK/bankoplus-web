import { api } from "@/lib/api/client";
import type { Category } from "@/types/api";

export function getCategories() {
  return api.get<Category[]>("/categories");
}
