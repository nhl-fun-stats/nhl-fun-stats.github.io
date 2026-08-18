/**
 * Shared stat-math helpers for NHL Fun Stats pages.
 * Load this before a page's own <script> block.
 */

/**
 * Scale a counting stat (goals, points, wins, PIM, etc.) to a standard
 * season length so seasons of different lengths can be compared fairly.
 * NHL seasons have ranged from 18 games (1917-18, partial) to 84 games
 * (early 1990s) to today's 82 — a raw total from a 48-game lockout season
 * isn't comparable to one from an 82-game season without this.
 *
 * @param {number} rawValue    The actual stat total for the season.
 * @param {number} gamesPlayed Games played that season (per team).
 * @param {number} [targetGames=82] Season length to normalize to.
 * @returns {number|null} The adjusted value, or null if gamesPlayed is falsy.
 */
function adjustPer82(rawValue, gamesPlayed, targetGames = 82) {
  if (!gamesPlayed) return null;
  return rawValue * (targetGames / gamesPlayed);
}

/**
 * "Goals Factor" — the site's full era-adjustment multiplier for a raw
 * counting stat (a player's goals, points, etc.), combining three
 * normalizations against fixed targets:
 *   1. Scoring rate: a target of 6.0 league-wide goals/game. A season
 *      played at 7 goals/game was an easier offensive environment, so its
 *      raw totals get scaled down (6/7 ≈ 0.857); a low-scoring "dead puck"
 *      season gets scaled up.
 *   2. Season length: a target of 82 games (see adjustPer82).
 *   3. Roster size: a target of 18 dressed players. Fewer players sharing
 *      the ice means each one's raw total is inflated relative to an
 *      18-man roster, so this scales it back down (and vice versa).
 *
 * We don't yet track average players dressed per team per season, so
 * avgPlayersDressed defaults to the target (18) — a neutral ×1 for that
 * term until that data exists.
 *
 * @param {number} leagueGoalsPerGame  League-wide goals/game that season.
 * @param {number} gamesPlayed         Games played that season (per team).
 * @param {number} [avgPlayersDressed=18] Average players dressed per game.
 * @returns {number|null} The multiplier, or null if an input is falsy.
 */
function goalsAdjustmentFactor(leagueGoalsPerGame, gamesPlayed, avgPlayersDressed = 18) {
  if (!leagueGoalsPerGame || !gamesPlayed || !avgPlayersDressed) return null;
  const TARGET_GOALS_PER_GAME = 6.0;
  const TARGET_GAMES = 82;
  const TARGET_PLAYERS = 18;
  return (TARGET_GOALS_PER_GAME / leagueGoalsPerGame)
    * (TARGET_GAMES / gamesPlayed)
    * (TARGET_PLAYERS / avgPlayersDressed);
}

/**
 * Apply the Goals Factor to a raw counting stat.
 * @param {number} rawValue
 * @param {number} leagueGoalsPerGame
 * @param {number} gamesPlayed
 * @param {number} [avgPlayersDressed=18]
 * @returns {number|null}
 */
function applyGoalsAdjustment(rawValue, leagueGoalsPerGame, gamesPlayed, avgPlayersDressed = 18) {
  const factor = goalsAdjustmentFactor(leagueGoalsPerGame, gamesPlayed, avgPlayersDressed);
  return factor === null ? null : rawValue * factor;
}

/**
 * "Assists Factor" — the era-adjustment multiplier for a player's raw
 * assist total, combining three normalizations:
 *   1. Schedule: a target of 82 games. Same idea as adjustPer82, applied
 *      to the season's scheduled game count rather than a raw value.
 *   2. Roster size: average allowed roster size that season, divided by a
 *      target of 18 — note this is the *inverse* shape of the roster term
 *      in goalsAdjustmentFactor (formation/18 here, vs. 18/dressed there).
 *      Defaults to 18 (neutral ×1) until real roster-size data exists.
 *   3. Scoring era for assists: a target of 10.0 league-wide assists/game
 *      (Hockey-Reference's baseline: 6.0 goals/game × 1.67 assists/goal).
 *      We deliberately do NOT exclude the player being evaluated from the
 *      league average — kept simple rather than matching Hockey-Reference's
 *      per-player exclusion.
 *
 * @param {number} gamesScheduled       Games scheduled that season (per team).
 * @param {number} leagueAssistsPerGame League-wide assists/game that season.
 * @param {number} [avgRosterSize=18]   Average allowed roster size that season.
 * @returns {number|null} The multiplier, or null if an input is falsy.
 */
function assistsAdjustmentFactor(gamesScheduled, leagueAssistsPerGame, avgRosterSize = 18) {
  if (!gamesScheduled || !leagueAssistsPerGame || !avgRosterSize) return null;
  const TARGET_GAMES = 82;
  const TARGET_ROSTER = 18;
  const TARGET_ASSISTS_PER_GAME = 10.0;
  const scheduleFactor = TARGET_GAMES / gamesScheduled;
  const formationFactor = avgRosterSize / TARGET_ROSTER;
  const eraFactor = TARGET_ASSISTS_PER_GAME / leagueAssistsPerGame;
  return scheduleFactor * formationFactor * eraFactor;
}

/**
 * Apply the Assists Factor to a raw assist total.
 * @param {number} rawAssists
 * @param {number} gamesScheduled
 * @param {number} leagueAssistsPerGame
 * @param {number} [avgRosterSize=18]
 * @returns {number|null}
 */
function applyAssistsAdjustment(rawAssists, gamesScheduled, leagueAssistsPerGame, avgRosterSize = 18) {
  const factor = assistsAdjustmentFactor(gamesScheduled, leagueAssistsPerGame, avgRosterSize);
  return factor === null ? null : rawAssists * factor;
}

/**
 * Adjusted points = adjusted goals + adjusted assists.
 * @param {number} adjustedGoals
 * @param {number} adjustedAssists
 * @returns {number}
 */
function adjustedPoints(adjustedGoals, adjustedAssists) {
  return adjustedGoals + adjustedAssists;
}

/**
 * Express a value as a ratio of a baseline average — the "VS_Average"
 * pattern used across the site (e.g. a season's goals/game vs. the
 * long-run average). 1.00 = exactly average, 1.25 = 25% above.
 *
 * @param {number} value
 * @param {number} average
 * @returns {number|null} The ratio, or null if average is falsy.
 */
function vsAverage(value, average) {
  if (!average) return null;
  return value / average;
}

/**
 * Format a start year as an NHL season label, e.g. 1943 -> "1943-44".
 * @param {number} startYear
 * @returns {string}
 */
function seasonLabel(startYear) {
  return startYear + '-' + String(startYear + 1).slice(-2);
}

/**
 * Round to a fixed number of decimals and return a Number (not a string) —
 * convenient for sorting adjusted/ratio columns numerically.
 * @param {number} value
 * @param {number} [decimals=2]
 * @returns {number}
 */
function roundTo(value, decimals = 2) {
  return +value.toFixed(decimals);
}
