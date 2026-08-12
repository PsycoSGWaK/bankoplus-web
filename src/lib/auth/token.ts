// L'access token ne vit qu'en mémoire (jamais localStorage/sessionStorage) —
// voir API-REFERENCE.md, "Points d'attention". Ce module est la seule source
// de vérité, y compris pour le client API qui tourne hors du rendu React.

let accessToken: string | null = null;
const listeners = new Set<() => void>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  listeners.forEach((listener) => listener());
}

export function subscribeToAccessToken(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
