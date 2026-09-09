import { TimeoutLike } from '~/src/types.ts'

type Increment = keyof typeof Increment
export const Increment = {
	millisecond: 1,
	second: 1000,
	minute: 60_000,
	hour: 3_600_000,
	day: 86_400_000,
} as const

/** Creates a more accurate timeout that accounts for drift */
export function runEvery(increment: Increment, callback: (next: Temporal.Instant) => void): { valueOf(): number } {
	let timeout: TimeoutLike | NodeJS.Timeout = -1
	const n = Increment[increment]

	const timeToNextFullSecond = () => {
		const now = Temporal.Now.instant()
		const remaining = n - (now.epochMilliseconds % n)
		return {
			now,
			remaining,
			next: Temporal.Instant.fromEpochMilliseconds(now.epochMilliseconds + remaining),
		}
	}

	const nextSecond = () => {
		const { next, remaining } = timeToNextFullSecond()
		callback(next)
		timeout = setTimeout(nextSecond, remaining)
	}

	// Start the recurring timeout immediately
	nextSecond()

	timeout = setTimeout(nextSecond, timeToNextFullSecond().remaining)

	return { valueOf: () => Number(timeout) }
}
