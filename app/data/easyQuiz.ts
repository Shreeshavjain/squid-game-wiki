import { QuizQuestion } from '../types/quiz';

/**
 * EASY TRIAL — OPEN SOURCE BUZZWORDS CHALLENGE
 * ============================================
 * Transcribed from "docs/easy level.pdf".
 *
 * Questions and hints only — the answer key is deliberately NOT stored here
 * (or anywhere in the client bundle). Grade submissions against the PDF key.
 */
export const EASY_QUIZ: readonly QuizQuestion[] = [
  // ── Part 1: Advanced emoji decoder ──
  {
    id: 'q1',
    kind: 'emoji',
    section: 'Part 1 · Advanced emoji decoder',
    emojis: ['☕', '🐬', '🗄️'],
    category: 'Database System',
    hint: 'The world\'s most popular open-source relational database management system, whose famous logo mascot is "Sakila" the dolphin.',
  },
  {
    id: 'q2',
    kind: 'emoji',
    section: 'Part 1 · Advanced emoji decoder',
    emojis: ['🟢', '🪢', '⚡'],
    category: 'JS Runtime',
    hint: "A ubiquitous open-source, asynchronous event-driven JavaScript runtime built on Chrome's V8 engine to execute code server-side.",
  },
  {
    id: 'q3',
    kind: 'emoji',
    section: 'Part 1 · Advanced emoji decoder',
    emojis: ['🐋', '📦', '🚢'],
    category: 'DevOps & Containers',
    hint: 'The industry-standard open platform for building, shipping, and running applications inside isolated lightweight containers.',
  },
  {
    id: 'q4',
    kind: 'emoji',
    section: 'Part 1 · Advanced emoji decoder',
    emojis: ['🦙', '🧠', '🦙'],
    category: 'Open AI Model',
    hint: 'The groundbreaking open-weights family of foundational large language models released by Meta to accelerate open AI research.',
  },
  {
    id: 'q5',
    kind: 'emoji',
    section: 'Part 1 · Advanced emoji decoder',
    emojis: ['⚓', '☸️', '🛸'],
    category: 'Orchestration',
    hint: 'An open-source container orchestration engine originally created by Google, named after the ancient Greek word for "helmsman" or "pilot."',
  },

  // ── Part 2: Word unscramble ──
  {
    id: 'q6',
    kind: 'unscramble',
    section: 'Part 2 · Word unscramble',
    letters: ['X', 'U', 'N', 'I', 'L'],
    hint: 'The world\'s most dominant open-source operating system kernel, symbolized by Tux the penguin and created by Linus Torvalds.',
  },
  {
    id: 'q7',
    kind: 'unscramble',
    section: 'Part 2 · Word unscramble',
    letters: ['K', 'R', 'O', 'F'],
    hint: 'Creating an independent server-side copy of an existing project repository to begin new, distinct development.',
  },
  {
    id: 'q8',
    kind: 'unscramble',
    section: 'Part 2 · Word unscramble',
    letters: ['M', 'O', 'C', 'T', 'I', 'M'],
    hint: "The primary action that saves a staged snapshot of changes into the project's permanent Git version history.",
  },
  {
    id: 'q9',
    kind: 'unscramble',
    section: 'Part 2 · Word unscramble',
    letters: ['H', 'N', 'C', 'A', 'R', 'B'],
    hint: 'A parallel line of development within a Git repository that allows working on new features without touching main code.',
  },
  {
    id: 'q10',
    kind: 'unscramble',
    section: 'Part 2 · Word unscramble',
    letters: ['E', 'G', 'R', 'E', 'M'],
    hint: 'Integrating the histories and commits from one branch into another (e.g., combining a feature branch into main).',
  },
];
