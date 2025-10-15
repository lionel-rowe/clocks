import { assertEquals } from '@std/assert'
import { nextIncrement } from './utils.ts'

Deno.test(nextIncrement.name, async (t) => {
	await t.step('60s cycle', () => {
		const cycle = 60
		assertEquals(nextIncrement({ n: 0, prev: 0, cycle }), 0)
		assertEquals(nextIncrement({ n: 1, prev: 0, cycle }), 1)

		assertEquals(nextIncrement({ n: 59, prev: 20, cycle }), 59)
		assertEquals(nextIncrement({ n: 59, prev: 59, cycle }), 59)
		assertEquals(nextIncrement({ n: 59, prev: 58, cycle }), 59)

		assertEquals(nextIncrement({ n: 60, prev: 60, cycle }), 60)
		assertEquals(nextIncrement({ n: 120, prev: 120, cycle }), 120)

		assertEquals(nextIncrement({ n: 0, prev: 59, cycle }), 60)
		assertEquals(nextIncrement({ n: 1, prev: 60, cycle }), 61)

		assertEquals(nextIncrement({ n: 59, prev: 100, cycle }), 119)

		assertEquals(nextIncrement({ n: 59, prev: 118, cycle }), 119)
		assertEquals(nextIncrement({ n: 0, prev: 119, cycle }), 120)
		assertEquals(nextIncrement({ n: 1, prev: 120, cycle }), 121)
	})

	await t.step('24h cycle', () => {
		const cycle = 24
		assertEquals(nextIncrement({ n: 0, prev: 0, cycle }), 0)
		assertEquals(nextIncrement({ n: 1, prev: 0, cycle }), 1)

		assertEquals(nextIncrement({ n: 23, prev: 10, cycle }), 23)
		assertEquals(nextIncrement({ n: 23, prev: 23, cycle }), 23)
		assertEquals(nextIncrement({ n: 23, prev: 22, cycle }), 23)

		assertEquals(nextIncrement({ n: 24, prev: 24, cycle }), 24)
		assertEquals(nextIncrement({ n: 48, prev: 48, cycle }), 48)

		assertEquals(nextIncrement({ n: 0, prev: 23, cycle }), 24)
		assertEquals(nextIncrement({ n: 1, prev: 24, cycle }), 25)

		assertEquals(nextIncrement({ n: 23, prev: 50, cycle }), 71)

		assertEquals(nextIncrement({ n: 23, prev: 70, cycle }), 71)
		assertEquals(nextIncrement({ n: 0, prev: 71, cycle }), 72)
		assertEquals(nextIncrement({ n: 1, prev: 72, cycle }), 73)
	})
})
