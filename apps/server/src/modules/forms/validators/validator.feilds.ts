import {
    FormCore,
    FormSettings,
    QuestionCore,
    SectionCore,
    SectionDependsOn,
} from '@/types/form/forms';

class FieldsValidator {
    readonly formFields = [
        'name',
        'isPrivate',
        'isPublished',
        'allowedDomains',
        'settings',
        'responseCount',
        'theme',
    ] as const satisfies readonly (keyof Required<FormCore>)[];

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
        'onAnswer',
        'defaultAction',
    ] as const satisfies readonly (keyof Required<SectionCore>)[];

    readonly sectionDependsOnKeys = [
        'questionId',
        'value',
        'action',
    ] as const satisfies readonly (keyof SectionDependsOn)[];

    readonly sectionActionKeys = ['actionType', 'sectionId'] as const;

    readonly questionCoreKeys = [
        'index',
        'type',
        'question',
        'helpText',
        'optionsConfig',
        'dependsOn',
        'ratingConfig',
        'validationRule',
        'placeholder',
        'isRequired',
    ] as const satisfies readonly (keyof Required<QuestionCore>)[];

    readonly questionRatingConfigKeys = [
        'icon',
        'scale',
        'lowLabel',
        'highLabel',
    ] as const satisfies readonly (keyof Required<
        NonNullable<QuestionCore['ratingConfig']>
    >)[];

    readonly optionConfigKeys = [
        'correctAnswer',
        'options',
    ] as const satisfies readonly (keyof Required<
        NonNullable<QuestionCore['optionsConfig']>
    >)[];

    readonly optionKeys = [
        'label',
        'index',
    ] as const satisfies readonly (keyof Required<
        NonNullable<QuestionCore['optionsConfig']>['options'][number]
    >)[];

    readonly questionDependsOnKeys = [
        'questionId',
        'value',
    ] as const satisfies readonly (keyof Required<
        NonNullable<QuestionCore['dependsOn']>
    >)[];

    readonly fieldValidationRuleKeys = [
        'ruleType',
        'value',
        'min',
        'max',
        'pattern',
    ] as const satisfies readonly (keyof Required<
        NonNullable<QuestionCore['validationRule']>
    >)[];

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

    getSafeFormData(data: Partial<FormCore>) {
        const safeData = this.pickFields(data, this.formFields);

        if (safeData.settings) {
            safeData.settings = this.getSafeFormSettings(safeData.settings);
        }

        return safeData;
    }

    getSafeSectionData(data: Partial<SectionCore>) {
        const safeData = this.pickFields(data, this.sectionFields);

        if (safeData.defaultAction) {
            let _d = {
                actionType: safeData.defaultAction.actionType,
                sectionId: undefined as string | undefined,
            };
            if (
                safeData.defaultAction?.actionType === 'GO_TO_SECTION' &&
                safeData.defaultAction.sectionId
            ) {
                _d.sectionId = safeData.defaultAction.sectionId;
            }

            safeData.defaultAction = _d as SectionCore['defaultAction'];
        }

        if (safeData.onAnswer) {
            safeData.onAnswer = safeData.onAnswer.map(
                (dependsOn) =>
                    this.pickFields(
                        dependsOn,
                        this.sectionDependsOnKeys
                    ) as SectionDependsOn
            );
        }

        return safeData;
    }

    getSafeQuestionData(data: Partial<QuestionCore>) {
        const safeData = this.pickFields(data, this.questionCoreKeys);

        if (safeData.optionsConfig) {
            safeData.optionsConfig = {
                correctAnswer: safeData.optionsConfig.correctAnswer,
                options: safeData.optionsConfig.options.map(
                    (option) =>
                        this.pickFields(option, this.optionKeys) as NonNullable<
                            QuestionCore['optionsConfig']
                        >['options'][number]
                ),
            };
        }

        if (safeData.dependsOn) {
            safeData.dependsOn = this.pickFields(
                safeData.dependsOn,
                this.questionDependsOnKeys
            ) as QuestionCore['dependsOn'];
        }

        if (safeData.ratingConfig) {
            safeData.ratingConfig = this.pickFields(
                safeData.ratingConfig,
                this.questionRatingConfigKeys
            ) as QuestionCore['ratingConfig'];
        }

        if (safeData.validationRule) {
            safeData.validationRule = this.pickFields(
                safeData.validationRule,
                this.fieldValidationRuleKeys
            ) as QuestionCore['validationRule'];
        }

        return safeData;
    }
}

const fieldsValidator = new FieldsValidator();

export default fieldsValidator;
