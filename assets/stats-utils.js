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
 * @param {number} [targetGames=80] Season length to normalize to.
 * @returns {number|null} The adjusted value, or null if gamesPlayed is falsy.
 */
function adjustPer80(rawValue, gamesPlayed, targetGames = 80) {
  if (!gamesPlayed) return null;
  return rawValue * (targetGames / gamesPlayed);
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
