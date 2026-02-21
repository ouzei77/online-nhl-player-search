# NHL API Landing Endpoint Documentation

## Endpoint

**URL:** `https://api-web.nhle.com/v1/player/{playerId}/landing`

**Method:** `GET`

**Description:** Fetches comprehensive player profile data including current season stats, career totals, historical season data, awards, recent games, and team roster information.

## Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `playerId` | `number` | Yes | NHL player ID (e.g., `8478402` for Connor McDavid) |

## Response Headers

**Note:** Actual response headers should be captured from a real API call. The headers below are typical for JSON API endpoints and may vary:

```
Content-Type: application/json
Content-Length: <size>
Cache-Control: <cache-control-directives>
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

To capture actual headers, inspect the response object in your browser's developer tools or log them in your code:

```typescript
const response = await fetch(`${NHL_API_BASE}/player/${playerId}/landing`);
console.log('Response headers:', Object.fromEntries(response.headers.entries()));
```

## Response Structure

The response is a JSON object containing comprehensive player information. Below is the complete structure:

### Root Level Fields

| Field | Type | Description |
|-------|------|-------------|
| `playerId` | `number` | Unique NHL player identifier |
| `isActive` | `boolean` | Whether the player is currently active |
| `currentTeamId` | `number` | Current team's NHL ID |
| `currentTeamAbbrev` | `string` | Current team abbreviation (e.g., "EDM") |
| `fullTeamName` | `object` | Localized team name object |
| `teamCommonName` | `object` | Localized team common name |
| `teamPlaceNameWithPreposition` | `object` | Localized team place name |
| `firstName` | `object` | Localized first name |
| `lastName` | `object` | Localized last name |
| `badges` | `array` | Array of player badges/achievements |
| `teamLogo` | `string` | URL to team logo SVG |
| `sweaterNumber` | `number` | Player's jersey number |
| `position` | `string` | Player position (e.g., "C", "LW", "RW", "D", "G") |
| `headshot` | `string` | URL to player headshot image |
| `heroImage` | `string` | URL to player hero/action shot image |
| `heightInInches` | `number` | Player height in inches |
| `heightInCentimeters` | `number` | Player height in centimeters |
| `weightInPounds` | `number` | Player weight in pounds |
| `weightInKilograms` | `number` | Player weight in kilograms |
| `birthDate` | `string` | Birth date in ISO format (YYYY-MM-DD) |
| `birthCity` | `object` | Localized birth city |
| `birthStateProvince` | `object` | Localized birth state/province |
| `birthCountry` | `string` | Birth country code (e.g., "CAN") |
| `shootsCatches` | `string` | Handedness ("L" or "R") |
| `draftDetails` | `object` | Draft information |
| `playerSlug` | `string` | URL-friendly player identifier |
| `inTop100AllTime` | `number` | Top 100 all-time ranking (0 if not ranked) |
| `inHHOF` | `number` | Hockey Hall of Fame status (0 or 1) |
| `featuredStats` | `object` | Current season featured statistics |
| `careerTotals` | `object` | Career totals for regular season and playoffs |
| `shopLink` | `string` | Link to player merchandise (may be "#TODO") |
| `twitterLink` | `string` | Link to player Twitter (may be "#TODO") |
| `watchLink` | `string` | Link to watch player content (may be "#TODO") |
| `last5Games` | `array` | Array of last 5 game statistics |
| `seasonTotals` | `array` | Array of all season statistics |
| `awards` | `array` | Array of player awards and trophies |
| `currentTeamRoster` | `array` | Array of current team roster players |

### Localized String Objects

Many fields use localized string objects with the following structure:

```json
{
  "default": "English text",
  "fr": "French text",
  "cs": "Czech text",
  "de": "German text",
  "es": "Spanish text",
  "fi": "Finnish text",
  "sk": "Slovak text",
  "sv": "Swedish text"
}
```

**Fields using localized strings:**
- `fullTeamName`
- `teamCommonName`
- `teamPlaceNameWithPreposition`
- `firstName`
- `lastName`
- `birthCity`
- `birthStateProvince`

### Draft Details Object

```json
{
  "year": 2015,
  "teamAbbrev": "EDM",
  "round": 1,
  "pickInRound": 1,
  "overallPick": 1
}
```

### Featured Stats Object

```json
{
  "season": 20252026,
  "regularSeason": {
    "subSeason": {
      "assists": 62,
      "gameWinningGoals": 2,
      "gamesPlayed": 58,
      "goals": 34,
      "otGoals": 1,
      "pim": 22,
      "plusMinus": 11,
      "points": 96,
      "powerPlayGoals": 10,
      "powerPlayPoints": 39,
      "shootingPctg": 0.154545,
      "shorthandedGoals": 1,
      "shorthandedPoints": 2,
      "shots": 220
    },
    "career": {
      "assists": 783,
      "gameWinningGoals": 74,
      "gamesPlayed": 770,
      "goals": 395,
      "otGoals": 17,
      "pim": 308,
      "plusMinus": 180,
      "points": 1178,
      "powerPlayGoals": 97,
      "powerPlayPoints": 403,
      "shootingPctg": 0.1503,
      "shorthandedGoals": 9,
      "shorthandedPoints": 19,
      "shots": 2627
    }
  }
}
```

### Career Totals Object

```json
{
  "regularSeason": {
    "assists": 783,
    "avgToi": "21:50",
    "faceoffWinningPctg": 0.4769,
    "gameWinningGoals": 74,
    "gamesPlayed": 770,
    "goals": 395,
    "otGoals": 17,
    "pim": 308,
    "plusMinus": 180,
    "points": 1178,
    "powerPlayGoals": 97,
    "powerPlayPoints": 403,
    "shootingPctg": 0.1503,
    "shorthandedGoals": 9,
    "shorthandedPoints": 19,
    "shots": 2627
  },
  "playoffs": {
    "assists": 106,
    "avgToi": "23:38",
    "faceoffWinningPctg": 0.45909999999999995,
    "gameWinningGoals": 5,
    "gamesPlayed": 96,
    "goals": 44,
    "otGoals": 2,
    "pim": 28,
    "plusMinus": 31,
    "points": 150,
    "powerPlayGoals": 13,
    "powerPlayPoints": 54,
    "shootingPctg": 0.1333,
    "shorthandedGoals": 2,
    "shorthandedPoints": 3,
    "shots": 330
  }
}
```

### Last 5 Games Array

Each game object in the `last5Games` array contains:

```json
{
  "assists": 1,
  "gameDate": "2026-02-04",
  "gameId": 2025020900,
  "gameTypeId": 2,
  "goals": 0,
  "homeRoadFlag": "R",
  "opponentAbbrev": "CGY",
  "pim": 0,
  "plusMinus": 0,
  "points": 1,
  "powerPlayGoals": 0,
  "shifts": 23,
  "shorthandedGoals": 0,
  "shots": 8,
  "teamAbbrev": "EDM",
  "toi": "26:30"
}
```

**Game Type IDs:**
- `2` = Regular Season
- `3` = Playoffs
- `4` = Pre-season
- Other values may represent tournaments or special events

**Home/Road Flag:**
- `"H"` = Home game
- `"R"` = Road game

### Season Totals Array

Each entry in the `seasonTotals` array represents a season or tournament:

```json
{
  "assists": 62,
  "gameTypeId": 2,
  "gamesPlayed": 58,
  "goals": 34,
  "leagueAbbrev": "NHL",
  "pim": 22,
  "plusMinus": 11,
  "points": 96,
  "powerPlayGoals": 10,
  "powerPlayPoints": 39,
  "season": 20252026,
  "sequence": 1,
  "shootingPctg": 0.154545,
  "shorthandedGoals": 1,
  "shorthandedPoints": 2,
  "shots": 220,
  "teamCommonName": {
    "default": "Oilers"
  },
  "teamName": {
    "default": "Edmonton Oilers",
    "fr": "Oilers d'Edmonton"
  },
  "teamPlaceNameWithPreposition": {
    "default": "Edmonton",
    "fr": "d'Edmonton"
  }
}
```

**Common League Abbreviations:**
- `"NHL"` = National Hockey League
- `"OHL"` = Ontario Hockey League
- `"GTHL"` = Greater Toronto Hockey League
- `"WJC-A"` = World Junior Championship
- `"WC-A"` = World Championship
- `"WCup"` = World Cup
- `"OG"` = Olympic Games
- `"4 Nations"` = 4 Nations Face-Off

**Additional fields for goalies:**
- `avgToi` = Average Time on Ice (format: "MM:SS")
- `faceoffWinningPctg` = Faceoff winning percentage (0.0 to 1.0)

### Awards Array

Each award object contains:

```json
{
  "trophy": {
    "default": "Art Ross Trophy",
    "fr": "Trophée Art Ross"
  },
  "seasons": [
    {
      "assists": 89,
      "blockedShots": 40,
      "gameTypeId": 2,
      "gamesPlayed": 82,
      "goals": 64,
      "hits": 89,
      "pim": 36,
      "plusMinus": 22,
      "points": 153,
      "seasonId": 20222023
    }
  ]
}
```

### Current Team Roster Array

Each roster entry contains minimal player information:

```json
{
  "playerId": 8480803,
  "lastName": {
    "default": "Bouchard"
  },
  "firstName": {
    "default": "Evan"
  },
  "playerSlug": "evan-bouchard-8480803"
}
```

## Statistics Fields Reference

### Skater Statistics

| Field | Type | Description |
|-------|------|-------------|
| `assists` | `number` | Number of assists |
| `gameWinningGoals` | `number` | Game-winning goals |
| `gamesPlayed` | `number` | Games played |
| `goals` | `number` | Goals scored |
| `otGoals` | `number` | Overtime goals |
| `pim` | `number` | Penalty minutes |
| `plusMinus` | `number` | Plus/minus rating |
| `points` | `number` | Total points (goals + assists) |
| `powerPlayGoals` | `number` | Power play goals |
| `powerPlayPoints` | `number` | Power play points |
| `shootingPctg` | `number` | Shooting percentage (0.0 to 1.0) |
| `shorthandedGoals` | `number` | Shorthanded goals |
| `shorthandedPoints` | `number` | Shorthanded points |
| `shots` | `number` | Total shots on goal |
| `avgToi` | `string` | Average time on ice (format: "MM:SS") |
| `faceoffWinningPctg` | `number` | Faceoff winning percentage (0.0 to 1.0) |
| `blockedShots` | `number` | Blocked shots (in awards context) |
| `hits` | `number` | Hits delivered (in awards context) |

### Goaltender Statistics

| Field | Type | Description |
|-------|------|-------------|
| `gamesPlayed` | `number` | Games played |
| `wins` | `number` | Wins |
| `shutouts` | `number` | Shutouts |
| `savePctg` / `savePercentage` | `number` | Save percentage (0.0 to 1.0) |
| `goalAgainstAverage` / `gaa` | `number` | Goals against average |
| `avgToi` | `string` | Average time on ice (format: "MM:SS") |

## Example Response

See the provided JSON sample for a complete example response for player ID `8478402` (Connor McDavid).

## Error Responses

The API may return standard HTTP error codes:

- `400 Bad Request` - Invalid player ID format
- `404 Not Found` - Player not found
- `500 Internal Server Error` - Server error
- `429 Too Many Requests` - Rate limit exceeded

## Notes

1. **Localization**: Many text fields support multiple languages. Always check for a `default` key first, then fall back to other language keys if needed.

2. **Season Format**: Seasons are represented as 8-digit numbers (e.g., `20252026` for the 2025-26 season).

3. **Game Type IDs**: 
   - `2` = Regular Season
   - `3` = Playoffs
   - Other values may represent tournaments, pre-season, or special events

4. **Image URLs**: 
   - Headshots: `https://assets.nhle.com/mugs/nhl/{season}/{teamAbbrev}/{playerId}.png`
   - Team logos: `https://assets.nhle.com/logos/nhl/svg/{teamAbbrev}_light.svg`
   - Hero images: `https://assets.nhle.com/mugs/actionshots/1296x729/{playerId}.jpg`

5. **Placeholder Links**: Some fields like `shopLink`, `twitterLink`, and `watchLink` may contain `"#TODO"` placeholders.

6. **Position Codes**:
   - `"C"` = Center
   - `"LW"` = Left Wing
   - `"RW"` = Right Wing
   - `"D"` = Defenseman
   - `"G"` = Goaltender

7. **Handedness**: `shootsCatches` field indicates:
   - `"L"` = Left-handed (for skaters) or catches left (for goalies)
   - `"R"` = Right-handed (for skaters) or catches right (for goalies)

## Usage in Codebase

This endpoint is consumed by the `fetchPlayerDataFromNhl()` function in `workers/nhl-api.ts`:

```typescript
const landingRes = await fetch(`${NHL_API_BASE}/player/${playerId}/landing`);
const landingData = await landingRes.json();
```

The response is then transformed into a normalized format for use in the application's UI components.
