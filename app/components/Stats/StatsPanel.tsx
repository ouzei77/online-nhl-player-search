import React from 'react';
import type { SkaterStats, GoalieStats, Season, PlayerData } from '~/types/player';
import styles from './StatsPanel.module.css';

// Helper function to format season string (e.g., "20252026" -> "25-26")
const formatSeason = (seasonStr: string) => {
	if (!seasonStr || seasonStr.length !== 8) return seasonStr;
	const startYear = seasonStr.substring(2, 4); // Last 2 digits of start year
	const endYear = seasonStr.substring(6, 8); // Last 2 digits of end year
	return `${startYear}-${endYear}`;
};

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
							{hasStats && stats.avg_goals_against != null && stats.avg_goals_against >= 0
								? stats.avg_goals_against.toFixed(2)
								: '-'}
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
};

interface SeasonHistoryTableProps {
	seasons: Season[];
	isGoalie: boolean;
	isInFlipCard?: boolean;
}

const SeasonHistoryTable = ({ seasons, isGoalie, isInFlipCard = false }: SeasonHistoryTableProps) => {
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
				<table className={`${styles.statsTable} ${styles.seasonHistoryTable} ${isInFlipCard ? styles.mobileCombined : ''}`}>
					<thead>
						<tr>
							<th>Season</th>
							{!isInFlipCard && <th>Game Type</th>}
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
							// For mobile flip card, combine season and game type in one column
							if (isInFlipCard) {
								const seasonStr = formatSeason(season.season);
								const teamAbbrev = season.team || '';
								
								// Render regular season row
								const regularRow = (
									<tr key={`regular-${idx}`} className={styles.regularRow}>
										<td className={styles.seasonLabelCombined}>
											{seasonStr} REG{teamAbbrev ? ` ${teamAbbrev}` : ''}
										</td>
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
													{(season.regular as GoalieStats)?.avg_goals_against != null && (season.regular as GoalieStats).avg_goals_against! >= 0
														? (season.regular as GoalieStats).avg_goals_against!.toFixed(2)
														: '-'}
												</td>
											</>
										)}
									</tr>
								);

								// Render playoffs row
								const playoffsRow = (
									<tr key={`playoffs-${idx}`} className={styles.playoffsRow}>
										<td className={styles.seasonLabelCombined}>
											{seasonStr} PO{teamAbbrev ? ` ${teamAbbrev}` : ''}
										</td>
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
													{(season.playoffs as GoalieStats)?.avg_goals_against != null && (season.playoffs as GoalieStats).avg_goals_against! >= 0
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
							}

							// Desktop version - original layout with separate columns
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
												{(season.regular as GoalieStats)?.avg_goals_against != null && (season.regular as GoalieStats).avg_goals_against! >= 0
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
												{(season.playoffs as GoalieStats)?.avg_goals_against != null && (season.playoffs as GoalieStats).avg_goals_against! >= 0
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

interface StatsPanelProps {
	playerData: PlayerData | null;
	careerStats: PlayerData['careerStats'];
	isGoalie: boolean;
	isInFlipCard?: boolean;
}

export default function StatsPanel({
	playerData,
	careerStats,
	isGoalie,
	isInFlipCard = false
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
		<div className={`${styles.statsPanel} ${isInFlipCard ? styles.inFlipCard : ''}`}>
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
			<SeasonHistoryTable seasons={last5Seasons} isGoalie={isGoalie} isInFlipCard={isInFlipCard} />
		</div>
	);
}
