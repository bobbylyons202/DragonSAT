'use client';

import React, { useEffect, useRef } from 'react';
import { QuestionRenderer } from './QuestionRenderer';
import { OptionGroup } from './OptionGroup';
import { ControlBar } from './ControlBar';
import { useAssessmentStore } from '../hooks/useAssessmentStore';
import { useSettingsStore } from '../hooks/useSettingsStore';
import { recordResponse as apiRecordResponse } from '../utils/api';
import { getSectionFromDomain } from '../utils/questionParser';
import { useTimer } from '../hooks/useTimer';
import { calculateTestTime, isTimeExpired, isTimeWarning } from '../utils/timing';
import { playTimerWarning, playTimerExpired } from '../utils/sounds';

interface TestSessionProps {
  onComplete?: (score: number, total: number, correct: number) => void;
  onExit?: () => void;
}

export function TestSession({ onComplete, onExit }: TestSessionProps) {
  const {
    questions,
    currentQuestionIndex,
    sessionId,
    getProgress,
    getCurrentQuestion,
    recordResponse,
    moveToNextQuestion,
    getCorrectCount,
    updateTimeRemaining,
  } = useAssessmentStore();

  const { showTimer, soundEffects } = useSettingsStore();
  const soundEffectsRef = useRef(soundEffects);
  useEffect(() => { soundEffectsRef.current = soundEffects; }, [soundEffects]);

  const [selectedAnswer, setSelectedAnswer] = React.useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = React.useState(false);
  const [reviewMode, setReviewMode] = React.useState(false);
  const warningPlayedRef = useRef(false);

  const testTime = calculateTestTime(questions.length);
  const { timeRemaining, start, pause } = useTimer({
    initialSeconds: testTime,
    onTick: updateTimeRemaining,
    onExpire: () => {
      if (soundEffectsRef.current) playTimerExpired();
      pause();
      finishTest();
    },
    autoStart: false,
  });

  useEffect(() => {
    if (sessionStarted && isTimeWarning(timeRemaining) && !warningPlayedRef.current && soundEffectsRef.current) {
      warningPlayedRef.current = true;
      playTimerWarning();
    }
  }, [timeRemaining, sessionStarted]);

  const currentQuestion = getCurrentQuestion();
  const progress = getProgress();

  const persistResponse = (answer: string) => {
    const isCorrect = answer === currentQuestion!.correct_answer;
    recordResponse({
      questionId: currentQuestion!.id,
      userAnswer: answer,
      isCorrect,
      timeSpentSeconds: 0,
    });
    if (sessionId) {
      apiRecordResponse(
        sessionId,
        currentQuestion!.id,
        answer,
        currentQuestion!.correct_answer,
        isCorrect,
        0,
        getSectionFromDomain(currentQuestion!.domain),
        currentQuestion!.domain
      ).catch(() => {});
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      if (selectedAnswer) persistResponse(selectedAnswer);
      moveToNextQuestion();
      setSelectedAnswer(null);
    } else {
      if (selectedAnswer) persistResponse(selectedAnswer);
      setReviewMode(true);
    }
  };

  const finishTest = () => {
    const correct = getCorrectCount();
    const total = questions.length;
    const score = (correct / total) * 100;
    if (onComplete) onComplete(score, total, correct);
  };

  if (!sessionStarted) {
    return (
      <div className="h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
        <div className="card max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Test Mode</h2>
          <p className="text-gray-600 mb-2">
            Full SAT simulation - {Math.ceil(testTime / 60)} minutes for {questions.length} questions
          </p>
          <p className="text-gray-600 mb-2 text-sm">⚠️ Time runs out automatically - you can&apos;t pause or go back.</p>
          <p className="text-gray-600 mb-6 text-sm">Final score and review available after submission.</p>
          <button onClick={() => { setSessionStarted(true); start(); }} className="btn-primary w-full mb-2">
            Begin Test
          </button>
          {onExit && (
            <button onClick={onExit} className="btn-secondary w-full">Back to Dashboard</button>
          )}
        </div>
      </div>
    );
  }

  if (reviewMode) {
    return (
      <div className="h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
        <div className="card max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Test Complete!</h2>
          <p className="text-gray-600 mb-6">Review your answers or submit for scoring.</p>
          <button onClick={finishTest} className="btn-primary w-full">View Results</button>
        </div>
      </div>
    );
  }

  if (!currentQuestion || isTimeExpired(timeRemaining)) {
    return (
      <div className="h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
        <div className="card max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Time&apos;s Up!</h2>
          <p className="text-gray-600 mb-6">Your test has been submitted automatically.</p>
        </div>
      </div>
    );
  }

  const choices = [
    { label: `A. ${currentQuestion.choices.A}`, value: 'A' },
    { label: `B. ${currentQuestion.choices.B}`, value: 'B' },
    { label: `C. ${currentQuestion.choices.C}`, value: 'C' },
    { label: `D. ${currentQuestion.choices.D}`, value: 'D' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 overflow-y-auto min-h-0 max-w-4xl mx-auto w-full p-6">
        <QuestionRenderer question={currentQuestion} />
        <div className="mt-2 space-y-4">
          <OptionGroup options={choices} selectedValue={selectedAnswer} onSelect={setSelectedAnswer} disabled={false} />
        </div>
      </div>
      <ControlBar
        mode="test"
        timeRemaining={timeRemaining}
        showTimer={showTimer}
        currentQuestion={progress.current}
        totalQuestions={progress.total}
        onNext={handleNext}
        canNext={true}
      />
    </div>
  );
}
