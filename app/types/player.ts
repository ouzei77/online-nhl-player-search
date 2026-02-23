/** Default fallback headshot image URL used across the app.
 *  Served through our own image proxy so it arrives pre-downsampled
 *  (64 × 64 px) — `image-rendering: pixelated` stretches it for the retro look. */
export const DEFAULT_SKATER_MUG = '/nhl/player-headshot?default=true';

export interface SkaterStats {
	games_played?: number;
	goals?: number;
	assists?: number;
	points?: number;
	plus_minus?: number;
}

export interface GoalieStats {
	games_played?: number;
	wins?: number;
	shutouts?: number;
	saves_pct?: number;
	avg_goals_against?: number;
}

export interface Season {
	season: string;
	regular: SkaterStats | GoalieStats | null;
	playoffs: SkaterStats | GoalieStats | null;
	team?: string | null;
}

export interface CareerStats {
	totalGamesPlayed: number;
	totalGoals: number;
	totalAssists: number;
	totalPoints: number;
	totalPlusMinus: number;
	totalWins: number;
	totalSOs: number;
	totalSVpct: number;
	totalGAA: number;
}

/** Base player info used by presentational components (e.g. CollectibleCard) */
export interface PlayerBase {
	full_name: string;
	team?: {
		id: number | null;
		name: string;
		alias: string;
		logoUrl: string | null;
	};
	jersey_number: number | null;
	primary_position: string;
	headshotUrl: string;
}

/** Full player data including statistics */
export interface PlayerData extends PlayerBase {
	currentSeason: {
		regular: SkaterStats | GoalieStats | null;
		playoffs: SkaterStats | GoalieStats | null;
	};
	last5Seasons: Season[];
	careerStats: CareerStats;
}
