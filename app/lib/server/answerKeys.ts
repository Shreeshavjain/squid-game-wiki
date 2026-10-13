import 'server-only';

/**
 * ANSWER KEYS — SERVER ONLY
 * =========================
 * `server-only` makes the build fail if this file is ever imported from client
 * code, so the keys never reach the browser bundle (and can't be found with
 * Inspect). Scoring happens in the /api/quiz/<tier>/score route handlers.
 */
export const MEDIUM_ANSWER_KEY: Readonly<Record<string, string>> = {
  q1: 'B',
  q2: 'A',
  q3: 'A',
  q4: 'B',
  q5: 'C',
};

/**
 * Easy is typed, so each question lists accepted keywords instead of one
 * option. An answer is correct when it contains any of them, ignoring case.
 */
export const EASY_ANSWER_KEY: Readonly<Record<string, readonly string[]>> = {
  q1: ['mysql', 'mariadb'],
  q2: ['nodejs', 'node.js'],
  q3: ['docker'],
  q4: ['llama'],
  q5: ['kubernetes', 'k8s'],
  q6: ['linux'],
  q7: ['fork'],
  q8: ['commit'],
  q9: ['branch'],
  q10: ['merge'],
};

/**
 * HARD TRIAL OFFICIAL ANSWER REFERENCE & EVALUATION (SERVER-ONLY)
 * =============================================================
 * From "docs/Hard_Level_Questions (1).pdf" Section B (Answer Key).
 *
 * Q1: (a) Java, (b) Ruby, (c) Go, (d) Swift, (e) Perl
 * Q2: Linus Torvalds; Linux and Git
 * Q3: Turn switch 1 on (wait ~10 min), turn 1 off, turn 2 on;
 *     Bulb on = Switch 2, Bulb off but warm = Switch 1, Bulb off and cold = Switch 3
 * Q4: Bug 1: low = mid and high = mid (infinite loop) -> low = mid + 1, high = mid - 1
 *     Bug 2: while low < high (skips last element) -> while low <= high
 *     Hangs: binary_search([1, 3, 5, 7], 7)
 *     Wrong: binary_search([5], 5)
 * Q5: MIT -> B, GPL v3 -> C, Apache 2.0 -> D, AGPL -> A
 */
export const HARD_QUESTION_IDS = ['q1', 'q2', 'q3', 'q4', 'q5'] as const;

export function evaluateHardAnswer(id: string, rawAnswer: string): { correct: boolean; skipped?: boolean } {
  const answer = rawAnswer.trim().toLowerCase();
  if (!answer) {
    return { correct: false, skipped: true };
  }

  switch (id) {
    case 'q1': {
      const hasJava = /java/i.test(answer);
      const hasRuby = /ruby/i.test(answer);
      const hasGo = /\bgo\b|golang/i.test(answer);
      const hasSwift = /swift/i.test(answer);
      const hasPerl = /perl/i.test(answer);
      const count = [hasJava, hasRuby, hasGo, hasSwift, hasPerl].filter(Boolean).length;
      return { correct: count >= 4 };
    }

    case 'q2': {
      const hasPerson = /linus|torvalds/i.test(answer);
      const hasLinux = /linux/i.test(answer);
      const hasGit = /\bgit\b/i.test(answer);
      return { correct: hasPerson && (hasLinux || hasGit) };
    }

    case 'q3': {
      const hasHeat = /warm|heat|hot|temp/i.test(answer);
      const hasSwitchOrBulb = /switch|bulb/i.test(answer);
      const hasStates = /on|off/i.test(answer);
      return { correct: hasHeat && hasSwitchOrBulb && hasStates };
    }

    case 'q4': {
      const mentionsBoundsBug = /mid\s*[\+\-]\s*1|low\s*=\s*mid|high\s*=\s*mid|infinite|loop|hang/i.test(answer);
      const mentionsEqualityBug = /<=\s*high|less than or equal|single|one element|last element|never check|low\s*<\s*high/i.test(answer);
      const mentionsInput = /\[|\d+|hang|wrong/i.test(answer);
      return {
        correct:
          (mentionsBoundsBug && mentionsEqualityBug) ||
          ((mentionsBoundsBug || mentionsEqualityBug) && mentionsInput),
      };
    }

    case 'q5': {
      let matches = 0;
      if (/mit.*?[=→:>\-]\s*b\b/i.test(answer) || /b.*mit/i.test(answer) || /mit\s*:\s*b/i.test(answer)) matches++;
      if (/gpl.*?[=→:>\-]\s*c\b/i.test(answer) || /c.*gpl/i.test(answer) || /gpl\s*:\s*c/i.test(answer)) matches++;
      if (/apache.*?[=→:>\-]\s*d\b/i.test(answer) || /d.*apache/i.test(answer) || /apache\s*:\s*d/i.test(answer)) matches++;
      if (/agpl.*?[=→:>\-]\s*a\b/i.test(answer) || /a.*agpl/i.test(answer) || /agpl\s*:\s*a/i.test(answer)) matches++;
      return { correct: matches >= 3 };
    }

    default:
      return { correct: false };
  }
}

