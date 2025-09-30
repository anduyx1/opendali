export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  maxLength: number
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxLength: 128,
}

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
  strength: "weak" | "medium" | "strong" | "very-strong"
}

/**
 * Validate password against policy
 */
export function validatePassword(
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY,
): PasswordValidationResult {
  const errors: string[] = []

  // Check length
  if (password.length < policy.minLength) {
    errors.push(`Mật khẩu phải có ít nhất ${policy.minLength} ký tự`)
  }

  if (password.length > policy.maxLength) {
    errors.push(`Mật khẩu không được vượt quá ${policy.maxLength} ký tự`)
  }

  // Check uppercase
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Mật khẩu phải chứa ít nhất một chữ cái viết hoa")
  }

  // Check lowercase
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Mật khẩu phải chứa ít nhất một chữ cái viết thường")
  }

  // Check numbers
  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push("Mật khẩu phải chứa ít nhất một chữ số")
  }

  // Check special characters
  if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push("Mật khẩu phải chứa ít nhất một ký tự đặc biệt")
  }

  // Calculate strength
  const strength = calculatePasswordStrength(password)

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  }
}

/**
 * Calculate password strength
 */
function calculatePasswordStrength(password: string): "weak" | "medium" | "strong" | "very-strong" {
  let score = 0

  // Length bonus
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1

  // Character variety
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score += 1

  // Patterns (negative points)
  if (/(.)\1{2,}/.test(password)) score -= 1 // Repeated characters
  if (/123|abc|qwe/i.test(password)) score -= 1 // Common sequences

  if (score <= 2) return "weak"
  if (score <= 4) return "medium"
  if (score <= 6) return "strong"
  return "very-strong"
}

/**
 * Generate secure password
 */
export function generateSecurePassword(length = 12): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz"
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const numbers = "0123456789"
  const special = "!@#$%^&*()_+-=[]{}|;:,.<>?"

  const allChars = lowercase + uppercase + numbers + special
  let password = ""

  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]

  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("")
}
