export type GeometricSymbol = 'circle' | 'triangle' | 'square';

export type DifficultyId = 'easy' | 'medium' | 'hard';

export interface ProtocolRule {
  readonly id: string;
  readonly title: string;
  readonly description: string;
}

export interface DifficultyTier {
  readonly id: DifficultyId;
  readonly code: string;
  readonly title: string;
  readonly subtitle: string;
  readonly symbol: GeometricSymbol;
  readonly guardRole: string;
  readonly riskLevel: 'LOW RISK' | 'ELEVATED RISK' | 'CRITICAL RISK';
  readonly riskDescriptor: string;
  readonly timeLimit: string;
  readonly bountyMultiplier: string;
  readonly survivalRate: string;
  readonly overview: string;
  readonly targetAudience: string;
  readonly rules: readonly ProtocolRule[];
  readonly penaltyNotice: string;
  readonly accentColorHex: string;
  /** When set, the card shows per-answer scoring instead of time/bounty */
  readonly scoring?: {
    readonly correct: number;
    readonly wrong: number;
  };
}

export interface TeamSessionInfo {
  teamId: string;
  teamName: string;
  sessionCode: string;
  arenaStatus: 'ACTIVE_SELECTION' | 'LOCKED' | 'COUNTDOWN';
}
