'use client';

import React, { Suspense } from 'react';
import { HARD_QUIZ } from '../../data/hardQuiz';
import { DIFFICULTY_TIERS } from '../../data/difficultyTiers';
import { QuizRunner } from '../../components/QuizRunner';

const HARD_TIER = DIFFICULTY_TIERS.find((t) => t.id === 'hard')!;

export default function HardQuizPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07070a]" />}>
      <QuizRunner
        tier={{ ...HARD_TIER, id: 'hard' }}
        quizTitle="Programming & Open Source"
        questions={HARD_QUIZ}
        scoreEndpoint="/api/quiz/hard/score"
      />
    </Suspense>
  );
}
