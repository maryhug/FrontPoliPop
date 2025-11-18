// src/services/auth.ts
export type JwtPayload = Record<string, any>;

export const getToken = (): string | null => localStorage.getItem('token');

export const getStoredUser = (): any | null => {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
};

const decodeBase64Url = (str: string): string => {
  try {
    const pad = str.length % 4 === 2 ? '==' : str.length % 4 === 3 ? '=' : '';
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
    return decodeURIComponent(
      atob(b64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch {
    return '';
  }
};

export const decodeJwt = (token: string | null): JwtPayload | null => {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  const json = decodeBase64Url(parts[1]);
  try { return JSON.parse(json); } catch { return null; }
};

export const extractRoleFromClaims = (claims: JwtPayload | null): string | undefined => {
  if (!claims) return undefined;
  // Common places where Spring Security/JWT roles live
  const candidates: any[] = [
    claims.role,
    claims.roles,
    claims.authorities,
    claims.auth,
    claims.scope,
  ];
  for (const c of candidates) {
    if (!c) continue;
    if (typeof c === 'string') {
      if (/ROLE_?ADMIN/i.test(c) || c.toUpperCase() === 'ADMIN') return 'ADMIN';
      if (/ROLE_?USER/i.test(c) || c.toUpperCase() === 'USER') return 'USER';
    }
    if (Array.isArray(c)) {
      const upper = c.map(x => (typeof x === 'string' ? x.toUpperCase() : (x?.authority || x?.role || '').toUpperCase()));
      if (upper.some(v => v === 'ADMIN' || v === 'ROLE_ADMIN')) return 'ADMIN';
      if (upper.some(v => v === 'USER' || v === 'ROLE_USER')) return 'USER';
    }
    if (typeof c === 'object') {
      const v = (c.role || c.authority || '').toString().toUpperCase();
      if (v === 'ADMIN' || v === 'ROLE_ADMIN') return 'ADMIN';
      if (v === 'USER' || v === 'ROLE_USER') return 'USER';
    }
  }
  return undefined;
};

export const getCurrentRole = (): string | undefined => {
  const stored = getStoredUser();
  if (stored?.role) return String(stored.role).toUpperCase();
  const token = getToken();
  const claims = decodeJwt(token);
  return extractRoleFromClaims(claims);
};

export const isAdmin = (): boolean => getCurrentRole() === 'ADMIN';

