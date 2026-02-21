import React from 'react';
import './loadingScreen.css';

interface LoadingScreenProps {
	loading: boolean;
}

export default function LoadingScreen({ loading }: LoadingScreenProps) {
	if (!loading) return null;

	return (
		<div className="loading-screen">
			<div className="spinner" />
			<div className="loading-text">Loading...</div>
		</div>
	);
}
