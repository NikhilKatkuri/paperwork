/**
 * Subtle confirmation chirp after a form is created.
 *
 * Decorative only: playback failures (autoplay policy, missing asset, private
 * mode) are swallowed so they can never affect the creation flow.
 */
const SOUND_SRC = '/sounds/universfield-bubble-pop.mp3';
const SOUND_VOLUME = 0.35;

let formCreatedSound: HTMLAudioElement | null = null;

export function playFormCreatedSound(): void {
    if (typeof window === 'undefined') return;

    try {
        formCreatedSound ??= new Audio(SOUND_SRC);
        formCreatedSound.volume = SOUND_VOLUME;
        formCreatedSound.currentTime = 0;
        void formCreatedSound.play().catch(() => undefined);
    } catch {
        // Never let a decorative sound break form creation.
    }
}
