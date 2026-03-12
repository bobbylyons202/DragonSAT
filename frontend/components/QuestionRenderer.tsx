'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { ParsedQuestion } from '../utils/questionParser';

interface QuestionRendererProps {
  question: ParsedQuestion;
  showExplanation?: boolean;
}

export function QuestionRenderer({
  question,
  showExplanation = false,
}: QuestionRendererProps) {
  return (
    <div className="space-y-6">
      {/* Domain and Difficulty Badge */}
      <div className="flex gap-2">
        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          {question.domain}
        </span>
        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
          {question.difficulty}
        </span>
      </div>

      {/* Paragraph (if exists) */}
      {question.paragraph && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border-l-4 border-blue-500">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: 'ignore' }], rehypeRaw]}
            className="markdown text-gray-700 dark:text-gray-300"
          >
            {question.paragraph}
          </ReactMarkdown>
        </div>
      )}

      {/* Question */}
      <div className="text-lg text-gray-900 dark:text-gray-100">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: 'ignore' }], rehypeRaw]}
          className="markdown"
        >
          {question.question}
        </ReactMarkdown>
      </div>

      {/* Choices */}
      <div className="space-y-3">
        {['A', 'B', 'C', 'D'].map((choice) => (
          <div key={choice} className="text-base text-gray-900 dark:text-gray-100">
            <strong>{choice}.</strong>{' '}
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: 'ignore' }], rehypeRaw]}
              className="markdown inline"
            >
              {question.choices[choice as keyof typeof question.choices]}
            </ReactMarkdown>
          </div>
        ))}
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border-l-4 border-green-500">
          <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">Explanation:</h4>
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: 'ignore' }], rehypeRaw]}
            className="markdown text-green-800 dark:text-green-300"
          >
            {question.explanation}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
