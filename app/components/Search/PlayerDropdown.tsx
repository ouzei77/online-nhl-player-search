import React from 'react';
import styles from './PlayerDropdown.module.css';

interface PlayerCandidate {
	playerId: number;
	fullName: string;
	teamId: number | null;
}

interface PlayerDropdownProps {
	candidates: PlayerCandidate[];
	onSelect: (playerId: number) => void;
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
		<>
			<div className={styles.overlay} onClick={onClose} />
			<div className={styles.dropdown}>
				<div className={styles.dropdownHeader}>
					<span>Select a player:</span>
					<button className={styles.closeButton} onClick={onClose}>
						×
					</button>
				</div>
				<ul className={styles.dropdownList}>
					{candidates.map((candidate) => (
						<li
							key={candidate.playerId}
							className={styles.dropdownItem}
							onClick={() => onSelect(candidate.playerId)}
						>
							{candidate.fullName}
						</li>
					))}
				</ul>
			</div>
		</>
	);
}
