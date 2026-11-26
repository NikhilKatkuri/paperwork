import { Reveal } from './Reveal';

export function Statement() {
    return (
        <section className="border-theme-on-surface/10 border-t py-20 sm:py-28">
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
                <Reveal>
                    <h2 className="text-theme-on-surface/70 max-w-4xl text-2xl leading-snug font-medium tracking-tight sm:text-3xl lg:text-4xl">
                        <span className="text-theme-on-surface font-semibold">
                            A focused tool for collecting information.
                        </span>{' '}
                        Paperwork keeps form building, response collection, and
                        CSV export in one place — without the noise.
                    </h2>
                </Reveal>
            </div>
        </section>
    );
}
