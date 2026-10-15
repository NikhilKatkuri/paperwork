function getErrorMessage(status?: number, data?: { message?: string }): string {
    if (status === undefined) {
        return 'Network error. Please check your internet connection.';
    }

    if (status === 401) {
        return 'Session expired. Please sign in again.';
    }

    if (status === 403) {
        return 'You do not have permission to perform this action.';
    }

    if (status === 400 || status === 422) {
        return data?.message || 'Please check the entered information.';
    }

    if (status >= 500) {
        return 'Server error. Please try again later.';
    }

    return 'An error occurred. Please try again.';
}

export { getErrorMessage };
