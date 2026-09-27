import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'smart-healthcare-session-secret-key-9923847291';

export interface UserSessionPayload {
  id: number;
  uid: string;
  username: string;
  email: string;
  role: string;
  hospitalId: number | null;
  fullName: string;
  mustChangePassword?: boolean;
}

export function createSessionToken(payload: UserSessionPayload, expiresInHours = 24): string {
  const expiresAt = Date.now() + expiresInHours * 60 * 60 * 1000;
  const data = JSON.stringify({ ...payload, exp: expiresAt });
  const b64Data = Buffer.from(data).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(b64Data)
    .digest('base64url');
  return `${b64Data}.${signature}`;
}

export function verifySessionToken(token: string): UserSessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [b64Data, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(b64Data)
      .digest('base64url');
    if (signature !== expectedSignature) return null;

    const parsed = JSON.parse(Buffer.from(b64Data, 'base64url').toString('utf8'));
    if (parsed.exp && Date.now() > parsed.exp) {
      return null;
    }
    return parsed as UserSessionPayload;
  } catch {
    return null;
  }
}
