'use client';

import React, { useState } from 'react';
import { QuestionRenderer } from './QuestionRenderer';
import { OptionGroup } from './OptionGroup';
import { ControlBar } from './ControlBar';
import { useAssessmentStore } from '../hooks/useAssessmentStore';
import { recordResponse as apiRecordResponse } from '../utils/api';
import { getSectionFromDomain } from '../utils/questionParser';

interface StudySessionProps {
  onExit?: () => void;
}

export function StudySession({ onExit }: StudySessionProps) {
  const {
    questions,
    currentQuestionIndex,
    sessionId,
    getProgress,
    getCurrentQuestion,
    recordResponse,
    moveToNextQuestion,
    moveToQuestion,
  } = useAssessmentStore();

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  const currentQuestion = getCurrentQuestion();
  const progress = getProgress();

  if (!sessionStarted) {
    return (
      <div className="h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
        <div className="card max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Study Mode</h2>
          <p className="text-gray-600 mb-6">
            Learn at your own pace with immediate feedback on your answers.
          </p>
          <button
            onClick={() => setSessionStarted(true)}
            className="btn-primary w-full mb-2"
          >
            Start Studying
          </button>
          {onExit && (
            <button onClick={onExit} className="btn-secondary w-full">
              Back to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  if (sessionComplete || !currentQuestion) {
    return (
      <div className="h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
        <div className="card max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Study Complete!</h2>
          <p className="text-gray-600 mb-6">You&apos;ve reviewed all available questions.</p>
          {onExit && (
            <button onClick={onExit} className="btn-primary w-full">
              Back to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleCheckAnswer = () => {
    if (!selectedAnswer) return;
    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    recordResponse({
      questionId: currentQuestion.id,
      userAnswer: selectedAnswer,
      isCorrect,
      timeSpentSeconds: 0,
    });
    if (sessionId) {
      apiRecordResponse(
        sessionId,
        currentQuestion.id,
        selectedAnswer,
        currentQuestion.correct_answer,
        isCorrect,
        0,
        getSectionFromDomain(currentQuestion.domain),
        currentQuestion.domain
      ).catch(() => {});
    }
    setShowExplanation(true);
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    if (currentQuestionIndex >= questions.length - 1) {
      setSessionComplete(true);
    } else {
      moveToNextQuestion();
    }
  };

  const handlePrevious = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    if (currentQuestionIndex > 0) {
      moveToQuestion(currentQuestionIndex - 1);
    }
  };

  const choices = [
    { label: `A. ${currentQuestion.choices.A}`, value: 'A' },
    { label: `B. ${currentQuestion.choices.B}`, value: 'B' },
    { label: `C. ${currentQuestion.choices.C}`, value: 'C' },
    { label: `D. ${currentQuestion.choices.D}`, value: 'D' },
  ];

  const canCheck = !!selectedAnswer && !showExplanation;

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 overflow-y-auto min-h-0 max-w-4xl mx-auto w-full p-6">
        <QuestionRenderer question={currentQuestion} showExplanation={showExplanation} />

        <div className="mt-2 space-y-4">
          <OptionGroup
            options={choices}
            selectedValue={selectedAnswer}
            onSelect={setSelectedAnswer}
            disabled={showExplanation}
            correctAnswer={showExplanation ? currentQuestion.correct_answer : undefined}
            showCorrect={showExplanation}
            userAnswer={selectedAnswer}
          />
        </div>
      </div>

      <ControlBar
        mode="study"
        currentQuestion={progress.current}
        totalQuestions={progress.total}
        onCheckAnswer={!showExplanation ? handleCheckAnswer : undefined}
        onNext={showExplanation ? handleNext : undefined}
        onPrevious={handlePrevious}
        canCheckAnswer={canCheck}
        canNext={showExplanation}
        canPrevious={currentQuestionIndex > 0}
      />
    </div>
  );
}
