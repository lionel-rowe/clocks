import { assert } from '@std/assert/assert'

/**
 * For smooth circular animation with no skipping
 */
export function advance({ target, current, cycle }: { target: number; current: number; cycle: number }) {
	assert(Number.isSafeInteger(cycle) && cycle > 0, 'Cycle must be a positive integer')

	const currentProgress = modulo(current, cycle)
	const currentCycleStart = cycle - currentProgress
	return current + modulo(target + currentCycleStart, cycle)
}

export function modulo(n: number, m: number) {
	return ((n % m) + m) % m
}
