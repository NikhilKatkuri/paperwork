import {
    Form,
    FormSettings,
    Question,
    Section,
    SectionRule,
} from '@paperwork/types';

class FieldsValidator {
    readonly formFields = [
        'name',
        'isPrivate',
        'allowedDomains',
        'settings',
        'theme',
    ] as const;

    readonly formSettingsFields = [
        'maxResponses',
        'maxResponsesPerUser',
        'closeDate',
        'startDate',
        'timeLimitPerResponse',
        'collectEmail',
        'shuffleQuestions',
        'allowEditResponse',
        'saveAndContinueLater',
        'progressBar',
        'customConfirmationMessage',
        'redirectUrl',
    ] as const satisfies readonly (keyof Required<FormSettings>)[];

    readonly sectionFields = [
        'index',
        'title',
        'description',
        'rules',
        'defaultAction',
    ] as const satisfies readonly (keyof Required<Section>)[];

    readonly SectionRule = [
        'questionId',
        'operator',
        'expectedValue',
        'action',
    ] as const satisfies readonly (keyof SectionRule)[];

    readonly sectionActionKeys = ['type', 'targetSectionId'] as const;

    readonly questionKeys = [
        'index',
        'type',
        'question',
        'helpText',
        'optionsConfig',
        'options',
        'dependsOn',
        'ratingConfig',
        'scaleConfig',
        'matrixConfig',
        'validationRule',
        'placeholder',
        'isRequired',
        'slug',
        'correctAnswer',
    ] as const;

    readonly questionRatingConfigKeys = [
        'icon',
        'scale',
        'lowLabel',
        'highLabel',
    ] as const satisfies readonly (keyof Required<
        NonNullable<Question['ratingConfig']>
    >)[];

    readonly optionConfigKeys = [
        'expectedAnswer',
        'options',
    ] as const satisfies readonly (keyof Required<
        NonNullable<Question['optionsConfig']>
    >)[];

    readonly optionKeys = [
        'label',
        'index',
        'action',
    ] as const;

    readonly questionDependsOnKeys = [
        'questionId',
        'value',
    ] as const satisfies readonly (keyof Required<
        NonNullable<Question['dependsOn']>
    >)[];

    readonly fieldValidationRuleKeys = [
        'ruleType',
        'value',
        'min',
        'max',
        'pattern',
        'customErrorMessage',
    ] as const;

    private pickFields<T extends object, K extends readonly (keyof T)[]>(
        data: Partial<T>,
        allowed: K
    ): Partial<T> {
        const safeData = {} as Partial<T>;

        for (const key of Object.keys(data) as (keyof T)[]) {
            const value = data[key];

            if (value === undefined || !allowed.includes(key)) continue;

            safeData[key] = value;
        }

        return safeData;
    }

    getSafeFormSettings(data: Partial<FormSettings>) {
        return this.pickFields(data, this.formSettingsFields);
    }

    getSafeFormData(data: Partial<Form>) {
        const safeData = this.pickFields(data, this.formFields);

        if (safeData.settings) {
            safeData.settings = this.getSafeFormSettings(safeData.settings);
        }

        return safeData;
    }

    getSafeSectionData(data: Partial<Section>) {
        const safeData = this.pickFields(data, this.sectionFields);

        if (safeData.defaultAction) {
            const src = safeData.defaultAction as any;
            const cleaned: any = { type: src.type };
            if (src.type === 'GO_TO_SECTION' && src.targetSectionId) {
                cleaned.targetSectionId = src.targetSectionId;
            }

            safeData.defaultAction = cleaned as Section['defaultAction'];
        }

        if (safeData.rules) {
            safeData.rules = safeData.rules.map((dependsOn) => {
                const picked = this.pickFields(
                    dependsOn,
                    this.SectionRule
                ) as SectionRule;
                const action = (picked as any).action;
                if (action) {
                    (picked as any).action = {
                        type: action.type,
                        ...(action.targetSectionId
                            ? { targetSectionId: action.targetSectionId }
                            : {}),
                    };
                }
                return picked;
            });
        }

        return safeData;
    }

    getSafeQuestionData(data: any) {
        // Normalize legacy `options` -> `optionsConfig.options` so Zod-valid
        // CHOICE payloads are not stripped to undefined.
        const normalized: any = { ...(data ?? {}) };
        if (Array.isArray((normalized as any).options) && !(normalized as any).optionsConfig) {
            normalized.optionsConfig = { options: (normalized as any).options };
        }
        const safeData: any = this.pickFields(normalized, this.questionKeys as any);

        if (safeData.optionsConfig) {
            safeData.optionsConfig = {
                expectedAnswer: safeData.optionsConfig.expectedAnswer,
                options: (safeData.optionsConfig.options ?? []).map(
                    (option: any) => {
                        const picked = this.pickFields(
                            option,
                            this.optionKeys as any
                        ) as any;
                        // Strip anything but the action contract — a forged
                        // option must not smuggle extra keys into the doc.
                        if (picked.action) {
                            const action = picked.action as any;
                            picked.action = {
                                type: action.type,
                                ...(action.targetSectionId
                                    ? {
                                          targetSectionId:
                                              action.targetSectionId,
                                      }
                                    : {}),
                            };
                        }
                        return picked as NonNullable<
                            Question['optionsConfig']
                        >['options'][number];
                    }
                ),
            };
        }

        if (safeData.dependsOn) {
            safeData.dependsOn = this.pickFields(
                safeData.dependsOn,
                this.questionDependsOnKeys
            ) as Question['dependsOn'];
        }

        if (safeData.ratingConfig) {
            safeData.ratingConfig = this.pickFields(
                safeData.ratingConfig,
                this.questionRatingConfigKeys
            ) as Question['ratingConfig'];
        }

        if (safeData.validationRule) {
            safeData.validationRule = this.pickFields(
                safeData.validationRule as any,
                this.fieldValidationRuleKeys as any
            ) as Question['validationRule'];
        }

        return safeData;
    }
}

const fieldsValidator = new FieldsValidator();

export default fieldsValidator;
