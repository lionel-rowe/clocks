import { TimeoutLike } from '~/src/types.ts'
import { MS_IN_DAY, MS_IN_HOUR, MS_IN_MIN, MS_IN_S } from '~/src/consts.ts'

type Increment = keyof typeof Increment
export const Increment = {
	millisecond: 1,
	second: MS_IN_S,
	minute: MS_IN_MIN,
	hour: MS_IN_HOUR,
	day: MS_IN_DAY,
} as const

/** Creates a more accurate timeout that accounts for drift */
export function runEvery(increment: Increment, callback: (next: Temporal.Instant) => void): { valueOf(): number } {
	let timeout: TimeoutLike | NodeJS.Timeout = -1
	const n = Increment[increment]

	const getTimeInfo = () => {
		const now = Temporal.Now.instant()
		const remainder = now.epochMilliseconds % n
		const timeToNext = n - remainder + 1
		const current = Temporal.Instant.fromEpochMilliseconds(now.epochMilliseconds - remainder)

		return { current, timeToNext }
	}

	const nextSecond = () => {
		const { current, timeToNext } = getTimeInfo()
		clearTimeout(Number(timeout))
		callback(current)
		timeout = setTimeout(nextSecond, timeToNext)
	}

	// Start the recurring timeout immediately
	nextSecond()

	timeout = setTimeout(nextSecond, getTimeInfo().timeToNext)

	return { valueOf: () => Number(timeout) }
}
