/**
 * Validates a password string for sign-up (strict policy).
 * Returns an error string if invalid, or null if valid.
 */
const validatePassword = (password: string): string | null => {
    if (!password.trim()) {
        return 'Password is required';
    }

    if (password.length < 8) {
        return 'Password must be at least 8 characters';
    }

    if (password.length > 128) {
        return 'Password is too long';
    }

    // Optimized regex: removed redundant lookahead syntax wrappers
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
        return 'Password must contain at least one lowercase letter, one uppercase letter, and one digit';
    }

    return null;
};

/**
 * Sign-in must not enforce sign-up complexity: legacy/weak passwords must
 * still be submittable so the server can reject with the correct message.
 */
const validateSignInPassword = (password: string): string | null => {
    if (!password) {
        return 'Password is required';
    }
    if (password.length > 128) {
        return 'Password is too long';
    }
    return null;
};

/**
 * Validates an email string.
 * Returns an error string if invalid, or null if valid.
 */
const validateEmail = (email: string): string | null => {
    if (!email.trim()) {
        return 'Email is required';
    }

    if (email.length > 254) {
        return 'Email is too long';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return 'Email is invalid';
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
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase());

        return `${humanReadableName} is required`;
    }
    return null;
};

export { validatePassword, validateSignInPassword, validateEmail, validateString };
