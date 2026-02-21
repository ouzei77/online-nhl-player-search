import React, { useEffect, useRef } from 'react';
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
	selectedIndex: number;
}

export default function PlayerDropdown({
	candidates,
	onSelect,
	onClose,
	selectedIndex
}: PlayerDropdownProps) {
	const listRef = useRef<HTMLUListElement>(null);
	const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

	// Scroll selected item into view when selectedIndex changes
	useEffect(() => {
		if (selectedIndex >= 0 && itemRefs.current[selectedIndex] && listRef.current) {
			const selectedItem = itemRefs.current[selectedIndex];
			const list = listRef.current;
			
			const itemTop = selectedItem.offsetTop;
			const itemBottom = itemTop + selectedItem.offsetHeight;
			const listTop = list.scrollTop;
			const listBottom = listTop + list.clientHeight;

			if (itemTop < listTop) {
				// Item is above visible area, scroll up
				list.scrollTop = itemTop;
			} else if (itemBottom > listBottom) {
				// Item is below visible area, scroll down
				list.scrollTop = itemBottom - list.clientHeight;
			}
		}
	}, [selectedIndex]);

	if (!candidates || candidates.length === 0) {
		return null;
	}

	return (
		<div className={styles.dropdown}>
			<ul className={styles.dropdownList} ref={listRef}>
				{candidates.map((candidate, index) => (
					<li
						key={candidate.playerId}
						ref={(el) => {
							itemRefs.current[index] = el;
						}}
						className={`${styles.dropdownItem} ${
							index === selectedIndex ? styles.dropdownItemActive : ''
						}`}
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
