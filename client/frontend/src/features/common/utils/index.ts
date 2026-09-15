export function debounce<T>(callback: (...args: T[]) => void, delay: number) {
    let timer: ReturnType<typeof setTimeout>;

    return (...args: T[]) => {
        clearTimeout(timer);

        timer = setTimeout(() => {
            callback(...args);
        }, delay);
    };
}
