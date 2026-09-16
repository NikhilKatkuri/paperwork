# Form Data Schemas

The API is mounted under `/api/v1`. Form-management requests wrap their payload in `data`.

## Form

```ts
{
  name: string;                 // 1..255 characters
  isPrivate: boolean;           // default false
  isPublished: boolean;         // default false
  allowedDomains?: string[];
  responseCount?: number;       // non-negative integer, bulk/read data only
  settings?: {
    maxResponses?: number | null;          // positive integer
    maxResponsesPerUser?: number | null;   // positive integer
    closeDate?: Date | string | null;
    startDate?: Date | string | null;
    timeLimitPerResponse?: number | null;  // positive integer
    collectEmail?: boolean;                // default false
    shuffleQuestions?: boolean;             // default false
    allowEditResponse?: boolean;            // default false
    saveAndContinueLater?: boolean;         // default false
    progressBar?: boolean;                  // default false
    customConfirmationMessage?: string | null; // max 1000
    redirectUrl?: string | null;
  };
}
```

## Section

```ts
{
  _id?: string;                 // required in bulk form updates
  index: number;                // non-negative integer
  title: string;                // 1..255
  description?: string;         // max 5000
  defaultAction?: SectionAction;
  onAnswer?: Array<{
    questionId: string;
    value: string;
    action: SectionAction;
  }>;
}

type SectionAction =
  | { actionType: 'NEXT_SECTION' }
  | { actionType: 'SUBMIT_FORM' }
  | { actionType: 'GO_TO_SECTION'; sectionId: string };
```

## Question

Create/update question bodies contain `type` and `question`. Bulk form question objects additionally contain `_id` and `index`.

```ts
{
  _id?: string;
  index?: number;
  type: 'TEXT' | 'PARAGRAPH' | 'DATE' | 'TIME' |
        'CHOICE' | 'RADIO' | 'DROP_DOWN' | 'LINEAR_SCALE' | 'RATING';
  question: string;             // 1..1000
  helpText?: string;            // max 500
  placeholder?: string;         // max 100
  isRequired?: boolean;         // default false
  dependsOn?: { questionId: string; value: string };
  optionsConfig?: {
    correctAnswer?: string;
    options: Array<{ index: number; label: string }>;
  };
  ratingConfig?: {
    icon: 'STAR' | 'HEART' | 'THUMB_UP';
    scale: 5 | 10;
    lowLabel?: string;
    highLabel?: string;
  };
  validationRule?: {
    ruleType: 'EMAIL' | 'URL' | 'NUMBER_GREATER_THAN' | 'NUMBER_LESS_THAN' |
      'REGEX_MATCH' | 'MAX_CHAR_COUNT' | 'NUMBER_EQUAL_TO' | 'NUMBER_BETWEEN' |
      'MIN_CHAR_COUNT' | 'DATE_IS_BEFORE' | 'DATE_IS_AFTER' |
      'CHECKBOX_MIN_SELECT' | 'CHECKBOX_MAX_SELECT';
    value?: string | number;
    min?: number;
    max?: number;
    pattern?: string;
    customErrorMessage?: string;
  };
}
```

`CHOICE`, `RADIO`, and `DROP_DOWN` require `optionsConfig`. `LINEAR_SCALE` and `RATING` require `ratingConfig`.

## Answers and responses

Submission input is an array of `{ questionId: string, values: string[] }` under `data`. The server adds the authenticated user, email, user-agent, IP address, and timestamps. Submissions are queued and return a `submissionId` before processing completes.

## Standard response shape

Success responses contain `success: true`, a message where applicable, and route-specific `data`. Validation failures use `400`; unauthorized requests use `401`; missing resources use `404`; successful deletes use `204` with no body.
