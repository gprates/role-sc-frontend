/**
 * Regras de força de senha do Rolê SC. Devem permanecer em sincronia com a
 * validação server-side (ver CONTRATO_RECUPERACAO_SENHA.md, seção 4.3).
 *
 * - Mínimo 8 caracteres
 * - Pelo menos 1 letra maiúscula
 * - Pelo menos 1 letra minúscula
 * - Pelo menos 1 dígito
 * - Pelo menos 1 caractere especial
 */

const SPECIAL_CHARS_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?~`]/;

export interface PasswordStrength {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigit: boolean;
  hasSpecialChar: boolean;
  isValid: boolean;
}

export const validatePassword = (password: string): PasswordStrength => {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecialChar = SPECIAL_CHARS_REGEX.test(password);

  return {
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasDigit,
    hasSpecialChar,
    isValid:
      hasMinLength && hasUppercase && hasLowercase && hasDigit && hasSpecialChar,
  };
};

/**
 * Lista ordenada das regras, usada pelo PasswordStrengthMeter para renderizar
 * o checklist visual. A ordem importa para a UI (mais "fáceis" primeiro).
 */
export const PASSWORD_REQUIREMENTS = [
  { key: 'hasMinLength', label: 'Mínimo 8 caracteres' },
  { key: 'hasUppercase', label: 'Uma letra maiúscula (A-Z)' },
  { key: 'hasLowercase', label: 'Uma letra minúscula (a-z)' },
  { key: 'hasDigit', label: 'Um número (0-9)' },
  { key: 'hasSpecialChar', label: 'Um caractere especial (!@#$...)' },
] as const satisfies ReadonlyArray<{
  key: keyof Omit<PasswordStrength, 'isValid'>;
  label: string;
}>;

/**
 * Retorna a primeira regra não cumprida (ou null se a senha é válida).
 * Útil para mostrar mensagem de erro inline em telas que não usam o meter.
 */
export const firstUnmetRequirement = (password: string): string | null => {
  const result = validatePassword(password);
  if (result.isValid) return null;
  for (const req of PASSWORD_REQUIREMENTS) {
    if (!result[req.key]) return req.label;
  }
  return null;
};
