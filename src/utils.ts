/**
 * Always goes up, for smooth circular animation with no skipping
 */
export function nextIncrement({ n, prev, cycle }: { n: number; prev: number; cycle: number }) {
	return prev + ((n + cycle - (prev % cycle)) % cycle)
}
