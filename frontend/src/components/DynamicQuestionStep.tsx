import React from 'react';

export type DynamicQuestion = {
  id: string;
  type: 'single' | 'multi';
  question: string;
  options: { id: string; label: string }[];
};

type DynamicQuestionStepProps = {
  question: DynamicQuestion;
  selectedIds: string[];
  onToggle: (optionId: string) => void;
  isHebrew: boolean;
  kicker: string;
  copy: string;
};

// Generic renderer for one AI-generated onboarding question.
// Question and option labels arrive already localized — render them raw.
const DynamicQuestionStep: React.FC<DynamicQuestionStepProps> = ({
  question,
  selectedIds,
  onToggle,
  isHebrew,
  kicker,
  copy,
}) => (
  <div>
    <p className="text-sm font-black uppercase tracking-wide text-primary">{kicker}</p>
    <h1 className="mt-2 text-2xl font-black sm:text-3xl">{question.question}</h1>
    <p className="mt-2 text-sm text-slate-500">{copy}</p>
    <div className="mt-5 grid gap-3">
      {question.options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onToggle(option.id)}
          className={`choice-button ${isHebrew ? 'text-right' : 'text-left'} ${selectedIds.includes(option.id) ? 'choice-button-active' : ''}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
);

export default DynamicQuestionStep;
