import { ExerciseLanguage } from '../data/exerciseLibrary';
import { completeJson, isAiEnabled } from './openaiClient';

export type FollowUpQuestion = {
  id: string;
  type: 'single' | 'multi';
  question: string;
  options: { id: string; label: string }[];
};

export type FollowUpQuestionsResult = {
  source: 'ai' | 'static';
  questions: FollowUpQuestion[];
};

const QUESTIONS_SCHEMA = {
  name: 'onboarding_questions',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['questions'],
    properties: {
      questions: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'type', 'question', 'options'],
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: ['single', 'multi'] },
            question: { type: 'string' },
            options: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['id', 'label'],
                properties: {
                  id: { type: 'string' },
                  label: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },
};

const STATIC_QUESTIONS_EN: FollowUpQuestion[] = [
  {
    id: 'focus-areas',
    type: 'multi',
    question: 'Which areas would you like your plan to focus on?',
    options: [
      { id: 'core', label: 'Core and abs' },
      { id: 'lower', label: 'Legs and glutes' },
      { id: 'upper', label: 'Arms and upper body' },
      { id: 'cardio', label: 'Cardio and endurance' },
      { id: 'mobility', label: 'Flexibility and mobility' },
    ],
  },
  {
    id: 'sensitivities',
    type: 'multi',
    question: 'Do any of these areas feel sensitive during exercise?',
    options: [
      { id: 'none', label: 'No sensitivities' },
      { id: 'knees', label: 'Knees' },
      { id: 'lower-back', label: 'Lower back' },
      { id: 'shoulders', label: 'Shoulders' },
      { id: 'wrists', label: 'Wrists' },
    ],
  },
  {
    id: 'variety',
    type: 'single',
    question: 'How much variety do you want in your workouts?',
    options: [
      { id: 'routine', label: 'A steady routine I can master' },
      { id: 'mixed', label: 'A balanced mix' },
      { id: 'fresh', label: 'Something new every day' },
    ],
  },
];

const STATIC_QUESTIONS_HE: FollowUpQuestion[] = [
  {
    id: 'focus-areas',
    type: 'multi',
    question: 'על אילו אזורים תרצו שהתוכנית תתמקד?',
    options: [
      { id: 'core', label: 'ליבה ובטן' },
      { id: 'lower', label: 'רגליים וישבן' },
      { id: 'upper', label: 'ידיים ופלג גוף עליון' },
      { id: 'cardio', label: 'אירובי וסיבולת' },
      { id: 'mobility', label: 'גמישות וניידות' },
    ],
  },
  {
    id: 'sensitivities',
    type: 'multi',
    question: 'האם אחד מהאזורים הבאים רגיש בזמן פעילות?',
    options: [
      { id: 'none', label: 'אין רגישויות' },
      { id: 'knees', label: 'ברכיים' },
      { id: 'lower-back', label: 'גב תחתון' },
      { id: 'shoulders', label: 'כתפיים' },
      { id: 'wrists', label: 'שורשי כף היד' },
    ],
  },
  {
    id: 'variety',
    type: 'single',
    question: 'כמה גיוון תרצו באימונים?',
    options: [
      { id: 'routine', label: 'שגרה קבועה שאפשר לשלוט בה' },
      { id: 'mixed', label: 'שילוב מאוזן' },
      { id: 'fresh', label: 'משהו חדש כל יום' },
    ],
  },
];

const clean = (value: unknown, maxLength: number) =>
  String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .trim()
    .slice(0, maxLength);

const sanitizeQuestions = (raw: FollowUpQuestion[]): FollowUpQuestion[] =>
  raw
    .slice(0, 5)
    .map((question, index) => ({
      id: clean(question.id, 40) || `q${index + 1}`,
      type: (question.type === 'multi' ? 'multi' : 'single') as 'single' | 'multi',
      question: clean(question.question, 200),
      options: (question.options || []).slice(0, 6).map((option, optionIndex) => ({
        id: clean(option.id, 40) || `o${optionIndex + 1}`,
        label: clean(option.label, 120),
      })),
    }))
    .filter((question) => question.question.length > 0 && question.options.length >= 2);

export type CoreAnswers = {
  mainGoal: string;
  fitnessLevel: string;
  dailyTimeGoal: number;
  language: ExerciseLanguage;
};

export const staticFollowUpQuestions = (language: ExerciseLanguage): FollowUpQuestionsResult => ({
  source: 'static',
  questions: language === 'he' ? STATIC_QUESTIONS_HE : STATIC_QUESTIONS_EN,
});

export const generateFollowUpQuestions = async (core: CoreAnswers): Promise<FollowUpQuestionsResult> => {
  if (!isAiEnabled()) {
    return staticFollowUpQuestions(core.language);
  }

  const responseLanguage = core.language === 'he' ? 'Hebrew' : 'English';
  try {
    const result = await completeJson<{ questions: FollowUpQuestion[] }>({
      system: [
        'You are a fitness coach onboarding a new user of a Duolingo-style workout app.',
        'Generate 3 to 5 short follow-up questions that will meaningfully improve a personalized bodyweight/home training plan.',
        'Rules:',
        '- Multiple-choice only: each question has 3 to 6 concise options.',
        '- Use type "multi" only when several answers can apply (e.g. sensitive joints, focus areas).',
        '- Ask about things the core answers do not already cover: injuries/sensitive areas, focus areas, workout style, schedule, experience with specific movements.',
        '- Never ask for medical diagnoses or personal identifying details.',
        `- Write every question and option in ${responseLanguage}.`,
      ].join('\n'),
      user: [
        'Core onboarding answers:',
        `- Main goal: ${clean(core.mainGoal, 120)}`,
        `- Fitness level: ${clean(core.fitnessLevel, 60)}`,
        `- Daily time budget: ${core.dailyTimeGoal} minutes`,
        '',
        'Generate the follow-up questions now.',
      ].join('\n'),
      schema: QUESTIONS_SCHEMA,
      validate: (value) => (sanitizeQuestions(value.questions || []).length >= 3 ? null : 'Return at least 3 valid questions, each with at least 2 options.'),
      maxRetries: 1,
    });

    const questions = sanitizeQuestions(result.questions);
    if (questions.length < 3) {
      return staticFollowUpQuestions(core.language);
    }
    return { source: 'ai', questions };
  } catch (error: any) {
    console.error('[onboardingQuestions] falling back to static questions', {
      message: String(error?.message || error).slice(0, 200),
    });
    return staticFollowUpQuestions(core.language);
  }
};
