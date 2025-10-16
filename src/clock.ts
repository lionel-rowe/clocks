import 'temporal-polyfill/global'
import { assert } from '@std/assert/assert'
import { advance } from './utils.ts'
import { runEvery } from './runEvery.ts'

type ObservedAttribute = typeof OBSERVED_ATTRIBUTES[number]
const OBSERVED_ATTRIBUTES = ['tz', 'locale'] as const

type TimeoutLike = { valueOf(): number }

abstract class Clock extends HTMLElement {
	protected tz: string = 'UTC'
	protected locale: string = 'en-US'

	#timeout: TimeoutLike = -1
	declare shadowRoot: ShadowRoot

	protected abstract templateId: string

	constructor() {
		super()
		this.attachShadow({ mode: 'open' })
	}

	connectedCallback() {
		const template = document.getElementById(this.templateId)
		assert(template instanceof HTMLTemplateElement)
		const templateContent = template.content

		const initialDisplay = this.style.display
		this.style.display = 'none'

		this.shadowRoot.append(templateContent.cloneNode(true))

		Promise.all([this.start()]).then(() => {
			this.style.display = initialDisplay
		})
	}

	start(): Promise<void> {
		return new Promise((res) => {
			this.#timeout = runEvery('second', (next) => {
				const zdt = next.toZonedDateTimeISO(this.tz)
				this.updateUi(zdt)
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
				this.locale = newValue ?? 'en-US'
				break
			case 'tz':
				this.tz = newValue ?? 'UTC'
				break
		}
	}

	protected abstract updateUi(zdt: Temporal.ZonedDateTime): void
}

class AnalogClock extends Clock {
	protected override templateId = 'tz-clock-analog-template'

	#hours = 0
	#minutes = 0
	#seconds = 0

	protected override updateUi(zdt: Temporal.ZonedDateTime) {
		this.#hours = advance({ target: zdt.hour, current: this.#hours, cycle: 24 })
		this.#minutes = advance({ target: zdt.minute, current: this.#minutes, cycle: 60 })
		this.#seconds = advance({ target: zdt.second, current: this.#seconds, cycle: 60 })

		this.style.setProperty('--hours', this.#hours.toString())
		this.style.setProperty('--minutes', this.#minutes.toString())
		this.style.setProperty('--seconds', this.#seconds.toString())

		// Update the machine-readable time for screen readers and other assistive tech
		const time = this.shadowRoot.querySelector('time')
		assert(time instanceof HTMLTimeElement)
		time.dateTime = zdt.toString()
		time.textContent = zdt.toLocaleString(this.locale)
	}
}

class DigitalClock extends Clock {
	protected override templateId = 'tz-clock-digital-template'
	protected override updateUi(zdt: Temporal.ZonedDateTime) {
		// Update the machine-readable time for screen readers and other assistive tech
		const time = this.shadowRoot.querySelector('time')
		assert(time instanceof HTMLTimeElement)
		time.dateTime = zdt.toString()
		time.textContent = zdt.toLocaleString(this.locale)
	}
}

customElements.define('tz-clock-analog', AnalogClock)
customElements.define('tz-clock-digital', DigitalClock)
