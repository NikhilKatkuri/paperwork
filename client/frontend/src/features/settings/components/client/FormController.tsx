'use client';
interface controller {
    saving: boolean;
    onCancel: () => void;
}

export default function FormController({ saving, onCancel }: Readonly<controller>) {
    return (
        <div className="flex w-full items-center justify-end gap-4 pt-6">
            <button
                type="button"
                onClick={onCancel}
                className="bg-theme-form-on-surface/10 hover:bg-theme-form-on-surface/90 text-theme-on-surface cursor-pointer rounded-full p-4 px-7 text-sm font-semibold transition-all duration-200 ease-in-out hover:text-white sm:px-8"
            >
                {saving ? 'Abort' : 'Cancel'}
            </button>
            <button
                type="submit"
                disabled={saving}
                aria-busy={saving}
                className="bg-theme-form-container-active/80 text-on-brand-depth hover:bg-theme-form-container-active cursor-pointer rounded-full p-4 px-7 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 sm:px-8"
            >
                {saving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
    );
}
