'use client';

import React, { Suspense } from 'react';
import { MEDIUM_QUIZ } from '../../data/mediumQuiz';
import { DIFFICULTY_TIERS } from '../../data/difficultyTiers';
import { QuizRunner } from '../../components/QuizRunner';

const MEDIUM_TIER = DIFFICULTY_TIERS.find((t) => t.id === 'medium')!;

export default function MediumQuizPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07070a]" />}>
      <QuizRunner
        tier={{ ...MEDIUM_TIER, id: 'medium' }}
        quizTitle="Open Source & Tech Challenge"
        questions={MEDIUM_QUIZ}
        scoreEndpoint="/api/quiz/medium/score"
      />
    </Suspense>
  );
}
