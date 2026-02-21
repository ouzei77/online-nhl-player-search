import React, { useState } from 'react';
import Joi from 'joi';
import styles from './SearchForm.module.css';

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

interface SearchFormProps {
	disabled: boolean;
	onSearch: (trimmedName: string) => void;
}

export default function SearchForm({ disabled, onSearch }: SearchFormProps) {
	const [value, setValue] = useState('');

	const handleSubmit = () => {
		const trimmed = value.trim();
		const { error } = nameSchema.validate(trimmed);

		if (error) {
			alert(error.details[0].message);
			return;
		}

		if (onSearch) {
			onSearch(trimmed);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleSubmit();
		}
	};

	return (
		<div className={styles.searchDiv}>
			<input
				type="text"
				placeholder="Player name"
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onKeyDown={handleKeyDown}
				className={styles.playerInput}
				disabled={disabled}
			/>
			<button
				type="button"
				className={styles.searchButton}
				onClick={handleSubmit}
				disabled={disabled}
			>
				Search
			</button>
		</div>
	);
}
