import { QuizQuestion } from '../types/quiz';

/**
 * HARD TRIAL — PROGRAMMING & OPEN SOURCE
 * ======================================
 * Transcribed from "docs/Hard_Level_Questions (1).pdf" (Section A).
 *
 * Questions only — Section B (the answer key) is deliberately NOT stored here
 * (or anywhere in the client bundle). Grade submissions against the PDF key.
 *
 * Inline formatting: *bold*, `code`.
 */
export const HARD_QUIZ: readonly QuizQuestion[] = [
  {
    id: 'q1',
    kind: 'written',
    section: 'Section A · Programming & Open Source',
    title: 'Emoji → Programming Language',
    context: [
      {
        type: 'emojis',
        items: [
          { label: '(a)', emoji: '☕' },
          { label: '(b)', emoji: '💎' },
          { label: '(c)', emoji: '🐹' },
          { label: '(d)', emoji: '🐦' },
          { label: '(e)', emoji: '🐪' },
        ],
      },
    ],
    question: 'Name the programming language each emoji represents.',
    placeholder: '(a) …\n(b) …\n(c) …\n(d) …\n(e) …',
  },
  {
    id: 'q2',
    kind: 'written',
    section: 'Section A · Programming & Open Source',
    title: 'Who Am I?',
    context: [
      {
        type: 'text',
        value:
          "I started a hobby project in 1991 that now runs most of the world's servers and Android phones. I also created the version control tool everyone uses on GitHub.",
      },
    ],
    question: 'Who am I, and what are the two creations?',
  },
  {
    id: 'q3',
    kind: 'written',
    section: 'Section A · Programming & Open Source',
    title: 'Switch Puzzle',
    context: [
      {
        type: 'text',
        value:
          'Three switches outside a closed room control three bulbs inside. You can enter the room *only once*.',
      },
    ],
    question: 'How do you find which switch controls which bulb?',
  },
  {
    id: 'q4',
    kind: 'written',
    section: 'Section A · Programming & Open Source',
    title: 'The Binary Search That Never Ends (Python)',
    context: [
      { type: 'text', value: 'This code has *two bugs*.' },
      {
        type: 'code',
        value: [
          'def binary_search(arr, target):',
          '    low, high = 0, len(arr) - 1',
          '    while low < high:',
          '        mid = (low + high) // 2',
          '        if arr[mid] == target:',
          '            return mid',
          '        elif arr[mid] < target:',
          '            low = mid',
          '        else:',
          '            high = mid',
          '    return -1',
        ].join('\n'),
      },
    ],
    question:
      'Find both bugs, and give an input where the code hangs and another where it returns the wrong answer.',
  },
  {
    id: 'q5',
    kind: 'written',
    section: 'Section A · Programming & Open Source',
    title: 'License Detective',
    context: [
      {
        type: 'table',
        headers: ['License', 'Key feature'],
        rows: [
          ['MIT', 'A. Anyone who modifies it and offers it as a network service must share their source'],
          ['GPL v3', 'B. Very short and permissive, only requires keeping the copyright notice'],
          ['Apache 2.0', 'C. Derivative works that are distributed must also be GPL (copyleft)'],
          ['AGPL', 'D. Permissive, but with an explicit patent grant'],
        ],
      },
    ],
    question: 'Match each license to its key feature.',
    placeholder: 'MIT → …\nGPL v3 → …\nApache 2.0 → …\nAGPL → …',
  },
];
