import React, { useState, useRef, useEffect } from 'react';
import Joi from 'joi';
import styles from './SearchForm.module.css';
import PlayerDropdown from './PlayerDropdown';

// Joi schema for input validation (allows basic Latin + extended Latin letters)
const nameSchema = Joi.string()
	.pattern(/^[a-zA-Z\u00C0-\u00FF\s.-]+$/)
	.min(3)
	.max(30)
	.required()
	.messages({
		'string.pattern.base':
			'Player name must contain only letters (including accents), spaces, periods, and hyphens.',
		'string.min': 'Player name must be at least 3 characters long.',
		'string.max': 'Player name must be at most 30 characters long.',
		'any.required': 'Player name is required.',
		'string.empty': 'Player name cannot be empty.'
	});

interface PlayerCandidate {
	playerId: number;
	fullName: string;
	teamId: number | null;
	teamName: string | null;
}

interface SearchFormProps {
	disabled: boolean;
	onSearch: (trimmedName: string) => void;
	onPlayerSelect: (playerId: number) => void;
	baseUrl?: string;
}

export default function SearchForm({
	disabled,
	onSearch,
	onPlayerSelect,
	baseUrl = ''
}: SearchFormProps) {
	const [value, setValue] = useState('');
	const [candidates, setCandidates] = useState<PlayerCandidate[]>([]);
	const [showDropdown, setShowDropdown] = useState(false);
	const [isSearching, setIsSearching] = useState(false);
	const searchDivRef = useRef<HTMLDivElement>(null);
	const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

	// Fetch candidates for dropdown (called while typing)
	const fetchCandidates = async (searchTerm: string) => {
		const trimmed = searchTerm.trim();
		
		// Basic validation - at least 2 characters for suggestions
		if (trimmed.length < 2) {
			setCandidates([]);
			setShowDropdown(false);
			return;
		}

		setIsSearching(true);
		try {
			const searchResponse = await fetch(
				`${baseUrl}/nhl/search-player?name=${encodeURIComponent(trimmed)}`
			);

			if (!searchResponse.ok) {
				if (searchResponse.status === 404) {
					setCandidates([]);
					setShowDropdown(false);
					return;
				}
				// Don't show error for autocomplete failures
				setCandidates([]);
				setShowDropdown(false);
				return;
			}

			const searchData = await searchResponse.json();
			const foundCandidates = searchData.candidates || [];

			if (foundCandidates.length === 0) {
				setCandidates([]);
				setShowDropdown(false);
			} else {
				// Show dropdown with candidates
				setCandidates(foundCandidates);
				setShowDropdown(true);
			}
		} catch (err) {
			// Don't show error for autocomplete failures
			setCandidates([]);
			setShowDropdown(false);
		} finally {
			setIsSearching(false);
		}
	};

	// Perform actual search (called from Search button)
	const performSearch = async (searchTerm: string) => {
		const trimmed = searchTerm.trim();
		
		// Validate input
		const { error } = nameSchema.validate(trimmed);
		if (error) {
			alert(error.details[0].message);
			return;
		}

		// Basic validation - at least 2 characters
		if (trimmed.length < 2) {
			alert('Please enter at least 2 characters to search.');
			return;
		}

		setIsSearching(true);
		try {
			const searchResponse = await fetch(
				`${baseUrl}/nhl/search-player?name=${encodeURIComponent(trimmed)}`
			);

			if (!searchResponse.ok) {
				if (searchResponse.status === 404) {
					alert('No players found matching your search.');
					setCandidates([]);
					setShowDropdown(false);
					return;
				}
				throw new Error(
					`Search failed: ${searchResponse.status} ${searchResponse.statusText}`
				);
			}

			const searchData = await searchResponse.json();
			const foundCandidates = searchData.candidates || [];

			if (foundCandidates.length === 0) {
				alert('No players found matching your search.');
				setCandidates([]);
				setShowDropdown(false);
			} else if (foundCandidates.length === 1) {
				// If only one result, select it automatically
				onPlayerSelect(foundCandidates[0].playerId);
				setCandidates([]);
				setShowDropdown(false);
				setValue(foundCandidates[0].fullName);
			} else {
				// Show dropdown with multiple candidates
				setCandidates(foundCandidates);
				setShowDropdown(true);
			}
		} catch (err) {
			alert('An error occurred while searching. Please try again.');
			setCandidates([]);
			setShowDropdown(false);
		} finally {
			setIsSearching(false);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		setValue(newValue);

		// Clear previous debounce timer
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		// Debounce candidate fetching - wait 300ms after user stops typing
		debounceTimerRef.current = setTimeout(() => {
			fetchCandidates(newValue);
		}, 300);
	};

	const handleSearch = () => {
		// Clear debounce timer and perform search immediately
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}
		performSearch(value.trim());
	};

	const handlePlayerSelect = (playerId: number, fullName: string) => {
		onPlayerSelect(playerId);
		setCandidates([]);
		setShowDropdown(false);
		setValue(fullName);
	};

	const handleCloseDropdown = () => {
		setShowDropdown(false);
		setCandidates([]);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleSearch();
		} else if (e.key === 'Escape') {
			setShowDropdown(false);
			setCandidates([]);
		}
	};

	// Cleanup debounce timer on unmount
	useEffect(() => {
		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, []);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				searchDivRef.current &&
				!searchDivRef.current.contains(event.target as Node)
			) {
				setShowDropdown(false);
			}
		};

		if (showDropdown) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showDropdown]);

	return (
		<div className={styles.searchDiv} ref={searchDivRef}>
			<input
				type="text"
				placeholder="Player name"
				value={value}
				onChange={handleInputChange}
				onKeyDown={handleKeyDown}
				className={styles.playerInput}
				disabled={disabled}
			/>
			<button
				type="button"
				className={styles.searchButton}
				onClick={handleSearch}
				disabled={disabled || isSearching}
			>
				{isSearching ? 'Searching...' : 'Search'}
			</button>
			{showDropdown && candidates.length > 0 && (
				<PlayerDropdown
					candidates={candidates}
					onSelect={handlePlayerSelect}
					onClose={handleCloseDropdown}
				/>
			)}
		</div>
	);
}
