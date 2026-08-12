import { api } from "@/lib/api/client";
import type { ImportBatch } from "@/types/api";

export function importStatement(accountId: string, file: File) {
  const formData = new FormData();
  formData.append("accountId", accountId);
  formData.append("file", file);
  return api.post<ImportBatch>("/import", formData);
}
