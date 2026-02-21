import React from 'react';
import styles from './CollectibleCard.module.css';

// Map NHL triCodes to CSS team theme classes used by the collectible card template
const TEAM_CLASS_MAP: Record<string, string> = {
	ANA: 'anaheim-ducks',
	ARI: 'arizona-coyotes',
	BOS: 'boston-bruins',
	BUF: 'buffalo-sabres',
	CGY: 'calgary-flames',
	CAR: 'carolina-hurricanes',
	CHI: 'chicago-blackhawks',
	COL: 'colorado-avalanche',
	CBJ: 'columbus-blue-jackets',
	DAL: 'dallas-stars',
	DET: 'detroit-red-wings',
	EDM: 'edmonton-oilers',
	FLA: 'florida-panthers',
	LAK: 'los-angeles-kings',
	MIN: 'minnesota-wild',
	MTL: 'montreal-canadiens',
	NSH: 'nashville-predators',
	NJD: 'new-jersey-devils',
	NYI: 'new-york-islanders',
	NYR: 'new-york-rangers',
	OTT: 'ottawa-senators',
	PHI: 'philadelphia-flyers',
	PIT: 'pittsburgh-penguins',
	SJS: 'san-jose-sharks',
	SEA: 'seattle-kraken',
	STL: 'st-louis-blues',
	TBL: 'tampa-bay-lightning',
	TOR: 'toronto-maple-leafs',
	VAN: 'vancouver-canucks',
	VGK: 'vegas-golden-knights',
	WSH: 'washington-capitals',
	WPG: 'winnipeg-jets'
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
}

interface CollectibleCardProps {
	playerData: PlayerData;
	image: string;
	onFlip?: () => void;
	isFlipped?: boolean;
}

export default function CollectibleCard({
	playerData,
	image,
	onFlip,
	isFlipped
}: CollectibleCardProps) {
	const teamAbbrev = playerData?.team?.alias;
	const teamClassKey = teamAbbrev ? TEAM_CLASS_MAP[teamAbbrev] : null;
	const teamClassName = teamClassKey ? styles[teamClassKey] : '';
	const teamName = playerData?.team?.name || teamAbbrev || 'NHL Team';
	const jerseyNumber = playerData?.jersey_number;
	const playerName = playerData?.full_name || '';

	return (
		<div 
			className={`${styles.nhlCard} ${teamClassName} ${onFlip ? styles.clickable : ''}`}
			onClick={onFlip}
			role={onFlip ? 'button' : undefined}
			tabIndex={onFlip ? 0 : undefined}
			onKeyDown={onFlip ? (e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					onFlip();
				}
			} : undefined}
		>
			{/* LAYER 1: Player Background Image */}
			<div className={styles.playerLayer}>
				{image && (
					<img
						src={image}
						alt="player-background"
						className={styles.playerBgImg}
						onError={(e) => {
							const defaultMug =
								'https://assets.nhle.com/mugs/nhl/default-skater.png';
							if (!(e.currentTarget as HTMLImageElement).dataset.defaultTried) {
								(e.currentTarget as HTMLImageElement).dataset.defaultTried = '1';
								e.currentTarget.src = defaultMug;
							}
						}}
					/>
				)}
			</div>

			{/* LAYER 2: The "V" Shape Overlays (placed behind player via z-index) */}
			<div className={`${styles.vPanel} ${styles.panelLeft}`}>
				<div className={styles.panelTexture}></div>
			</div>

			<div className={`${styles.vPanel} ${styles.panelRight}`}>
				<div className={styles.iceTexture}></div>
			</div>

			{/* LAYER 3: Top Content (Logos & Text) */}
			<div className={styles.nhlCardContent}>
				{/* Team logo top left */}
				<div className={styles.teamLogoTopLeft}>
					{playerData?.team?.logoUrl ? (
						<img
							src={playerData.team.logoUrl}
							alt={teamName}
							className={styles.teamLogo}
							onError={(e) => {
								// Hide broken logo rather than showing broken image icon
								e.currentTarget.style.display = 'none';
							}}
						/>
					) : (
						// Show NHL.ico when no player is displayed
						<img
							src="/NHL.ico"
							alt="NHL"
							className={styles.teamLogo}
							onError={(e) => {
								// Hide broken logo rather than showing broken image icon
								e.currentTarget.style.display = 'none';
							}}
						/>
					)}
				</div>

				{/* Bottom banners */}
				<div className={styles.bottomBannerContainer}>
					<div className={styles.bannerTop}>
						<span className={styles.teamNameText}>{teamName}</span>
					</div>
					<div className={styles.bannerBottom}>
						<span className={styles.playerName}>{playerName || 'Search for a player'}</span>
						{jerseyNumber && (
							<span className={styles.playerNumber}>#{jerseyNumber}</span>
						)}
					</div>
				</div>

				{/* Mobile flip hint */}
				{onFlip && !isFlipped && playerName && playerName !== 'Search for a player' && (
					<div className={styles.flipHint}>
						<div className={styles.flipHintText}>Tap to view stats</div>
					</div>
				)}
			</div>
		</div>
	);
}
