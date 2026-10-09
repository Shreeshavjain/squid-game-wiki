import { DifficultyTier } from '../types/difficulty';

/**
 * CENTRAL EVENT PROTOCOL REPOSITORY
 * =================================
 * Replace these placeholder rules and parameters when official event guidelines
 * are confirmed by the tech-club committee. All UI components dynamically adapt
 * to the values specified below.
 */
export const DIFFICULTY_TIERS: readonly DifficultyTier[] = [
  {
    id: 'easy',
    code: 'GAME-01',
    title: 'EASY',
    subtitle: 'SECTOR GREEN // FOUNDATION RUN',
    symbol: 'circle',
    guardRole: 'WORKER // CIRCLE',
    riskLevel: 'LOW RISK',
    riskDescriptor: 'STEADY CADENCE // PREDICTABLE PITFALLS',
    timeLimit: '45 MINS',
    bountyMultiplier: '1.0× BASE POOL',
    survivalRate: 'EST. SURVIVAL 82%',
    overview:
      'Introductory algorithmic and debugging trials designed to assess rapid baseline synchronization and fundamental syntax under pressure.',
    targetAudience: 'Recommended for freshmen squads and teams testing coordination.',
    rules: [
      {
        id: 'r1',
        title: 'Single-Attempt Checkpoints',
        description:
          'Automated test suites evaluate submissions with instant verification. Max 2 failed attempts per problem before point decay kicks in.',
      },
      {
        id: 'r2',
        title: 'Linear Problem Chain',
        description:
          'Challenges must be resolved sequentially. Skipping requires team unanimous consent and burns 3 minutes off the clock.',
      },
      {
        id: 'r3',
        title: 'Standard Terminal Tools',
        description:
          'Access to core language docs permitted. External generative AI assistants are prohibited by the arena monitoring engine.',
      },
    ],
    penaltyNotice: 'Penalty decay of 5% per failed compilation after the second attempt.',
    accentColorHex: '#3b82f6', // subtle icy cyan/slate for circle
  },
  {
    id: 'medium',
    code: 'GAME-02',
    title: 'MEDIUM',
    subtitle: 'SECTOR AMBER // DALGONA GAUNTLET',
    symbol: 'triangle',
    guardRole: 'SOLDIER // TRIANGLE',
    riskLevel: 'ELEVATED RISK',
    riskDescriptor: 'RAPID CLOCK // PUNISHING EDGE-CASES',
    timeLimit: '35 MINS',
    bountyMultiplier: '1.75× BASE POOL',
    survivalRate: 'EST. SURVIVAL 49%',
    overview:
      'Intermediate system puzzles demanding tight algorithmic optimizations, strict memory limits, and razor-sharp edge-case handling.',
    targetAudience: 'Optimal balance of risk and point payout for battle-tested teams.',
    rules: [
      {
        id: 'r1',
        title: 'Time-Decay Penalty Matrix',
        description:
          'Points depreciate by 1.5% for every elapsed minute after the 15-minute mark. Speed directly dictates final score.',
      },
      {
        id: 'r2',
        title: 'Hidden Adversarial Tests',
        description:
          'Test runner conceals 40% of stress test cases until final evaluation. Flawed algorithmic complexity will trigger timeouts.',
      },
      {
        id: 'r3',
        title: 'Blind Pair Switch',
        description:
          'At the 18-minute siren, team screen access rotates. The second pilot must complete the active problem in flight.',
      },
    ],
    penaltyNotice: 'Timeouts cause immediate forfeiture of problem multiplier bonus.',
    accentColorHex: '#f59e0b', // tactical amber/gold for triangle
  },
  {
    id: 'hard',
    code: 'GAME-03',
    title: 'HARD',
    subtitle: 'SECTOR CRIMSON // GLASS BRIDGE',
    symbol: 'square',
    guardRole: 'SUPERVISOR // SQUARE',
    riskLevel: 'CRITICAL RISK',
    riskDescriptor: 'ZERO TOLERANCE // SUDDEN DEATH ELIMINATION',
    timeLimit: '25 MINS',
    bountyMultiplier: '3.0× MAXIMUM POOL',
    survivalRate: 'EST. SURVIVAL 16%',
    overview:
      'High-stress competitive architecture and competitive exploit challenges. A single syntax regression or timeout deducts accumulated squad points.',
    targetAudience: 'Top-tier squads seeking championship lead with high appetite for risk.',
    rules: [
      {
        id: 'r1',
        title: 'Sudden-Death Execution',
        description:
          'Three runtime exceptions terminate the squad’s attempt immediately. Unhandled memory leaks result in immediate zero score.',
      },
      {
        id: 'r2',
        title: 'Hard Resource Quotas',
        description:
          'Solutions run in strictly sandboxed containers with 128MB RAM caps and microsecond thread limits.',
      },
      {
        id: 'r3',
        title: 'Maximum Multiplier Jackpot',
        description:
          'Completing all challenges unlocks the 3.0× multiplier and grants automatic top seed on the live arena leaderboard.',
      },
    ],
    penaltyNotice: 'Lethal scoring rule: Failure to clear at least 2 challenges voids all points.',
    accentColorHex: '#e11d48', // intense crimson red for square
  },
];

export const DEFAULT_TEAM_SESSION = {
  teamId: 'TEAM-456',
  teamName: 'SANG-WOO CONSORTIUM',
  sessionCode: 'SESSION 01 // POOL A',
  arenaStatus: 'ACTIVE_SELECTION' as const,
};
