import { assert } from '@std/assert/assert'
import { delay } from '@std/async/delay'
import { Clock, observedAttributes as superObservedAttributes } from '~/src/clock.ts'
import { advance, getHourSet, isDayTime } from '~/src/utils.ts'

function assertArrayOf<T>(value: unknown, predicate: (item: unknown) => item is T): asserts value is T[] {
	assert(Array.isArray(value))
	for (const item of value) {
		assert(predicate(item))
	}
}

type ObservedAttribute = typeof observedAttributes[number]
const observedAttributes = [
	...superObservedAttributes,
	'hour-cycle',
] as const

export class AnalogClock extends Clock {
	protected static override readonly TEMPLATE_ID = 'tz-clock-analog-template'

	#time = { hours: 0, minutes: 0, seconds: 0 }
	#prevTime = { hours: NaN, minutes: NaN, seconds: NaN }

	#$clock: HTMLElement
	#$gloss: HTMLElement
	#$time: HTMLTimeElement
	#$numbers: HTMLElement[]

	hourCycle: 12 | 24 = 24

	static override readonly observedAttributes = observedAttributes

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

		this.hourCycle = this.getAttribute('hour-cycle') === '24' ? 24 : 12
		this.#updateGlossUi()
	}

	#updateGlossUi() {
		this.#$gloss.textContent = this.gloss
		this.title = this.gloss
	}

	override attributeChangedCallback(
		name: ObservedAttribute,
		oldValue: string | null,
		newValue: string | null,
	) {
		if (name === 'hour-cycle') {
			this.hourCycle = newValue === '24' ? 24 : 12
		} else {
			super.attributeChangedCallback(name, oldValue, newValue)
		}

		switch (name) {
			case 'time':
			case 'locale': {
				break
			}
			case 'gloss': {
				this.#updateGlossUi()
				break
			}
			case 'hour-cycle': {
				break
			}
			default: {
				// type check to ensure all cases are handled
				const _: never = name
			}
		}
	}

	protected override updateUi(zdt: Temporal.ZonedDateTime) {
		this.#time = {
			hours: advance({ target: zdt.hour, current: this.#time.hours, cycle: 24 }),
			minutes: advance({ target: zdt.minute, current: this.#time.minutes, cycle: 60 }),
			seconds: advance({ target: zdt.second, current: this.#time.seconds, cycle: 60 }),
		}

		// Update the machine-readable time for screen readers and other assistive tech
		this.#$time.dateTime = zdt.toString()
		this.#$time.textContent = zdt.toLocaleString(this.locale)

		if (this.#time.hours !== this.#prevTime.hours) {
			this.#$clock.style.setProperty('--hours', String(this.#time.hours))
			this.dataset.timeOfDay = isDayTime(zdt) ? 'day' : 'night'

			const hourSet = this.hourCycle === 12
				? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
				: getHourSet(this.#time.hours)

			for (const [idx, $number] of this.#$numbers.entries()) {
				// $number.style.color = idx === this.#hours % 12 ? 'var(--second-hand-color)' : ''

				const n = hourSet[idx]!
				$number.textContent = String(n).padStart(
					this.hourCycle === 12 ? 0 : 2,
					'0',
				)
			}
		}

		if (this.#time.minutes !== this.#prevTime.minutes) {
			this.#$clock.style.setProperty('--minutes', String(this.#time.minutes))
		}

		if (this.#time.seconds !== this.#prevTime.seconds) {
			this.#$clock.style.setProperty('--seconds', String(this.#time.seconds))
		}

		this.#prevTime = { ...this.#time }
	}
}

customElements.define('tz-clock-analog', AnalogClock)
