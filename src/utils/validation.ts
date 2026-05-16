/**
 * Input validation utilities
 *
 * Provides regex-based validation for email, phone, and password.
 * Follows Single Responsibility Principle — each validator is independent.
 */

/** General email format validation */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/** Gmail-specific validation */
const GMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

/** Indian phone number (10 digits, optional +91 prefix) */
const PHONE_REGEX = /^(\+91)?[6-9]\d{9}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function isGmailAddress(email: string): boolean {
  return GMAIL_REGEX.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  return PHONE_REGEX.test(phone.replace(/\s/g, ''));
}

export interface PasswordRule {
  label: string;
  met: boolean;
}

export interface PasswordStrengthResult {
  rules: PasswordRule[];
  isValid: boolean;
  strength: 'weak' | 'fair' | 'strong';
}

/**
 * Evaluate password against strength rules.
 * Returns individual rule status for live UI indicators.
 */
export function getPasswordStrength(password: string): PasswordStrengthResult {
  const rules: PasswordRule[] = [
    {
      label: 'At least 8 characters',
      met: password.length >= 8,
    },
    {
      label: 'Contains a number',
      met: /\d/.test(password),
    },
    {
      label: 'Contains a special character (!@#$%^&*…)',
      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
    },
    {
      label: 'Contains an uppercase letter',
      met: /[A-Z]/.test(password),
    },
    {
      label: 'Contains a lowercase letter',
      met: /[a-z]/.test(password),
    },
  ];

  const metCount = rules.filter((r) => r.met).length;
  const isValid = rules.every((r) => r.met);
  const strength: 'weak' | 'fair' | 'strong' =
    metCount <= 2 ? 'weak' : metCount <= 4 ? 'fair' : 'strong';

  return { rules, isValid, strength };
}
