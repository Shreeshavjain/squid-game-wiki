import { QuizQuestion } from '../types/quiz';

/**
 * MEDIUM TRIAL — OPEN SOURCE & TECH CHALLENGE
 * ===========================================
 * Transcribed from docs/Medium_quiz_final.pdf.
 *
 * Questions and options only — the answer key is deliberately NOT stored here
 * (or anywhere in the client bundle). Grade submissions against the PDF key.
 *
 * Inline formatting: *bold*, `code`.
 */
export const MEDIUM_QUIZ: readonly QuizQuestion[] = [
  {
    id: 'q1',
    kind: 'mcq',
    section: 'Part 1 · Think carefully (Git & Linux)',
    title: 'Git — Think Carefully',
    context: [
      { type: 'text', value: 'You have a Git repository with this history:' },
      { type: 'code', value: 'A → B → C' },
      { type: 'text', value: 'You create a new branch at C:' },
      { type: 'code', value: 'git branch feature' },
      { type: 'text', value: 'Then you make *2 commits on feature*. After that, you switch back to main.' },
    ],
    question: 'How many commits does main have compared to feature?',
    options: [
      { key: 'A', text: '`main` has 2 more commits' },
      { key: 'B', text: '`feature` has 2 more commits' },
      { key: 'C', text: 'Both have the same number of commits' },
      { key: 'D', text: 'The commits disappear when switching branches' },
    ],
  },
  {
    id: 'q2',
    kind: 'mcq',
    section: 'Part 1 · Think carefully (Git & Linux)',
    title: 'Linux — Who Has Access?',
    context: [
      { type: 'text', value: 'A file has the following permissions:' },
      { type: 'code', value: '-rw-r-----' },
      {
        type: 'text',
        value:
          'The file owner is *Alice* and the group is *developers*. Bob is a member of the developers group. Charlie is neither the owner nor a member of the group.',
      },
    ],
    question: 'Who can modify the file?',
    options: [
      { key: 'A', text: 'Alice only' },
      { key: 'B', text: 'Alice and Bob' },
      { key: 'C', text: 'Alice, Bob and Charlie' },
      { key: 'D', text: 'Bob only' },
    ],
  },
  {
    id: 'q3',
    kind: 'mcq',
    section: 'Part 2 · GitHub contribution workflow',
    title: 'Contributing a Fix',
    context: [],
    question:
      'You find a bug in an open-source project on GitHub. Which sequence makes the *most sense* if you want to contribute a fix?',
    options: [
      { key: 'A', text: '`Fork → Clone → Modify → Commit → Push → Pull Request`' },
      { key: 'B', text: '`Clone → Delete → Push → Fork → Pull Request`' },
      { key: 'C', text: '`Fork → Pull Request → Modify → Clone → Delete`' },
      { key: 'D', text: '`Push → Fork → Clone → Commit → Delete`' },
    ],
  },
  {
    id: 'q4',
    kind: 'mcq',
    section: 'Part 3 · Core concepts',
    title: 'CI/CD',
    context: [],
    question: 'What does CI/CD stand for in modern software engineering deployment pipelines?',
    options: [
      { key: 'A', text: 'Code Integration / Code Debug' },
      { key: 'B', text: 'Continuous Integration / Delivery' },
      { key: 'C', text: 'Compiled Input / Core Database' },
      { key: 'D', text: 'Central Instance / Cloud Data' },
    ],
  },
  {
    id: 'q5',
    kind: 'mcq',
    section: 'Part 3 · Core concepts',
    title: 'Secure Communication',
    context: [],
    question:
      'Which cryptographic protocol secures encrypted communication over computer networks (HTTPS)?',
    options: [
      { key: 'A', text: 'FTP Protocol' },
      { key: 'B', text: 'SSH Protocol' },
      { key: 'C', text: 'TLS / SSL' },
      { key: 'D', text: 'Telnet Service' },
    ],
  },
];
