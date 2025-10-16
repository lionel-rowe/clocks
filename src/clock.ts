import 'temporal-polyfill/global'
import { assert } from '@std/assert'
import { nextIncrement } from './utils.ts'
import { runEvery } from './runEvery.ts'

type ObservedAttribute = typeof OBSERVED_ATTRIBUTES[number]
const OBSERVED_ATTRIBUTES = ['tz', 'locale'] as const

type TimeoutLike = { valueOf(): number }

class AnalogClock extends HTMLElement {
	#tz: string = 'UTC'
	#locale: string = 'en-US'

	#timeout: TimeoutLike = -1
	override shadowRoot: ShadowRoot

	#ready: Promise<void>

	constructor() {
		super()
		this.shadowRoot = this.attachShadow({ mode: 'open' })
		const initialDisplay = this.style.display
		this.style.display = 'none'

		const template = document.querySelector('#analog-clock-template' as 'template')!
		assert(template)
		const templateContent = template.content

		this.shadowRoot.append(templateContent.cloneNode(true))

		const numbers = this.shadowRoot.querySelector('.numbers')!
		for (let i = 1; i <= 12; ++i) {
			numbers.append(Object.assign(
				document.createElement('span'),
				{ className: 'number', style: `--n: ${i}` },
			))
		}

		this.#ready = Promise.all([this.start()]).then(() => {})

		this.#ready.then(() => {
			this.style.display = initialDisplay
		})
	}

	start(): Promise<void> {
		return new Promise((res) => {
			this.#timeout = runEvery('second', (next) => {
				this.#cb(next)
				res()
			})
		})
	}

	stop() {
		clearTimeout(this.#timeout.valueOf())
		this.#timeout = -1
	}

	static readonly observedAttributes = OBSERVED_ATTRIBUTES
	attributeChangedCallback(name: ObservedAttribute, oldValue: string | null, newValue: string | null) {
		if (newValue === oldValue) return

		switch (name) {
			case 'locale':
				this.#locale = newValue ?? 'en-US'
				break
			case 'tz':
				this.#tz = newValue ?? 'UTC'
				break
		}
	}

	#cb(instant: Temporal.Instant) {
		const zdt = instant.toZonedDateTimeISO(this.#tz)
		this.#updateUi(zdt)
	}

	#hours = 0
	#minutes = 0
	#seconds = 0

	#updateUi(zdt: Temporal.ZonedDateTime) {
		this.#hours = nextIncrement({ n: zdt.hour, prev: this.#hours, cycle: 24 })
		this.#minutes = nextIncrement({ n: zdt.minute, prev: this.#minutes, cycle: 60 })
		this.#seconds = nextIncrement({ n: zdt.second, prev: this.#seconds, cycle: 60 })

		this.style.setProperty('--hours', this.#hours.toString())
		this.style.setProperty('--minutes', this.#minutes.toString())
		this.style.setProperty('--seconds', this.#seconds.toString())

		// Update the machine-readable time for screen readers and other assistive tech
		const time = this.shadowRoot.querySelector('time')!
		time.dateTime = zdt.toString()
		time.textContent = zdt.toLocaleString(this.#locale)
	}
}

customElements.define('analog-clock', AnalogClock)
