import React from 'react';
import styles from './StatsPanel.module.css';

// Helper function to format season string (e.g., "20252026" -> "2025-2026")
const formatSeason = (seasonStr: string) => {
	if (!seasonStr || seasonStr.length !== 8) return seasonStr;
	const startYear = seasonStr.substring(0, 4);
	const endYear = seasonStr.substring(4, 8);
	return `${startYear}-${endYear}`;
};

interface SkaterStats {
	games_played?: number;
	goals?: number;
	assists?: number;
	points?: number;
	plus_minus?: number;
}

interface GoalieStats {
	games_played?: number;
	wins?: number;
	shutouts?: number;
	saves_pct?: number;
	avg_goals_against?: number;
}

interface SkaterStatsTableProps {
	stats: SkaterStats | null;
	title: string;
}

const SkaterStatsTable = ({ stats, title }: SkaterStatsTableProps) => {
	if (!stats) return null;

	return (
		<div className={styles.statsSection}>
			<h3 className={styles.statsTitle}>{title}</h3>
			<table className={styles.statsTable}>
				<thead>
					<tr>
						<th>GP</th>
						<th className={styles.bordered}>G</th>
						<th>A</th>
						<th className={styles.bordered}>P</th>
						<th>+/-</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>{stats.games_played ?? '-'}</td>
						<td className={styles.bordered}>{stats.goals ?? '-'}</td>
						<td>{stats.assists ?? '-'}</td>
						<td className={styles.bordered}>{stats.points ?? '-'}</td>
						<td>{stats.plus_minus ?? '-'}</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
};

interface GoalieStatsTableProps {
	stats: GoalieStats | null;
	title: string;
}

const GoalieStatsTable = ({ stats, title }: GoalieStatsTableProps) => {
	if (!stats) return null;

	return (
		<div className={styles.statsSection}>
			<h3 className={styles.statsTitle}>{title}</h3>
			<table className={styles.statsTable}>
				<thead>
					<tr>
						<th>GP</th>
						<th className={styles.bordered}>W</th>
						<th>SO</th>
						<th className={styles.bordered}>SV %</th>
						<th>GAA</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>{stats.games_played ?? '-'}</td>
						<td className={styles.bordered}>{stats.wins ?? '-'}</td>
						<td>{stats.shutouts ?? '-'}</td>
						<td className={styles.bordered}>
							{stats.saves_pct != null
								? `${(stats.saves_pct * 100).toFixed(1)}%`
								: '-'}
						</td>
						<td>
							{stats.avg_goals_against != null
								? stats.avg_goals_against.toFixed(2)
								: '-'}
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
};

interface Season {
	season: string;
	stats: SkaterStats | GoalieStats;
}

interface SeasonHistoryTableProps {
	seasons: Season[];
	isGoalie: boolean;
}

const SeasonHistoryTable = ({ seasons, isGoalie }: SeasonHistoryTableProps) => {
	if (!seasons || seasons.length === 0) return null;

	return (
		<div className={styles.statsSection}>
			<h3 className={styles.statsTitle}>Last 5 Seasons</h3>
			<table className={`${styles.statsTable} ${styles.seasonHistoryTable}`}>
				<thead>
					<tr>
						<th>Season</th>
						{!isGoalie ? (
							<>
								<th>GP</th>
								<th className={styles.bordered}>G</th>
								<th>A</th>
								<th className={styles.bordered}>P</th>
								<th>+/-</th>
							</>
						) : (
							<>
								<th>GP</th>
								<th className={styles.bordered}>W</th>
								<th>SO</th>
								<th className={styles.bordered}>SV %</th>
								<th>GAA</th>
							</>
						)}
					</tr>
				</thead>
				<tbody>
					{seasons.map((season, idx) => (
						<tr key={idx}>
							<td className={styles.seasonLabel}>
								{formatSeason(season.season)}
							</td>
							{!isGoalie ? (
								<>
									<td>{(season.stats as SkaterStats)?.games_played ?? '-'}</td>
									<td className={styles.bordered}>
										{(season.stats as SkaterStats)?.goals ?? '-'}
									</td>
									<td>{(season.stats as SkaterStats)?.assists ?? '-'}</td>
									<td className={styles.bordered}>
										{(season.stats as SkaterStats)?.points ?? '-'}
									</td>
									<td>{(season.stats as SkaterStats)?.plus_minus ?? '-'}</td>
								</>
							) : (
								<>
									<td>{(season.stats as GoalieStats)?.games_played ?? '-'}</td>
									<td className={styles.bordered}>
										{(season.stats as GoalieStats)?.wins ?? '-'}
									</td>
									<td>{(season.stats as GoalieStats)?.shutouts ?? '-'}</td>
									<td className={styles.bordered}>
										{(season.stats as GoalieStats)?.saves_pct != null
											? `${((season.stats as GoalieStats).saves_pct! * 100).toFixed(1)}%`
											: '-'}
									</td>
									<td>
										{(season.stats as GoalieStats)?.avg_goals_against != null
											? (season.stats as GoalieStats).avg_goals_against!.toFixed(2)
											: '-'}
									</td>
								</>
							)}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

interface PlayerData {
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
	currentSeason: {
		regular: SkaterStats | GoalieStats | null;
		playoffs: SkaterStats | GoalieStats | null;
	};
	last5Seasons: Season[];
	careerStats: {
		totalGamesPlayed: number;
		totalGoals: number;
		totalAssists: number;
		totalPoints: number;
		totalPlusMinus: number;
		totalWins: number;
		totalSOs: number;
		totalSVpct: number;
		totalGAA: number;
	};
}

interface StatsPanelProps {
	playerData: PlayerData;
	careerStats: PlayerData['careerStats'];
	isGoalie: boolean;
}

export default function StatsPanel({
	playerData,
	careerStats,
	isGoalie
}: StatsPanelProps) {
	if (!playerData || !careerStats) return null;

	const currentSeason = playerData.currentSeason || {};
	const last5Seasons = playerData.last5Seasons || [];

	const skaterCareer = !isGoalie
		? {
				games_played: careerStats.totalGamesPlayed,
				goals: careerStats.totalGoals,
				assists: careerStats.totalAssists,
				points: careerStats.totalPoints,
				plus_minus: careerStats.totalPlusMinus
			}
		: null;

	const goalieCareer = isGoalie
		? {
				games_played: careerStats.totalGamesPlayed,
				wins: careerStats.totalWins,
				shutouts: careerStats.totalSOs,
				saves_pct: careerStats.totalSVpct,
				avg_goals_against: careerStats.totalGAA
			}
		: null;

	return (
		<div className={styles.statsPanel}>
			{/* Current Season Regular */}
			{!isGoalie ? (
				<SkaterStatsTable
					stats={currentSeason.regular as SkaterStats}
					title="Current Season - Regular"
				/>
			) : (
				<GoalieStatsTable
					stats={currentSeason.regular as GoalieStats}
					title="Current Season - Regular"
				/>
			)}

			{/* Current Season Playoffs */}
			{currentSeason.playoffs &&
				(!isGoalie ? (
					<SkaterStatsTable
						stats={currentSeason.playoffs as SkaterStats}
						title="Current Season - Playoffs"
					/>
				) : (
					<GoalieStatsTable
						stats={currentSeason.playoffs as GoalieStats}
						title="Current Season - Playoffs"
					/>
				))}

			{/* Career Stats */}
			{!isGoalie ? (
				<SkaterStatsTable stats={skaterCareer} title="Career" />
			) : (
				<GoalieStatsTable stats={goalieCareer} title="Career" />
			)}

			{/* Last 5 Seasons */}
			<SeasonHistoryTable seasons={last5Seasons} isGoalie={isGoalie} />
		</div>
	);
}
