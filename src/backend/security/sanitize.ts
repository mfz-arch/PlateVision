/**
 * Security & input sanitization utilities.
 * Protects against NoSQL operator injection, script injections, and malformed inputs.
 */

/**
 * Ensures a value is a clean string with a max length and no dangerous control characters.
 */
export function sanitizeString(val: unknown, maxLen = 256, fallback = ''): string {
  if (typeof val !== 'string') return fallback;
  // Strip control chars, trim, and cap length
  return val.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, maxLen);
}

/**
 * Validates and normalizes an email address.
 * Rejects objects/arrays to prevent NoSQL operator injection ($gt, $ne, etc.).
 */
export function sanitizeEmail(val: unknown): string {
  if (typeof val !== 'string') {
    throw new Error('Invalid email format');
  }
  const clean = val.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(clean) || clean.length > 254) {
    throw new Error('Please enter a valid email address');
  }
  return clean;
}

/**
 * Enforces strong password criteria:
 * - Minimum 8 characters
 * - At least one letter
 * - At least one number
 */
export function validatePasswordStrength(password: unknown): string {
  if (typeof password !== 'string') {
    throw new Error('Password must be a valid text string');
  }
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  if (password.length > 128) {
    throw new Error('Password cannot exceed 128 characters');
  }
  if (!/[a-zA-Z]/.test(password)) {
    throw new Error('Password must contain at least one letter');
  }
  if (!/\d/.test(password)) {
    throw new Error('Password must contain at least one number');
  }
  return password;
}

/**
 * Safely parses a bounded positive number.
 */
export function sanitizeNumber(val: unknown, min = 0, max = 100000, fallback = 0): number {
  const n = Number(val);
  if (!Number.isFinite(n) || isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

