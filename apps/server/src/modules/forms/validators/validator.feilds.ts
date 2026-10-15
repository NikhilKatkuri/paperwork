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
        'isPublished',
        'allowedDomains',
        'settings',
        'responseCount',
        'theme',
    ] as const satisfies readonly (keyof Required<Form>)[];

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

    readonly sectionActionKeys = ['type', 'sectionId'] as const;

    readonly questionKeys = [
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
    ] as const satisfies readonly (keyof Required<Question>)[];

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
    ] as const satisfies readonly (keyof Required<
        NonNullable<Question['optionsConfig']>['options'][number]
    >)[];

    readonly questionDependsOnKeys = [
        'questionId',
        'value',
    ] as const satisfies readonly (keyof Required<
        NonNullable<Question['dependsOn']>
    >)[];

    readonly fieldValidationRuleKeys = [
        'ruleType',
    ] as const satisfies readonly (keyof Required<
        NonNullable<Question['validationRule']>
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
            let _d = {
                type: safeData.defaultAction.type,
                sectionId: undefined as string | undefined,
            };
            if (
                safeData.defaultAction.type === 'GO_TO_SECTION' &&
                safeData.defaultAction.targetSectionId
            ) {
                _d.sectionId = safeData.defaultAction.targetSectionId;
            }

            safeData.defaultAction = _d as Section['defaultAction'];
        }

        if (safeData.rules) {
            safeData.rules = safeData.rules.map(
                (dependsOn) =>
                    this.pickFields(dependsOn, this.SectionRule) as SectionRule
            );
        }

        return safeData;
    }

    getSafeQuestionData(data: Partial<Question>) {
        const safeData = this.pickFields(data, this.questionKeys);

        if (safeData.optionsConfig) {
            safeData.optionsConfig = {
                expectedAnswer: safeData.optionsConfig.expectedAnswer,
                options: safeData.optionsConfig.options.map(
                    (option) =>
                        this.pickFields(option, this.optionKeys) as NonNullable<
                            Question['optionsConfig']
                        >['options'][number]
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
                safeData.validationRule as Partial<
                    NonNullable<Question['validationRule']>
                >,
                this.fieldValidationRuleKeys
            ) as Question['validationRule'];
        }

        return safeData;
    }
}

const fieldsValidator = new FieldsValidator();

export default fieldsValidator;
