import { Reveal } from './Reveal';

const steps = [
    {
        number: '01',
        title: 'Create a form',
        description:
            'Start from an empty form or pick a ready-made template. Add sections and choose from several question types.',
        tag: 'From scratch or template',
    },
    {
        number: '02',
        title: 'Configure and publish',
        description:
            'Set required fields and validation rules, choose the form’s appearance, and decide when it is ready to accept responses.',
        tag: 'You stay in control',
    },
    {
        number: '03',
        title: 'Review and export',
        description:
            'Share the link, view and filter the responses that arrive, then export a form’s answers as CSV.',
        tag: 'CSV export',
    },
];

export function HowItWorks() {
    return (
        <section
            id="how-it-works"
            className="border-theme-on-surface/10 border-t py-20 sm:py-24"
        >
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
                <Reveal>
                    <p className="text-theme-on-surface/45 font-mono text-xs font-semibold tracking-widest">
                        05 / HOW IT WORKS
                    </p>
                    <h2 className="text-theme-on-surface mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                        Three steps from an idea to collected responses
                    </h2>
                </Reveal>

                <div className="mt-12 grid gap-6 md:grid-cols-3">
                    {steps.map((step, index) => (
                        <Reveal key={step.number} delay={index * 100}>
                            <div className="border-theme-on-surface/10 bg-theme-form-container flex h-full flex-col justify-between rounded-2xl border p-6">
                                <div>
                                    <span className="text-brand-depth font-mono text-xs font-semibold tracking-widest">
                                        {step.number}
                                    </span>
                                    <h3 className="mt-5 text-lg font-semibold tracking-tight">
                                        {step.title}
                                    </h3>
                                    <p className="text-theme-on-surface/70 mt-2.5 text-sm leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                                <p className="border-theme-on-surface/10 text-theme-on-surface/55 mt-6 border-t pt-4 text-xs font-medium">
                                    {step.tag}
                                </p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}
