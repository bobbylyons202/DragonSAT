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
import { calculateQuizTime, isTimeWarning } from '../utils/timing';
import { playTimerWarning, playTimerExpired } from '../utils/sounds';

interface QuizSessionProps {
  onComplete?: (score: number, total: number, correct: number) => void;
  onExit?: () => void;
}

export function QuizSession({ onComplete, onExit }: QuizSessionProps) {
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
  const warningPlayedRef = useRef(false);

  const quizTime = calculateQuizTime(questions.length);
  const { timeRemaining, start, pause } = useTimer({
    initialSeconds: quizTime,
    onTick: updateTimeRemaining,
    onExpire: () => {
      if (soundEffectsRef.current) playTimerExpired();
      handleTimeExpired();
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

  const handleTimeExpired = () => {
    if (currentQuestionIndex < questions.length - 1) {
      moveToNextQuestion();
    } else {
      finishQuiz();
    }
  };

  const handleNext = () => {
    if (!selectedAnswer) return;

    const userAnswer = selectedAnswer;
    const isCorrect = selectedAnswer === currentQuestion!.correct_answer;

    recordResponse({
      questionId: currentQuestion!.id,
      userAnswer,
      isCorrect,
      timeSpentSeconds: 0,
    });
    if (sessionId) {
      apiRecordResponse(
        sessionId,
        currentQuestion!.id,
        userAnswer,
        currentQuestion!.correct_answer,
        isCorrect,
        0,
        getSectionFromDomain(currentQuestion!.domain),
        currentQuestion!.domain
      ).catch(() => {});
    }

    if (currentQuestionIndex < questions.length - 1) {
      moveToNextQuestion();
      setSelectedAnswer(null);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    pause();
    const correct = getCorrectCount();
    const total = questions.length;
    const score = (correct / total) * 100;
    if (onComplete) onComplete(score, total, correct);
  };

  if (!sessionStarted) {
    return (
      <div className="h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
        <div className="card max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Quiz Mode</h2>
          <p className="text-gray-600 mb-2">
            Practice with a timer - {Math.ceil(quizTime / 60)} minutes for {questions.length} questions
          </p>
          <p className="text-gray-600 mb-6">Immediate feedback only at the end of the quiz.</p>
          <button onClick={() => { setSessionStarted(true); start(); }} className="btn-primary w-full mb-2">
            Start Quiz
          </button>
          {onExit && (
            <button onClick={onExit} className="btn-secondary w-full">Back to Dashboard</button>
          )}
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
        <div className="card max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Quiz Complete!</h2>
          <p className="text-gray-600 mb-6">Check your results on the next screen.</p>
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

  const canNext = !!selectedAnswer;

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 overflow-y-auto min-h-0 max-w-4xl mx-auto w-full p-6">
        <QuestionRenderer question={currentQuestion} />
        <div className="mt-2 space-y-4">
          <OptionGroup options={choices} selectedValue={selectedAnswer} onSelect={setSelectedAnswer} disabled={false} />
        </div>
      </div>
      <ControlBar
        mode="quiz"
        timeRemaining={timeRemaining}
        showTimer={showTimer}
        currentQuestion={progress.current}
        totalQuestions={progress.total}
        onNext={handleNext}
        canNext={canNext}
      />
    </div>
  );
}
