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

const SWITCH_HOUR = 8
/**
 * 8am and later is day time
 * 8pm and later is night time
 */
export function isDayTime(zdt: Temporal.ZonedDateTime): boolean {
	const hour = zdt.hour
	return hour >= SWITCH_HOUR && hour < SWITCH_HOUR + 12
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
