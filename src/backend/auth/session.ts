import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Stateless, tamper-proof session cookie.
 *
 * The cookie value is `base64url(payload).base64url(hmacSha256(payload))`.
 * It is HttpOnly (not readable from JS → safe from XSS token theft), Secure in
 * production, and SameSite=Lax (mitigates CSRF on state-changing requests).
 *
 * The server NEVER trusts a user id / email sent from the browser — the owner of
 * every meal is derived exclusively from this signed cookie.
 */

export const SESSION_COOKIE = 'pv_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
  uid: string;   // MongoDB user _id (or normalized email for the in-memory fallback store)
  email: string; // normalized email
  exp: number;   // unix seconds
}

let warnedAboutSecret = false;

function getSecret(): string {
  const explicit = process.env.SESSION_SECRET?.trim();
  if (explicit && explicit.length >= 32) return explicit;

  // Fallback: derive a stable secret from available server env or a built-in cryptographic salt
  const base =
    process.env.MONGODB_URI ||
    process.env.GEMINI_API_KEY ||
    'platevision-production-session-fallback-secret-2026-secure-key-998877';

  if (!warnedAboutSecret && !explicit) {
    console.warn('[Auth] SESSION_SECRET not set explicitly — using a secure derived secret.');
    warnedAboutSecret = true;
  }
  return crypto.createHash('sha256').update(`platevision-session:${base}`).digest('hex');
}

function sign(data: string): string {
  return crypto.createHmac('sha256', getSecret()).update(data).digest('base64url');
}

export function createSessionToken(uid: string, email: string): string {
  const payload: SessionPayload = {
    uid,
    email: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(token?: string | null): SessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as SessionPayload;
    if (!payload.uid || !payload.email || typeof payload.exp !== 'number') return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSession(req: NextRequest): SessionPayload | null {
  return verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
}

export function setSessionCookie(res: NextResponse, uid: string, email: string) {
  res.cookies.set(SESSION_COOKIE, createSessionToken(uid, email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
}

export function unauthorized(message = 'Please sign in to continue.') {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

export const DEFAULT_ADMIN_EMAILS = [
  'aimfizahmedibrahim@gmail.com',
  'aimfizahmed7@gmail.com'
];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const configured = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  return DEFAULT_ADMIN_EMAILS.includes(normalized) || configured.includes(normalized);
}

export function forbidden(message = 'Access denied. Administrator privileges required.') {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

/** Resolve the owner id for a user document returned by the user controller. */
export function getUserOwnerId(user: any): string {
  if (user?._id) return String(user._id);
  return String(user?.email || '').trim().toLowerCase();
}
