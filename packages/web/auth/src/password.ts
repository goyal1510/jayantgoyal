/** Shared password policy for the Auth owner and legacy product surfaces. */
export const PASSWORD_POLICY_MESSAGE =
  "Use at least 8 characters with an uppercase letter, number, and symbol.";

export function passwordValidationError(value: string): string | null {
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(value)) {
    return "Password must contain at least one uppercase letter.";
  }
  if (!/[0-9]/.test(value)) {
    return "Password must contain at least one number.";
  }
  if (!/[^A-Za-z0-9]/.test(value)) {
    return "Password must contain at least one special character.";
  }
  return null;
}

export function isValidPassword(value: string): boolean {
  return passwordValidationError(value) === null;
}
