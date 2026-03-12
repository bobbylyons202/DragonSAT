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
}

export function OptionGroup({
  options,
  selectedValue,
  onSelect,
  disabled = false,
  correctAnswer,
  showCorrect = false,
  userAnswer,
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

  return (
    <div className="space-y-2">
      {options.map((option) => {
        const isCorrect = correctAnswer === option.value;

        let buttonClass = 'option-button border-gray-300';

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
