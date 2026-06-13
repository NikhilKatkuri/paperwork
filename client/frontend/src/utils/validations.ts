type Errors = Record<string, string>;

/**
 * Validates a password string.
 * Returns an error string if invalid, or null if valid.
 */
const validatePassword = (password: string): string | null => {
  if (!password.trim()) {
    return "Password is required";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }

  // Optimized regex: removed redundant lookahead syntax wrappers
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
  if (!passwordRegex.test(password)) {
    return "Password must contain at least one lowercase letter, one uppercase letter, and one digit";
  }

  return null;
};

/**
 * Validates an email string.
 * Returns an error string if invalid, or null if valid.
 */
const validateEmail = (email: string): string | null => {
  if (!email.trim()) {
    return "Email is required";
  }

  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return "Email is invalid";
  }

  return null;
};

/**
 * Validates a generic required string field.
 * Returns an error string if invalid, or null if valid.
 */
const validateString = (value: string, fieldName: string): string | null => {
  if (!value.trim()) {
    // Formats PascalCase/camelCase fieldNames (like 'fullName') into a readable sentence string
    const humanReadableName = fieldName
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());

    return `${humanReadableName} is required`;
  }
  return null;
};

export { validatePassword, validateEmail, validateString };
