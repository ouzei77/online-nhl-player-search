import React from 'react';
import styles from './StatsPanel.module.css';

// Helper function to format season string (e.g., "20252026" -> "2024-25")
const formatSeason = (seasonStr: string) => {
	if (!seasonStr || seasonStr.length !== 8) return seasonStr;
	const startYear = seasonStr.substring(0, 4);
	const endYear = seasonStr.substring(6, 8); // Last 2 digits
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
	// Check if stats exist and have games played
	const hasStats = stats && (stats.games_played ?? 0) > 0;

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
						<td>{hasStats ? (stats.games_played ?? '-') : '-'}</td>
						<td className={styles.bordered}>{hasStats ? (stats.goals ?? '-') : '-'}</td>
						<td>{hasStats ? (stats.assists ?? '-') : '-'}</td>
						<td className={styles.bordered}>{hasStats ? (stats.points ?? '-') : '-'}</td>
						<td>{hasStats ? (stats.plus_minus ?? '-') : '-'}</td>
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
	// Check if stats exist and have games played
	const hasStats = stats && (stats.games_played ?? 0) > 0;

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
						<td>{hasStats ? (stats.games_played ?? '-') : '-'}</td>
						<td className={styles.bordered}>{hasStats ? (stats.wins ?? '-') : '-'}</td>
						<td>{hasStats ? (stats.shutouts ?? '-') : '-'}</td>
						<td className={styles.bordered}>
							{hasStats && stats.saves_pct != null && stats.saves_pct > 0
								? `${(stats.saves_pct * 100).toFixed(1)}%`
								: '-'}
						</td>
						<td>
							{hasStats && stats.avg_goals_against != null && stats.avg_goals_against > 0
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
	regular: SkaterStats | GoalieStats | null;
	playoffs: SkaterStats | GoalieStats | null;
	team?: string | null;
}

interface SeasonHistoryTableProps {
	seasons: Season[];
	isGoalie: boolean;
}

const SeasonHistoryTable = ({ seasons, isGoalie }: SeasonHistoryTableProps) => {
	const [isExpanded, setIsExpanded] = React.useState(false);

	if (!seasons || seasons.length === 0) return null;

	return (
		<div className={styles.statsSection}>
			<h3 
				className={`${styles.statsTitle} ${styles.clickableTitle}`}
				onClick={() => setIsExpanded(!isExpanded)}
			>
				Last 5 Seasons
				<span className={styles.dropdownIcon}>
					{isExpanded ? '▼' : '▶'}
				</span>
			</h3>
			{isExpanded && (
				<table className={`${styles.statsTable} ${styles.seasonHistoryTable}`}>
					<thead>
						<tr>
							<th>Season</th>
							<th>Game Type</th>
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
						{seasons.map((season, idx) => {
							// Always show both rows (regular season and playoffs) for each season
							// Each season always has 2 rows, so rowSpan is always 2
							const rowSpan = 2;

							// Render regular season row (always shown)
							const regularRow = (
								<tr key={`regular-${idx}`} className={styles.regularRow}>
									<td className={styles.seasonLabel} rowSpan={rowSpan}>
										<div>{formatSeason(season.season)}</div>
										{season.team && (
											<div className={styles.teamLabel}>{season.team}</div>
										)}
									</td>
									<td className={styles.seasonType}>Regular Season</td>
									{!isGoalie ? (
										<>
											<td>{(season.regular as SkaterStats)?.games_played ?? '-'}</td>
											<td className={styles.bordered}>
												{(season.regular as SkaterStats)?.goals ?? '-'}
											</td>
											<td>{(season.regular as SkaterStats)?.assists ?? '-'}</td>
											<td className={styles.bordered}>
												{(season.regular as SkaterStats)?.points ?? '-'}</td>
											<td>{(season.regular as SkaterStats)?.plus_minus ?? '-'}</td>
										</>
									) : (
										<>
											<td>{(season.regular as GoalieStats)?.games_played ?? '-'}</td>
											<td className={styles.bordered}>
												{(season.regular as GoalieStats)?.wins ?? '-'}
											</td>
											<td>{(season.regular as GoalieStats)?.shutouts ?? '-'}</td>
											<td className={styles.bordered}>
												{(season.regular as GoalieStats)?.saves_pct != null && (season.regular as GoalieStats).saves_pct! > 0
													? `${((season.regular as GoalieStats).saves_pct! * 100).toFixed(1)}%`
													: '-'}
											</td>
											<td>
												{(season.regular as GoalieStats)?.avg_goals_against != null && (season.regular as GoalieStats).avg_goals_against! > 0
													? (season.regular as GoalieStats).avg_goals_against!.toFixed(2)
													: '-'}
											</td>
										</>
									)}
								</tr>
							);

							// Render playoffs row (always shown, even if no playoff stats)
							const playoffsRow = (
								<tr key={`playoffs-${idx}`} className={styles.playoffsRow}>
									<td className={styles.seasonType}>Playoffs</td>
									{!isGoalie ? (
										<>
											<td>{(season.playoffs as SkaterStats)?.games_played ?? '-'}</td>
											<td className={styles.bordered}>
												{(season.playoffs as SkaterStats)?.goals ?? '-'}
											</td>
											<td>{(season.playoffs as SkaterStats)?.assists ?? '-'}</td>
											<td className={styles.bordered}>
												{(season.playoffs as SkaterStats)?.points ?? '-'}</td>
											<td>{(season.playoffs as SkaterStats)?.plus_minus ?? '-'}</td>
										</>
									) : (
										<>
											<td>{(season.playoffs as GoalieStats)?.games_played ?? '-'}</td>
											<td className={styles.bordered}>
												{(season.playoffs as GoalieStats)?.wins ?? '-'}
											</td>
											<td>{(season.playoffs as GoalieStats)?.shutouts ?? '-'}</td>
											<td className={styles.bordered}>
												{(season.playoffs as GoalieStats)?.saves_pct != null && (season.playoffs as GoalieStats).saves_pct! > 0
													? `${((season.playoffs as GoalieStats).saves_pct! * 100).toFixed(1)}%`
													: '-'}
											</td>
											<td>
												{(season.playoffs as GoalieStats)?.avg_goals_against != null && (season.playoffs as GoalieStats).avg_goals_against! > 0
													? (season.playoffs as GoalieStats).avg_goals_against!.toFixed(2)
													: '-'}
											</td>
										</>
									)}
								</tr>
							);

							return (
								<React.Fragment key={idx}>
									{regularRow}
									{playoffsRow}
								</React.Fragment>
							);
						})}
					</tbody>
				</table>
			)}
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
	playerData: PlayerData | null;
	careerStats: PlayerData['careerStats'];
	isGoalie: boolean;
}

export default function StatsPanel({
	playerData,
	careerStats,
	isGoalie
}: StatsPanelProps) {
	// Show empty stats panel even if no player data
	const currentSeason = playerData?.currentSeason || { regular: null, playoffs: null };
	const last5Seasons = playerData?.last5Seasons || [];

	const skaterCareer = !isGoalie
		? {
				games_played: careerStats.totalGamesPlayed || 0,
				goals: careerStats.totalGoals || 0,
				assists: careerStats.totalAssists || 0,
				points: careerStats.totalPoints || 0,
				plus_minus: careerStats.totalPlusMinus || 0
			}
		: null;

	const goalieCareer = isGoalie
		? {
				games_played: careerStats.totalGamesPlayed || 0,
				wins: careerStats.totalWins || 0,
				shutouts: careerStats.totalSOs || 0,
				saves_pct: careerStats.totalSVpct || 0,
				avg_goals_against: careerStats.totalGAA || 0
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
