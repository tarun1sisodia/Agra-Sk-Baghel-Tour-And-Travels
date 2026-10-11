/**
 * Rounding half up: exact .5 rounds up to the next integer.
 * e.g. 375.5 -> 376, 986.7 -> 987, 10667.8 -> 10668
 */
export function roundHalfUp(value: number): number {
  return Math.floor(value + 0.5);
}
