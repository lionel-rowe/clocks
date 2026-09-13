import { assertEquals } from '@std/assert'
import { advance, getHourSet, interpolate } from './utils.ts'

Deno.test(advance.name, async (t) => {
	await t.step('60s cycle', () => {
		const cycle = 60
		assertEquals(advance({ target: 0, current: 0, cycle }), 0)
		assertEquals(advance({ target: 1, current: 0, cycle }), 1)

		assertEquals(advance({ target: 59, current: 20, cycle }), 59)
		assertEquals(advance({ target: 59, current: 59, cycle }), 59)
		assertEquals(advance({ target: 59, current: 58, cycle }), 59)

		assertEquals(advance({ target: 60, current: 60, cycle }), 60)
		assertEquals(advance({ target: 120, current: 120, cycle }), 120)

		assertEquals(advance({ target: 0, current: 59, cycle }), 60)
		assertEquals(advance({ target: 1, current: 60, cycle }), 61)

		assertEquals(advance({ target: 59, current: 100, cycle }), 119)

		assertEquals(advance({ target: 59, current: 118, cycle }), 119)
		assertEquals(advance({ target: 0, current: 119, cycle }), 120)
		assertEquals(advance({ target: 1, current: 120, cycle }), 121)
	})

	await t.step('24h cycle', () => {
		const cycle = 24
		assertEquals(advance({ target: 0, current: 0, cycle }), 0)
		assertEquals(advance({ target: 1, current: 0, cycle }), 1)

		assertEquals(advance({ target: 23, current: 10, cycle }), 23)
		assertEquals(advance({ target: 23, current: 23, cycle }), 23)
		assertEquals(advance({ target: 23, current: 22, cycle }), 23)

		assertEquals(advance({ target: 24, current: 24, cycle }), 24)
		assertEquals(advance({ target: 48, current: 48, cycle }), 48)

		assertEquals(advance({ target: 0, current: 23, cycle }), 24)
		assertEquals(advance({ target: 1, current: 24, cycle }), 25)

		assertEquals(advance({ target: 23, current: 50, cycle }), 71)

		assertEquals(advance({ target: 23, current: 70, cycle }), 71)
		assertEquals(advance({ target: 0, current: 71, cycle }), 72)
		assertEquals(advance({ target: 1, current: 72, cycle }), 73)
	})

	await t.step('negative', () => {
		const cycle = 24
		assertEquals(advance({ target: -1, current: 0, cycle }), 23)
		assertEquals(advance({ target: -1, current: -1, cycle }), -1)
		assertEquals(advance({ target: 1, current: -1, cycle }), 1)
		assertEquals(advance({ target: 1, current: -1, cycle }), 1)
		assertEquals(advance({ target: 3, current: -100, cycle }), -93)
		assertEquals(advance({ target: -100, current: 3, cycle }), 20)
	})
})

Deno.test(getHourSet.name, async (t) => {
	await t.step('14:00', () => {
		assertEquals(getHourSet(14), [12, 13, 14, 15, 16, 17, 18, 19, 20, 9, 10, 11])
	})

	await t.step('02:00', () => {
		assertEquals(getHourSet(2), [0, 1, 2, 3, 4, 5, 6, 7, 8, 21, 22, 23])
	})
})
Deno.test(interpolate.name, async (t) => {
	const xs = [0, 1, 5, 10, 11]
	const tests = [
		{ target: 0, result: { startIdx: 0, endIdx: 1, progress: 0 } },
		{ target: 0.5, result: { startIdx: 0, endIdx: 1, progress: 0.5 } },
		{ target: 1, result: { startIdx: 1, endIdx: 2, progress: 0 } },
		{ target: 2, result: { startIdx: 1, endIdx: 2, progress: 0.25 } },
		{ target: 5, result: { startIdx: 2, endIdx: 3, progress: 0 } },
		{ target: 10, result: { startIdx: 3, endIdx: 4, progress: 0 } },
		{ target: 11, result: { startIdx: 4, endIdx: 0, progress: 0 } },
		{ target: 12, result: { startIdx: 4, endIdx: 0, progress: 0.5 } },
		{ target: 13, result: { startIdx: 0, endIdx: 1, progress: 0 } },
	]

	for (const { target, result } of tests) {
		await t.step(`target: ${target}`, () => {
			assertEquals(interpolate(xs, { target, total: 13 }), result)
		})
	}
})
