import { assert } from '@std/assert/assert'

/** For smooth circular animation with no skipping */
export function advance({ target, current, cycle }: { target: number; current: number; cycle: number }) {
	assert(Number.isSafeInteger(cycle) && cycle > 0, 'Cycle must be a positive integer')

	const currentProgress = modulo(current, cycle)
	const currentCycleStart = cycle - currentProgress
	return current + modulo(target + currentCycleStart, cycle)
}

export function modulo(n: number, m: number) {
	return ((n % m) + m) % m
}

/**
 * Hour values based on the next hour (6 hours prior, 6 hours after)
 * E.g.
 *
 * Current time | Hour set | Array
 * -|-|-
 * `02:00` | `21, 22, 23, 0, 1, <2>, 3, 4, 5, 6, 7, 8` | `[0, 1, 2, 3, 4, 5, 6, 7, 8, 21, 22, 23]`
 * `14:00` | `9, 10, 11, 12, 13, <14>, 15, 16, 17, 18, 19, 20` | `[12, 13, 14, 15, 16, 17, 18, 19, 20, 9, 10, 11]`
 */
export function getHourSet(currentHour: number): number[] {
	const hours = new Array<number>(12).fill(0)
	for (let i = 0; i < 12; ++i) {
		const x = i + currentHour - 5
		hours[modulo(x, 12)] = modulo(x, 24)
	}
	return hours
}

export function clamp(value: number, range: [min: number, max: number]): number {
	const [min, max] = range
	return Math.min(Math.max(value, min), max)
}

/**
 * Invariants:
 * - `xs` must be a non-empty array of positive numbers in ascending order
 * - `total` must be a positive number
 * - `target` must be a finite number
 */
export function interpolate(
	xs: number[],
	params: {
		target: number
		total: number
	},
): {
	startIdx: number
	endIdx: number
	progress: number
} {
	let { target } = params
	target = modulo(target, params.total)

	let startIdx = -1
	let endIdx = 0

	for (let i = 0; i < xs.length; ++i) {
		if (xs[i]! > target) {
			endIdx = i
			break
		}
	}

	startIdx = modulo(endIdx - 1, xs.length)

	const progress = (target - xs[startIdx]) / modulo(xs[endIdx] - xs[startIdx], params.total)

	return { startIdx, endIdx, progress }
}
