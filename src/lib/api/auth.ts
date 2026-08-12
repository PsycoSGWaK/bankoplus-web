import { api } from "@/lib/api/client";
import type {
  LoginStepOneResponse,
  LoginVerifyResponse,
  MfaSetupResponse,
  RegisterResponse,
} from "@/types/api";

export function register(email: string, password: string) {
  return api.post<RegisterResponse>("/auth/register", { email, password }, { auth: false });
}

export function setupMfa(mfaSetupToken: string) {
  return api.post<MfaSetupResponse>(
    "/auth/mfa/setup",
    undefined,
    { auth: false, headers: { Authorization: `Bearer ${mfaSetupToken}` } },
  );
}

export function enableMfa(mfaSetupToken: string, code: string) {
  return api.post<{ message: string }>(
    "/auth/mfa/enable",
    { code },
    { auth: false, headers: { Authorization: `Bearer ${mfaSetupToken}` } },
  );
}

export function login(email: string, password: string) {
  return api.post<LoginStepOneResponse>("/auth/login", { email, password }, { auth: false });
}

export function verifyLogin(stepOneToken: string, code: string) {
  return api.post<LoginVerifyResponse>(
    "/auth/login/verify",
    { code },
    { auth: false, headers: { Authorization: `Bearer ${stepOneToken}` } },
  );
}

export function logout() {
  return api.post<void>("/auth/logout", undefined, { auth: false });
}
