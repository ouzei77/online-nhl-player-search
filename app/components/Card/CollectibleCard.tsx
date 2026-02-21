import { memo, useCallback } from 'react';
import type { PlayerBase } from '~/types/player';
import { DEFAULT_SKATER_MUG } from '~/types/player';
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

interface CollectibleCardProps {
	playerData: PlayerBase;
	image: string;
	onFlip?: () => void;
	isFlipped?: boolean;
}

/**
 * Module-level handler: hide broken logo images.
 * Defined once — avoids allocating a new closure per render.
 */
const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement>) => {
	e.currentTarget.style.display = 'none';
};

/**
 * Module-level handler: fallback for broken player headshot.
 * Uses a `data-default-tried` flag to prevent an infinite error loop
 * when the fallback itself is unavailable.
 */
const handlePlayerImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
	if (!e.currentTarget.dataset.defaultTried) {
		e.currentTarget.dataset.defaultTried = '1';
		e.currentTarget.src = DEFAULT_SKATER_MUG;
	}
};

/** Helper: join class names, filtering out empty strings */
function cx(...classes: (string | false | undefined | null)[]): string {
	return classes.filter(Boolean).join(' ');
}

export default memo(function CollectibleCard({
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

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (onFlip && (e.key === 'Enter' || e.key === ' ')) {
				e.preventDefault();
				onFlip();
			}
		},
		[onFlip]
	);

	return (
		<div
			className={cx(
				styles.nhlCard,
				teamClassName,
				onFlip && styles.clickable,
				isFlipped && styles.flipped
			)}
			onClick={onFlip}
			role={onFlip ? 'button' : undefined}
			tabIndex={onFlip ? 0 : undefined}
			onKeyDown={onFlip ? handleKeyDown : undefined}
		>
			{/* LAYER 1: Player Background Image */}
			<div className={styles.playerLayer}>
				{image && (
					<img
						src={image}
						alt={playerName ? `${playerName} headshot` : 'Player headshot'}
						className={styles.playerBgImg}
						onError={handlePlayerImgError}
					/>
				)}
			</div>

			{/* LAYER 2: The "V" Shape Overlays (placed behind player via z-index) */}
			<div className={cx(styles.vPanel, styles.panelLeft)}>
				<div className={styles.panelTexture}></div>
			</div>

			<div className={cx(styles.vPanel, styles.panelRight)}>
				<div className={styles.iceTexture}></div>
			</div>

			{/* LAYER 3: Top Content (Logos & Text) */}
			<div className={styles.nhlCardContent}>
				{/* Team logo top left */}
				<div className={styles.teamLogoTopLeft}>
					<img
						src={playerData?.team?.logoUrl || '/NHL.ico'}
						alt={playerData?.team?.logoUrl ? teamName : 'NHL'}
						className={styles.teamLogo}
						onError={handleLogoError}
					/>
				</div>

				{/* Bottom banners */}
				<div className={styles.bottomBannerContainer}>
					<div className={styles.bannerTop}>
						<span className={styles.teamNameText}>{teamName}</span>
					</div>
					<div className={styles.bannerBottom}>
						<span className={styles.playerName}>{playerName || 'Search for a player'}</span>
						{jerseyNumber != null && (
							<span className={styles.playerNumber}>#{jerseyNumber}</span>
						)}
					</div>
				</div>

				{/* Mobile flip hint - only show on front side */}
				{onFlip && !isFlipped && playerName && playerName !== 'Search for a player' && (
					<div className={styles.flipHint}>
						<div className={styles.flipHintText}>Tap to view stats</div>
					</div>
				)}
			</div>
		</div>
	);
});
