/**
 * NHL API Handler for Cloudflare Workers
 * Converted from Express.js server
 */

const NHL_API_BASE = 'https://api-web.nhle.com/v1';
const NHL_STATS_API_BASE = 'https://api.nhle.com/stats/rest/en';

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100;

// In-memory rate limit store (per worker instance)
// In production, consider using KV or Durable Objects for distributed rate limiting
interface RateLimitEntry {
	count: number;
	resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Team metadata cache
interface TeamMetaCache {
	timestamp: number;
	teams: any[];
	tricodes: string[];
}

let teamMetaCache: TeamMetaCache = {
	timestamp: 0,
	teams: [],
	tricodes: []
};

const TEAM_META_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Simple rate limiter for Workers
 */
function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
	const now = Date.now();
	const entry = rateLimitStore.get(identifier);

	if (!entry || now > entry.resetTime) {
		// Create new entry or reset expired one
		const resetTime = now + RATE_LIMIT_WINDOW_MS;
		rateLimitStore.set(identifier, {
			count: 1,
			resetTime
		});
		return {
			allowed: true,
			remaining: RATE_LIMIT_MAX_REQUESTS - 1,
			resetTime
		};
	}

	if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
		return {
			allowed: false,
			remaining: 0,
			resetTime: entry.resetTime
		};
	}

	entry.count++;
	return {
		allowed: true,
		remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
		resetTime: entry.resetTime
	};
}

/**
 * CORS headers helper
 */
function getCorsHeaders(origin: string | null, allowedOrigin: string): Headers {
	const headers = new Headers();
	
	if (origin && (origin === allowedOrigin || allowedOrigin === '*')) {
		headers.set('Access-Control-Allow-Origin', origin);
		headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
		headers.set('Access-Control-Allow-Headers', 'Content-Type');
		headers.set('Access-Control-Max-Age', '86400');
	}
	
	return headers;
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
function handleOptions(origin: string | null, allowedOrigin: string): Response {
	const headers = getCorsHeaders(origin, allowedOrigin);
	return new Response(null, { status: 204, headers });
}

/**
 * JSON response helper with CORS
 */
function jsonResponse(data: any, status: number = 200, origin: string | null, allowedOrigin: string): Response {
	const headers = getCorsHeaders(origin, allowedOrigin);
	headers.set('Content-Type', 'application/json');
	return new Response(JSON.stringify(data), { status, headers });
}

/**
 * Error response helper with CORS
 */
function errorResponse(message: string, status: number = 500, origin: string | null, allowedOrigin: string): Response {
	return jsonResponse({ error: message }, status, origin, allowedOrigin);
}

/**
 * Fetch team metadata from NHL Stats API
 */
async function fetchTeamMetaFromStats(): Promise<TeamMetaCache> {
	const now = Date.now();
	if (teamMetaCache.teams.length && now - teamMetaCache.timestamp < TEAM_META_TTL_MS) {
		return teamMetaCache;
	}

	const url = `${NHL_STATS_API_BASE}/team`;
	try {
		console.log('Fetching team metadata from NHL stats API...');
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'NHL-Card-App/1.0'
			}
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch team metadata: ${response.status}`);
		}

		const json = await response.json();
		const data = Array.isArray(json.data) ? json.data : [];
		const teams = data.filter((t: any) => t.leagueId === 133 && t.triCode);
		const tricodes = [...new Set(teams.map((t: any) => t.triCode))];
		
		teamMetaCache = { timestamp: now, teams, tricodes };
		console.log(`Loaded ${teams.length} team records from stats API; ${tricodes.length} unique tricodes`);
		
		return teamMetaCache;
	} catch (error: any) {
		console.error('Error fetching team metadata from stats API:', error.message);
		if (!teamMetaCache.teams.length) throw error;
		return teamMetaCache;
	}
}

/**
 * Get team tricodes
 */
async function getTeamTricodes(): Promise<string[]> {
	const meta = await fetchTeamMetaFromStats();
	return meta.tricodes;
}

/**
 * Lookup team by tricode
 */
async function lookupTeamByTricode(tricode: string): Promise<any> {
	if (!tricode) return null;
	const meta = await fetchTeamMetaFromStats();
	const matches = meta.teams.filter((t: any) => t.triCode === tricode);
	if (matches.length === 0) return null;
	
	const team = matches.reduce((latest: any, current: any) =>
		current.id > latest.id ? current : latest
	);
	
	return {
		id: team.id,
		franchiseId: team.franchiseId,
		fullName: team.fullName,
		triCode: team.triCode,
		rawTricode: team.rawTricode
	};
}

/**
 * Lookup team by teamId
 */
async function lookupTeamById(teamId: number): Promise<any> {
	if (!teamId) return null;
	const meta = await fetchTeamMetaFromStats();
	const team = meta.teams.find((t: any) => t.id === teamId);
	if (!team) return null;
	
	return {
		id: team.id,
		fullName: team.fullName,
		triCode: team.triCode
	};
}

/**
 * Lookup team abbreviation by team name
 */
async function lookupTeamAbbrevByName(teamName: string): Promise<string | null> {
	if (!teamName) return null;
	const meta = await fetchTeamMetaFromStats();
	const normalizedName = teamName.toLowerCase().trim();
	
	// Try to find team by full name
	const team = meta.teams.find((t: any) => {
		const fullName = (t.fullName || '').toLowerCase().trim();
		// Check exact match or if one contains the other
		return fullName === normalizedName || 
		       fullName.includes(normalizedName) || 
		       normalizedName.includes(fullName) ||
		       // Also check if team name matches common patterns (e.g., "Oilers" in "Edmonton Oilers")
		       fullName.split(' ').some((word: string) => word === normalizedName) ||
		       normalizedName.split(' ').some((word: string) => word && fullName.includes(word));
	});
	
	return team ? team.triCode : null;
}

/**
 * Enrich team data with metadata
 */
async function enrichTeamData(teamData: any): Promise<any> {
	if (!teamData || !teamData.abbreviation) return teamData;
	const meta = await lookupTeamByTricode(teamData.abbreviation);
	if (!meta) return teamData;
	
	return {
		id: teamData.id || meta.id || null,
		name: teamData.name || meta.fullName || '',
		abbreviation: teamData.abbreviation || meta.triCode || '',
		alias: teamData.alias || meta.triCode || '',
		franchiseId: meta.franchiseId || null,
		logoUrl: teamData.logoUrl || null
	};
}

/**
 * Search player directory using NHL Stats API
 */
async function searchPlayerDirectory(rawName: string): Promise<any> {
	const name = (rawName || '').trim();
	if (!name) {
		throw new Error('Name is required for player search');
	}

	// Normalize the name to Title Case for the Stats API
	// Handles special cases like "Mc" and "Mac" prefixes
	const toTitleCase = (s: string) => {
		if (!s) return '';
		const lower = s.toLowerCase().trim();
		
		// Handle "Mc" prefix (e.g., "mcdavid" -> "McDavid")
		if (lower.startsWith('mc') && lower.length > 2) {
			return 'Mc' + lower.charAt(2).toUpperCase() + lower.slice(3);
		}
		
		// Handle "Mac" prefix (e.g., "mackinnon" -> "MacKinnon")
		if (lower.startsWith('mac') && lower.length > 3) {
			return 'Mac' + lower.charAt(3).toUpperCase() + lower.slice(4);
		}
		
		// Standard Title Case
		return lower.charAt(0).toUpperCase() + lower.slice(1);
	};

	const parts = name.split(/\s+/);
	let lastNameRaw = parts[parts.length - 1];
	let firstNameRaw = parts.length > 1 ? parts.slice(0, -1).join(' ') : null;

	lastNameRaw = toTitleCase(lastNameRaw);
	if (firstNameRaw) {
		firstNameRaw = toTitleCase(firstNameRaw);
	}

	// Escape single quotes for SQL-like cayenneExp syntax
	const escapeSqlString = (s: string) => s.replace(/'/g, "''");

	let cayenneExp = `lastName like '${escapeSqlString(lastNameRaw)}%'`;
	if (firstNameRaw) {
		cayenneExp = `firstName like '${escapeSqlString(firstNameRaw)}%' and ${cayenneExp}`;
	}

	const url = `${NHL_STATS_API_BASE}/players?sort=lastName&limit=25&cayenneExp=${encodeURIComponent(cayenneExp)}`;

	console.log('[INFO] Searching players via NHL Stats API:', url);

	const response = await fetch(url, {
		headers: {
			'User-Agent': 'NHL-Card-App/1.0'
		}
	});

	if (!response.ok) {
		throw new Error(`Failed to search players: ${response.status}`);
	}

	const json = await response.json();
	const rows = Array.isArray(json.data) ? json.data : [];

	// Normalizer for robust comparison
	const normalize = (s: string) =>
		(s || '')
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase()
			.trim()
			.replace(/\s+/g, ' ');

	const inputNorm = normalize(name);

	const candidates = await Promise.all(
		rows
			.map(async (row: any) => {
				const playerId = row.playerId ?? row.id;
				const fullName = row.fullName || row.skaterFullName || row.goalieFullName;
				const teamId = row.teamId ?? row.currentTeamId ?? null;
				
				if (!playerId || !fullName) return null;
				
				// Only include players with an active team (on a roster)
				if (!teamId) return null;
				
				// Lookup team name - if team doesn't exist, player is not active
				const team = await lookupTeamById(teamId);
				if (!team) return null; // Team not found = player not on active roster
				
				const teamName = team.fullName || null;
				
				return {
					playerId,
					fullName,
					teamId,
					teamName
				};
			})
	);
	
	// Filter out null values (players without active teams)
	const validCandidates = candidates.filter((c: any) => c !== null);

	if (!validCandidates.length) {
		return [];
	}

	// Sort candidates: exact match first, then by relevance
	const exactMatch = validCandidates.find((c: any) => normalize(c.fullName) === inputNorm);
	
	// If exact match found, put it first, otherwise use all candidates
	const sortedCandidates = exactMatch
		? [exactMatch, ...validCandidates.filter((c: any) => c !== exactMatch)]
		: validCandidates;

	// Return top 5 candidates
	return sortedCandidates.slice(0, 5);
}

/**
 * Resolve localized string from NHL API response
 */
function resolveLocalizedString(value: any): string {
	if (!value) return '';
	if (typeof value === 'string') return value;
	if (typeof value === 'object') {
		if (typeof value.default === 'string') return value.default;
		const firstKey = Object.keys(value).find(
			(k) => typeof value[k] === 'string'
		);
		return firstKey ? value[firstKey] : '';
	}
	return String(value);
}

/**
 * NHL Team Name to Abbreviation Mapping
 */
const nhlTeamAbbreviations: Record<string, string> = {
	"Anaheim Ducks": "ANA",
	"Boston Bruins": "BOS",
	"Buffalo Sabres": "BUF",
	"Calgary Flames": "CGY",
	"Carolina Hurricanes": "CAR",
	"Chicago Blackhawks": "CHI",
	"Colorado Avalanche": "COL",
	"Columbus Blue Jackets": "CBJ",
	"Dallas Stars": "DAL",
	"Detroit Red Wings": "DET",
	"Edmonton Oilers": "EDM",
	"Florida Panthers": "FLA",
	"Los Angeles Kings": "LAK",
	"Minnesota Wild": "MIN",
	"Montreal Canadiens": "MTL",
	"Montréal Canadiens": "MTL", // Catching potential accents
	"Nashville Predators": "NSH",
	"New Jersey Devils": "NJD",
	"New York Islanders": "NYI",
	"New York Rangers": "NYR",
	"Ottawa Senators": "OTT",
	"Philadelphia Flyers": "PHI",
	"Pittsburgh Penguins": "PIT",
	"San Jose Sharks": "SJS",
	"Seattle Kraken": "SEA",
	"St. Louis Blues": "STL",
	"St Louis Blues": "STL", // Catching missing periods
	"Tampa Bay Lightning": "TBL",
	"Toronto Maple Leafs": "TOR",
	"Utah Mammoth": "UTA", // Updated from Utah Hockey Club
	"Vancouver Canucks": "VAN",
	"Vegas Golden Knights": "VGK",
	"Washington Capitals": "WSH",
	"Winnipeg Jets": "WPG"
};

/**
 * Inject team abbreviations into seasonTotals entries
 */
function injectTeamAbbrev(seasonTotals: any[]): any[] {
	if (!Array.isArray(seasonTotals)) {
		return seasonTotals;
	}

	return seasonTotals.map((season: any) => {
		// Only attempt to map if it's an NHL season and we have a team name
		if (season.leagueAbbrev === "NHL" && season.teamName) {
			const fullName = resolveLocalizedString(season.teamName);
			
			// Inject the abbreviation, fallback to null if not found in dict
			if (fullName && nhlTeamAbbreviations[fullName]) {
				season.teamAbbrev = nhlTeamAbbreviations[fullName];
			}
		}
		return season;
	});
}

/**
 * Fetch player data from NHL API
 */
async function fetchPlayerDataFromNhl(playerId: number): Promise<any> {
	try {
		const landingRes = await fetch(`${NHL_API_BASE}/player/${playerId}/landing`);
		if (!landingRes.ok) {
			throw new Error(`Failed to fetch player profile: ${landingRes.status}`);
		}
		const landingData = await landingRes.json();
		console.log(
			`[DEBUG] Landing data keys for player ${playerId}:`,
			Object.keys(landingData)
		);

		// Basic player & team info
		const firstName = resolveLocalizedString(landingData.firstName);
		const lastName = resolveLocalizedString(landingData.lastName);
		const slug = resolveLocalizedString(landingData.playerSlug);
		const fullNameCandidate = `${firstName} ${lastName}`.trim();
		const fullName = fullNameCandidate || slug || '';

		const primaryNumber = landingData.sweaterNumber ?? null;
		const primaryPosition = landingData.position ?? null;
		const teamAbbrev = landingData.currentTeamAbbrev || null;
		const teamName = resolveLocalizedString(
			landingData.fullTeamName || landingData.teamCommonName
		);
		const currentTeamId = landingData.currentTeamId ?? null;

		if (!fullName) {
			console.error(
				`[ERROR] Player ${playerId} data structure:`,
				JSON.stringify(landingData, null, 2)
			);
			throw new Error('Player profile not found - missing name information');
		}

		const isGoalie = primaryPosition === 'G';

		// Stats parsing based on official landing structure
		const featuredStats = landingData.featuredStats || {};
		const careerTotals = landingData.careerTotals || featuredStats.careerTotals || {};
		let seasonTotalsArray =
			Array.isArray(landingData.seasonTotals) && landingData.seasonTotals.length
				? landingData.seasonTotals
				: Array.isArray(featuredStats.seasonTotals)
				? featuredStats.seasonTotals
				: [];
		
		// Inject team abbreviations into seasonTotals entries
		seasonTotalsArray = injectTeamAbbrev(seasonTotalsArray);

		const normalizeSkaterTotals = (src: any = {}) => ({
			games: src.gamesPlayed ?? src.games ?? src.gp ?? 0,
			goals: src.goals ?? src.g ?? 0,
			assists: src.assists ?? src.a ?? 0,
			points:
				src.points ??
				src.p ??
				((src.goals || 0) + (src.assists || 0)),
			plusMinus: src.plusMinus ?? src.plus_minus ?? 0
		});

		const normalizeGoalieTotals = (src: any = {}) => {
			const games = src.gamesPlayed ?? src.games ?? src.gp ?? 0;
			const goalsAgainst = src.goalsAgainst ?? src.ga ?? null;
			
			// Try multiple field name variations for GAA
			// Note: The API actually uses 'goalsAgainstAvg' (with 's'), so check that first
			let goalAgainstAverage = 
				src.goalsAgainstAvg ??
				src.goalAgainstAverage ??
				src.gaa ??
				src.goalAgainstAvg ??
				src.goalsAgainstAverage ??
				null;
			
			// If GAA is not directly available, calculate it from goals against and games played
			if (goalAgainstAverage == null && goalsAgainst != null && games > 0) {
				goalAgainstAverage = goalsAgainst / games;
			}
			
			return {
				games,
				wins: src.wins ?? src.w ?? 0,
				shutouts: src.shutouts ?? src.so ?? 0,
				savePercentage:
					src.savePctg ??
					src.savePct ??
					src.savePercentage ??
					src.savesPct ??
					null,
				goalAgainstAverage
			};
		};

		// Last 5 NHL seasons - include both regular season and playoffs
		// seasonTotals is an array where each entry has gameTypeId (2 = regular, 3 = playoffs)
		const nhlSeasons = seasonTotalsArray.filter((s: any) => s.leagueAbbrev === 'NHL');
		
		// Group by season and gameTypeId
		const seasonMap = new Map<string, { regular: any; playoffs: any }>();
		
		for (const entry of nhlSeasons) {
			const seasonId = String(entry.season || '');
			const gameTypeId = entry.gameTypeId;
			
			if (!seasonMap.has(seasonId)) {
				seasonMap.set(seasonId, { regular: null, playoffs: null });
			}
			
			const seasonData = seasonMap.get(seasonId)!;
			
			if (gameTypeId === 2) {
				// Regular season
				seasonData.regular = entry;
			} else if (gameTypeId === 3) {
				// Playoffs
				seasonData.playoffs = entry;
			}
		}

		// Calculate current season ID based on current date
		// NHL seasons typically start in October, so if we're in October or later, use current year
		// Otherwise, use previous year as the season start
		const now = new Date();
		const currentYear = now.getFullYear();
		const currentMonth = now.getMonth(); // 0-11, where 9 = October
		const seasonStartYear = currentMonth >= 9 ? currentYear : currentYear - 1;
		const currentSeasonId = `${seasonStartYear}${seasonStartYear + 1}`;
		
		// Get current season stats from seasonMap
		const currentSeasonData = seasonMap.get(currentSeasonId) || { regular: null, playoffs: null };
		
		// Fallback to featuredStats ONLY if it matches the current season.
		// featuredStats.season contains the season the stats are for — if it doesn't
		// match the current season, the player hasn't played yet and stats should be null.
		const featuredMatchesCurrent =
			featuredStats?.season != null &&
			String(featuredStats.season) === currentSeasonId;

		const currentRegularRaw = currentSeasonData.regular ||
			(featuredMatchesCurrent ? featuredStats?.regularSeason?.subSeason ?? null : null);
		const currentPlayoffRaw = currentSeasonData.playoffs ||
			(featuredMatchesCurrent ? featuredStats?.playoffs?.subSeason ?? null : null);

		const latestRegularTotals =
			currentRegularRaw && !isGoalie
				? normalizeSkaterTotals(currentRegularRaw)
				: currentRegularRaw && isGoalie
				? normalizeGoalieTotals(currentRegularRaw)
				: null;

		const latestPlayoffTotals =
			currentPlayoffRaw && !isGoalie
				? normalizeSkaterTotals(currentPlayoffRaw)
				: currentPlayoffRaw && isGoalie
				? normalizeGoalieTotals(currentPlayoffRaw)
				: null;
		
		// Get unique seasons, sort by season (newest first), and take top 5
		const uniqueSeasons = Array.from(seasonMap.keys())
			.sort((a, b) => {
				const sa = parseInt(a || '0', 10);
				const sb = parseInt(b || '0', 10);
				return sb - sa;
			})
			.slice(0, 5);
		
		const regularSeasons = uniqueSeasons.map((seasonId) => {
			const seasonData = seasonMap.get(seasonId)!;
			
			const regularStats = seasonData.regular
				? (!isGoalie
					? normalizeSkaterTotals(seasonData.regular)
					: normalizeGoalieTotals(seasonData.regular))
				: null;
			
			const playoffsStats = seasonData.playoffs
				? (!isGoalie
					? normalizeSkaterTotals(seasonData.playoffs)
					: normalizeGoalieTotals(seasonData.playoffs))
				: null;
			
			// Extract team abbreviation directly from the raw entry
			// The seasonTotals entries have teamAbbrev field directly
			const teamSource = seasonData.regular ? seasonData.regular : (seasonData.playoffs ? seasonData.playoffs : null);
			// Check for teamAbbrev directly on the entry (this is the correct field from the API)
			const teamAbbrev = teamSource?.teamAbbrev || null;
			
			return {
				season: seasonId,
				regular: regularStats,
				playoffs: playoffsStats,
				team: teamAbbrev || null  // Only return abbreviation, never full name
			};
		});

		// Career totals
		const careerBase =
			(careerTotals && careerTotals.regularSeason) || careerTotals || {};

		const careerStat = !isGoalie
			? normalizeSkaterTotals(careerBase)
			: normalizeGoalieTotals(careerBase);

		console.log(
			`[DEBUG] Landing-based stats for player ${playerId} – games: ${careerStat.games}, goals: ${careerStat.goals}, assists: ${careerStat.assists}, points: ${careerStat.points}`
		);

		const latestTeamStats =
			latestRegularTotals && !isGoalie
				? {
						games_played: latestRegularTotals.games || 0,
						goals: latestRegularTotals.goals || 0,
						assists: latestRegularTotals.assists || 0,
						points: latestRegularTotals.points || 0,
						plus_minus: latestRegularTotals.plusMinus || 0
					}
				: null;

		const latestGoalieStats =
			latestRegularTotals && isGoalie
				? {
						games_played: latestRegularTotals.games || 0,
						wins: latestRegularTotals.wins || 0,
						shutouts: latestRegularTotals.shutouts || 0,
						saves_pct: latestRegularTotals.savePercentage || 0,
						avg_goals_against:
							latestRegularTotals.goalAgainstAverage || 0
					}
				: null;

		const careerStats = {
			totalGamesPlayed: careerStat.games || 0,
			totalGoals: careerStat.goals || 0,
			totalAssists: careerStat.assists || 0,
			totalPoints: careerStat.points || 0,
			totalPlusMinus: careerStat.plusMinus || 0,
			totalWins: careerStat.wins || 0,
			totalSOs: careerStat.shutouts || 0,
			totalSVpct: careerStat.savePercentage || 0,
			totalGAA: careerStat.goalAgainstAverage || 0
		};

		let teamData = teamAbbrev
			? {
					id: currentTeamId,
					name: teamName || '',
					abbreviation: teamAbbrev
				}
			: {
					id: null,
					name: teamName || '',
					abbreviation: teamAbbrev || ''
				};

		teamData = await enrichTeamData(teamData);

		const finalTeamAbbrev = teamData.abbreviation || teamAbbrev || '';
		const teamLogoUrl = finalTeamAbbrev
			? `https://assets.nhle.com/logos/nhl/svg/${finalTeamAbbrev}_light.svg`
			: null;

		// Headshot mug URL
		const currentYearForMug = now.getFullYear();
		const currentMonthForMug = now.getMonth();
		const mugSeasonStartYear =
			currentMonthForMug < 9 ? currentYearForMug - 1 : currentYearForMug;
		const mugSeasonId = `${mugSeasonStartYear}${mugSeasonStartYear + 1}`;
		const teamCodeForMug = finalTeamAbbrev || teamAbbrev || '';
		const headshotUrl = teamCodeForMug
			? `https://assets.nhle.com/mugs/nhl/${mugSeasonId}/${teamCodeForMug}/${playerId}.png`
			: 'https://assets.nhle.com/mugs/nhl/default-skater.png';

		const formatSkaterStats = (stats: any) => ({
			games_played: stats.games || 0,
			goals: stats.goals || 0,
			assists: stats.assists || 0,
			points: stats.points || 0,
			plus_minus: stats.plusMinus || 0
		});

		const formatGoalieStats = (stats: any) => ({
			games_played: stats.games || 0,
			wins: stats.wins || 0,
			shutouts: stats.shutouts || 0,
			saves_pct: stats.savePercentage || 0,
			avg_goals_against: stats.goalAgainstAverage || 0
		});

		const currentSeasonRegularStats =
			latestRegularTotals && !isGoalie
				? formatSkaterStats(latestRegularTotals)
				: latestRegularTotals && isGoalie
				? formatGoalieStats(latestRegularTotals)
				: null;

		const currentSeasonPlayoffStats =
			latestPlayoffTotals && !isGoalie
				? formatSkaterStats(latestPlayoffTotals)
				: latestPlayoffTotals && isGoalie
				? formatGoalieStats(latestPlayoffTotals)
				: null;

		const last5SeasonsFormatted = regularSeasons.map((season: any) => ({
			season: season.season,
			regular: season.regular
				? (!isGoalie
					? formatSkaterStats(season.regular)
					: formatGoalieStats(season.regular))
				: null,
			playoffs: season.playoffs
				? (!isGoalie
					? formatSkaterStats(season.playoffs)
					: formatGoalieStats(season.playoffs))
				: null,
			team: season.team || null
		}));

		return {
			full_name: fullName,
			team: {
				id: teamData.id || null,
				name: teamData.name || '',
				alias: teamData.abbreviation || teamData.alias || '',
				logoUrl: teamLogoUrl
			},
			jersey_number: primaryNumber || null,
			primary_position: primaryPosition,
			headshotUrl,
			currentSeason: {
				regular: currentSeasonRegularStats,
				playoffs: currentSeasonPlayoffStats
			},
			last5Seasons: last5SeasonsFormatted,
			seasons: [
				{
					teams: [
						{
							statistics: latestTeamStats ? { total: latestTeamStats } : null,
							goaltending: latestGoalieStats ? { total: latestGoalieStats } : null
						}
					]
				}
			],
			careerStats
		};
	} catch (error: any) {
		console.error('Error in fetchPlayerDataFromNhl:', error.message);
		console.error('Stack:', error.stack);
		if (
			error.code === 'ENOTFOUND' ||
			error.message.includes('getaddrinfo') ||
			error.message.includes('ENOTFOUND')
		) {
			console.error('DNS resolution failed for NHL API when fetching player data.');
			console.error('Error details:', error.message);
			throw new Error('Cannot reach NHL Stats API. Please check your internet connection and DNS settings.');
		}
		throw error;
	}
}

/**
 * Main NHL API router
 */
export async function handleNhlApi(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const origin = request.headers.get('Origin');
	const allowedOrigin = (env.CLIENT_ORIGIN as string) || '*';

	// Handle CORS preflight
	if (request.method === 'OPTIONS') {
		return handleOptions(origin, allowedOrigin);
	}

	// Rate limiting
	const clientId = request.headers.get('CF-Connecting-IP') || 'unknown';
	const rateLimit = checkRateLimit(clientId);

	if (!rateLimit.allowed) {
		const headers = getCorsHeaders(origin, allowedOrigin);
		headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS));
		headers.set('X-RateLimit-Remaining', '0');
		headers.set('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString());
		headers.set('Retry-After', String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)));
		return new Response(
			JSON.stringify({ error: 'Too many requests' }),
			{
				status: 429,
				headers
			}
		);
	}

	// Add rate limit headers to successful responses
	const addRateLimitHeaders = (response: Response): Response => {
		const headers = new Headers(response.headers);
		headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS));
		headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
		headers.set('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString());
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers
		});
	};

	// Route handlers
	try {
		if (url.pathname === '/nhl/search-player') {
			const name = url.searchParams.get('name')?.trim();
			if (!name) {
				return addRateLimitHeaders(
					errorResponse('Name query parameter is required', 400, origin, allowedOrigin)
				);
			}

			const matches = await searchPlayerDirectory(name);
			if (!matches || matches.length === 0) {
				return addRateLimitHeaders(
					errorResponse('Player not found in NHL Stats directory', 404, origin, allowedOrigin)
				);
			}

			return addRateLimitHeaders(
				jsonResponse(
					{
						candidates: matches
					},
					200,
					origin,
					allowedOrigin
				)
			);
		}

		if (url.pathname === '/nhl/player-data') {
			const playerIdParam = url.searchParams.get('playerId');
			const playerId = playerIdParam ? parseInt(playerIdParam, 10) : NaN;

			if (!playerId || Number.isNaN(playerId)) {
				return addRateLimitHeaders(
					errorResponse('Valid playerId query parameter is required', 400, origin, allowedOrigin)
				);
			}

			const data = await fetchPlayerDataFromNhl(playerId);
			return addRateLimitHeaders(
				jsonResponse(data, 200, origin, allowedOrigin)
			);
		}

		if (url.pathname === '/nhl/today-schedule') {
			const today = new Date();
			const dateStr = today.toISOString().slice(0, 10);
			const teamIdParam = url.searchParams.get('teamId');
			const teamId = teamIdParam ? parseInt(teamIdParam, 10) : null;

			const response = await fetch(`${NHL_API_BASE}/schedule?date=${dateStr}`);
			if (!response.ok) {
				throw new Error(`Failed to fetch schedule: ${response.status}`);
			}

			const data = await response.json();
			const dates = data.dates || [];
			const games = dates[0]?.games || [];
			let filteredGames = games;

			if (teamId && !Number.isNaN(teamId)) {
				filteredGames = games.filter((g: any) =>
					g.teams &&
					((g.teams.home.team && g.teams.home.team.id === teamId) ||
						(g.teams.away.team && g.teams.away.team.id === teamId))
				);
			}

			const simplified = filteredGames.map((g: any) => ({
				gamePk: g.gamePk,
				status: g.status && g.status.detailedState,
				startTime: g.gameDate,
				home: {
					id: g.teams.home.team.id,
					name: g.teams.home.team.name,
					abbrev: g.teams.home.team.abbreviation,
					score: g.teams.home.score
				},
				away: {
					id: g.teams.away.team.id,
					name: g.teams.away.team.name,
					abbrev: g.teams.away.team.abbreviation,
					score: g.teams.away.score
				}
			}));

			return jsonResponse({ date: dateStr, games: simplified }, 200, origin, allowedOrigin);
		}

		if (url.pathname === '/nhl/game-linescore') {
			const gamePk = url.searchParams.get('gamePk');
			if (!gamePk) {
				return errorResponse('gamePk query parameter is required', 400, origin, allowedOrigin);
			}

			const response = await fetch(`${NHL_API_BASE}/game/${gamePk}/linescore`);
			if (!response.ok) {
				throw new Error(`Failed to fetch linescore: ${response.status}`);
			}

			const data = await response.json();
			return jsonResponse(data, 200, origin, allowedOrigin);
		}

		// 404 for unknown routes
		return errorResponse('Not found', 404, origin, allowedOrigin);
	} catch (error: any) {
		console.error('Error in NHL API handler:', error.message);
		console.error('Stack trace:', error.stack);
		return errorResponse(
			'Internal server error',
			500,
			origin,
			allowedOrigin
		);
	}
}
