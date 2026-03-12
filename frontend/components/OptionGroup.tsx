'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Option {
  label: string;
  value: string;
}

interface OptionGroupProps {
  options: Option[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  disabled?: boolean;
  correctAnswer?: string;
  showCorrect?: boolean;
  userAnswer?: string | null;
  // Multi-select mode
  multiSelect?: boolean;
  selectedValues?: string[];
  onSelectMultiple?: (values: string[]) => void;
  userAnswers?: string[];
}

export function OptionGroup({
  options,
  selectedValue,
  onSelect,
  disabled = false,
  correctAnswer,
  showCorrect = false,
  userAnswer,
  multiSelect = false,
  selectedValues = [],
  onSelectMultiple,
  userAnswers = [],
}: OptionGroupProps) {
  const MathLabel = ({ text }: { text: string }) => (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: 'ignore' }], rehypeRaw]}
      components={{ p: ({ children }) => <span>{children}</span> }}
    >
      {text}
    </ReactMarkdown>
  );

  const handleMultiClick = (value: string) => {
    if (!onSelectMultiple) return;
    if (selectedValues.includes(value)) {
      onSelectMultiple(selectedValues.filter((v) => v !== value));
    } else {
      onSelectMultiple([...selectedValues, value]);
    }
  };

  return (
    <div className="space-y-2">
      {options.map((option) => {
        const isCorrect = correctAnswer === option.value;

        let buttonClass = 'option-button border-gray-300';

        if (multiSelect) {
          const isChecked = selectedValues.includes(option.value);
          const wasSelected = userAnswers.includes(option.value);

          if (showCorrect) {
            if (isCorrect) {
              buttonClass = 'option-button correct';
            } else if (wasSelected && !isCorrect) {
              buttonClass = 'option-button incorrect';
            }
          } else if (isChecked) {
            buttonClass = 'option-button selected';
          }

          return (
            <button
              key={option.value}
              onClick={() => !disabled && handleMultiClick(option.value)}
              disabled={disabled}
              className={`${buttonClass} ${disabled ? 'opacity-75' : 'hover:border-blue-500'} flex items-center gap-3`}
            >
              <span className={`w-4 h-4 border-2 rounded flex-shrink-0 flex items-center justify-center ${isChecked || (showCorrect && isCorrect) ? 'border-current' : 'border-gray-400'}`}>
                {(isChecked || (showCorrect && isCorrect)) && (
                  <span className="w-2 h-2 bg-current rounded-sm block" />
                )}
              </span>
              <MathLabel text={option.label} />
            </button>
          );
        }

        const isSelected = selectedValue === option.value;
        const isUserAnswer = userAnswer === option.value;

        if (showCorrect) {
          if (isCorrect) {
            buttonClass = 'option-button correct';
          } else if (isUserAnswer && !isCorrect) {
            buttonClass = 'option-button incorrect';
          }
        } else if (isSelected) {
          buttonClass = 'option-button selected';
        }

        return (
          <button
            key={option.value}
            onClick={() => !disabled && onSelect(option.value)}
            disabled={disabled}
            className={`${buttonClass} ${disabled ? 'opacity-75' : 'hover:border-blue-500'}`}
          >
            <MathLabel text={option.label} />
          </button>
        );
      })}
    </div>
  );
}
