'use client';

import React, { Suspense } from 'react';
import { EASY_QUIZ } from '../../data/easyQuiz';
import { DIFFICULTY_TIERS } from '../../data/difficultyTiers';
import { QuizRunner } from '../../components/QuizRunner';

const EASY_TIER = DIFFICULTY_TIERS.find((t) => t.id === 'easy')!;

export default function EasyQuizPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07070a]" />}>
      <QuizRunner
        tier={{ ...EASY_TIER, id: 'easy' }}
        quizTitle="Open Source Buzzwords Challenge"
        questions={EASY_QUIZ}
        scoreEndpoint="/api/quiz/easy/score"
        allowSkip
      />
    </Suspense>
  );
}
