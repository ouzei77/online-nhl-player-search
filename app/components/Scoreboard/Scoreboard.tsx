import React from 'react';

interface ScoreboardProps {
	playerName?: string;
	teamName?: string;
	jerseyNumber?: number | null;
}

export default function Scoreboard({ playerName, teamName, jerseyNumber }: ScoreboardProps) {
	return (
		<div className="scoreboard-panel">
			{playerName && teamName ? (
				<>
					<span>{playerName.toUpperCase()}</span>
					<span>|</span>
					<span>{teamName.toUpperCase()}</span>
					{jerseyNumber && (
						<>
							<span>|</span>
							<span>#{jerseyNumber}</span>
						</>
					)}
				</>
			) : (
				<span>NHL PLAYER SEARCH</span>
			)}
		</div>
	);
}
