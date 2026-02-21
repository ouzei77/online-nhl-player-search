import React from 'react';
import styles from './PlayerDropdown.module.css';

interface PlayerCandidate {
	playerId: number;
	fullName: string;
	teamId: number | null;
	teamName: string | null;
}

interface PlayerDropdownProps {
	candidates: PlayerCandidate[];
	onSelect: (playerId: number, fullName: string) => void;
	onClose: () => void;
}

export default function PlayerDropdown({
	candidates,
	onSelect,
	onClose
}: PlayerDropdownProps) {
	if (!candidates || candidates.length === 0) {
		return null;
	}

	return (
		<div className={styles.dropdown}>
			<ul className={styles.dropdownList}>
				{candidates.map((candidate) => (
					<li
						key={candidate.playerId}
						className={styles.dropdownItem}
						onClick={() => onSelect(candidate.playerId, candidate.fullName)}
					>
						<div className={styles.playerName}>{candidate.fullName}</div>
						{candidate.teamName && (
							<div className={styles.teamName}>{candidate.teamName}</div>
						)}
					</li>
				))}
			</ul>
		</div>
	);
}
