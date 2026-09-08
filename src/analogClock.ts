import { assert } from '@std/assert/assert'
import { delay } from '@std/async/delay'
import { Clock } from '~/src/clock.ts'
import { advance, getHourSet, isDayTime } from '~/src/utils.ts'

function assertArrayOf<T>(value: unknown, predicate: (item: unknown) => item is T): asserts value is T[] {
	assert(Array.isArray(value))
	for (const item of value) {
		assert(predicate(item))
	}
}

export class AnalogClock extends Clock {
	protected static override readonly TEMPLATE_ID = 'tz-clock-analog-template'

	#hours = 0
	#minutes = 0
	#seconds = 0
	#prevHours = NaN

	#$clock: HTMLElement
	#$gloss: HTMLElement
	#$time: HTMLTimeElement
	#$numbers: HTMLElement[]

	constructor() {
		super()
		this.resources.push(Promise.race([
			document.fonts.load('1em "Caacupe One"'),
			delay(5_000),
		]))

		const $clock = this.shadowRoot.querySelector('.clock')
		assert($clock instanceof HTMLElement)
		const $gloss = this.shadowRoot.querySelector('.gloss')
		assert($gloss instanceof HTMLElement)
		const $time = this.shadowRoot.querySelector('time')
		assert($time instanceof HTMLTimeElement)

		const $$numbers = [...this.shadowRoot.querySelectorAll('.number')]
		assertArrayOf($$numbers, (item) => item instanceof HTMLElement)

		this.#$clock = $clock
		this.#$gloss = $gloss
		this.#$time = $time
		this.#$numbers = $$numbers
	}

	protected override updateUi(zdt: Temporal.ZonedDateTime) {
		this.#hours = advance({ target: zdt.hour, current: this.#hours, cycle: 24 })
		this.#minutes = advance({ target: zdt.minute, current: this.#minutes, cycle: 60 })
		this.#seconds = advance({ target: zdt.second, current: this.#seconds, cycle: 60 })

		this.#$clock.style.setProperty('--hours', this.#hours.toString())
		this.#$clock.style.setProperty('--minutes', this.#minutes.toString())
		this.#$clock.style.setProperty('--seconds', this.#seconds.toString())

		this.dataset.timeOfDay = isDayTime(zdt) ? 'day' : 'night'
		this.#$gloss.textContent = this.gloss
		this.title = this.gloss

		// Update the machine-readable time for screen readers and other assistive tech
		this.#$time.dateTime = zdt.toString()
		this.#$time.textContent = zdt.toLocaleString(this.locale)

		if (this.#hours !== this.#prevHours) {
			const hourSet = getHourSet(this.#hours)
			for (const [idx, $number] of this.#$numbers.entries()) {
				const n = hourSet[idx]!
				$number.dataset.value = String(n)
			}

			this.#prevHours = this.#hours
		}
	}
}

customElements.define('tz-clock-analog', AnalogClock)
