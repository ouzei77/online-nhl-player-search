import type { Route } from './+types/player';
import React, { useState } from 'react';
import '../Global.css';
import LoadingScreen from '../components/LoadingScreen/LoadingScreen';
import SearchForm from '../components/Search/SearchForm';
import StatsPanel from '../components/Stats/StatsPanel';
import CollectibleCard from '../components/Card/CollectibleCard';
import Scoreboard from '../components/Scoreboard/Scoreboard';

export function meta({}: Route.MetaArgs) {
	return [
		{ title: 'NHL Player Search' },
		{ name: 'description', content: 'Search for NHL player statistics and information' }
	];
}

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
		regular: any;
		playoffs: any;
	};
	last5Seasons: any[];
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

export default function PlayerCard({}: Route.ComponentProps) {
	// Since API is on the same domain, we can use relative URLs
	const baseUrl = '';

	const [image, setImage] = useState<string | null>(null);
	const [playerData, setPlayerData] = useState<PlayerData | null>(null);
	const [careerStats, setCareerStats] = useState<PlayerData['careerStats'] | null>(null);
	const [btnClicked, setBtnClicked] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const blankImage = 'https://assets.nhle.com/mugs/nhl/default-skater.png';

	const handlePlayerSelect = async (playerId: number) => {
		// Set loading state and clear previous data
		setIsLoading(true);
		setPlayerData(null);
		setImage(null);
		setCareerStats(null);
		setBtnClicked(false);

		try {
			// Fetch player data (profile + stats) from backend
			const playerDataResponse = await fetch(
				`${baseUrl}/nhl/player-data?playerId=${encodeURIComponent(playerId)}`
			);

			if (!playerDataResponse.ok) {
				throw new Error(
					`Player data fetch failed: ${playerDataResponse.status} ${playerDataResponse.statusText}`
				);
			}

			const playerDataJson: PlayerData = await playerDataResponse.json();

			// Preload the image before updating state to ensure everything renders together
			const imageUrl = playerDataJson.headshotUrl || blankImage;
			const img = new Image();

			await new Promise<void>((resolve) => {
				img.onload = () => resolve();
				img.onerror = () => {
					resolve();
				};
				img.src = imageUrl;
			});

			// Preload team logo if available
			if (playerDataJson.team?.logoUrl) {
				const logoImg = new Image();
				await new Promise<void>((resolve) => {
					logoImg.onload = () => resolve();
					logoImg.onerror = () => resolve();
					logoImg.src = playerDataJson.team.logoUrl!;
				});
			}

			// Update all state at once after images are preloaded
			setPlayerData(playerDataJson);
			setImage(imageUrl);
			setCareerStats(playerDataJson.careerStats);
			setBtnClicked(true);
			setIsLoading(false);
		} catch (err) {
			setIsLoading(false);
			alert(
				'An unexpected error occurred while fetching player data. Please try again later.'
			);
		}
	};

	const isGoalie = playerData?.primary_position === 'G';

	// Default empty data for blank card and stats
	const defaultImage = blankImage;
	const defaultPlayerData: PlayerData = {
		full_name: '',
		team: {
			id: null,
			name: 'NHL Team',
			alias: '',
			logoUrl: null
		},
		jersey_number: null,
		primary_position: '',
		headshotUrl: defaultImage,
		currentSeason: {
			regular: null,
			playoffs: null
		},
		last5Seasons: [],
		careerStats: {
			totalGamesPlayed: 0,
			totalGoals: 0,
			totalAssists: 0,
			totalPoints: 0,
			totalPlusMinus: 0,
			totalWins: 0,
			totalSOs: 0,
			totalSVpct: 0,
			totalGAA: 0
		}
	};

	const defaultCareerStats = {
		totalGamesPlayed: 0,
		totalGoals: 0,
		totalAssists: 0,
		totalPoints: 0,
		totalPlusMinus: 0,
		totalWins: 0,
		totalSOs: 0,
		totalSVpct: 0,
		totalGAA: 0
	};

	// Use actual data if available, otherwise use defaults
	const displayPlayerData = playerData || defaultPlayerData;
	const displayImage = image || defaultImage;
	const displayCareerStats = careerStats || defaultCareerStats;
	const displayIsGoalie = isGoalie || false;

	return (
		<div className="app-container">
			<LoadingScreen loading={isLoading} />

			<div className="search-section">
				<SearchForm
					disabled={isLoading}
					onSearch={() => {}} // Not used anymore, search happens in SearchForm
					onPlayerSelect={handlePlayerSelect}
					baseUrl={baseUrl}
				/>
			</div>

			<div className="content-wrapper">
				{/* Left side - Stats */}
				<StatsPanel
					playerData={displayPlayerData}
					careerStats={displayCareerStats}
					isGoalie={displayIsGoalie}
				/>

				{/* Right side - Card */}
				<div className="card-panel">
					<CollectibleCard playerData={displayPlayerData} image={displayImage} />
				</div>
			</div>

			<Scoreboard
				playerName={displayPlayerData.full_name}
				teamName={displayPlayerData.team?.name}
				jerseyNumber={displayPlayerData.jersey_number}
			/>
		</div>
	);
}
