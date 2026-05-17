/** Matches server User model and register/profile form validators. */
export const PASSWORD_COMPLEXITY_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

export const PASSWORD_ALLOWED_CHARS_PATTERN = /^[A-Za-z\d@$!%*?&]+$/;

export const PASSWORD_SPECIAL_CHARS = '@$!%*?&';

export function isPasswordComplexityValid(password: string): boolean {
  return PASSWORD_COMPLEXITY_PATTERN.test(password);
}

export function passwordChecklist(password: string) {
  return {
    hasMinLength: password.length >= 6,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialCharacter: /[@$!%*?&]/.test(password),
    hasOnlyAllowedCharacters:
      password.length > 0 && PASSWORD_ALLOWED_CHARS_PATTERN.test(password),
    isValid: isPasswordComplexityValid(password),
  };
}
