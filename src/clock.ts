import 'temporal-polyfill/global'
import { assert } from '@std/assert/assert'
import { advance } from './utils.ts'
import { runEvery } from './runEvery.ts'

type TimeoutLike = { valueOf(): number }

// https://fonts.google.com/specimen/Poiret+One?preview.text=1+2+3+4+5+6+7+8+9+10+11+12
// https://openfontlicense.org/open-font-license-official-text/
document.fonts.add(new FontFace('Poiret One', 'url(/static/PoiretOne-Regular-subset.ttf) format("TrueType")'))

const resolvedDateTimeOptions = new Intl.DateTimeFormat().resolvedOptions()
const defaults: Record<ObservedAttribute, string> = {
	locale: resolvedDateTimeOptions.locale,
	time: resolvedDateTimeOptions.timeZone,
}

type ObservedAttribute = typeof observedAttributes[number]
const observedAttributes = ['time', 'locale'] as const

type RunningTimeState = {
	kind: 'running'
	timeZone: string
	serialized: string
}
type PausedTimeState = {
	kind: 'paused'
	time: Temporal.ZonedDateTime
	serialized: string
}
type TimeState = RunningTimeState | PausedTimeState

abstract class Clock extends HTMLElement {
	#_timeout: TimeoutLike = -1
	get #timeout() {
		return this.#_timeout
	}
	set #timeout(v) {
		clearTimeout(this.#_timeout.valueOf())
		this.#_timeout = v
	}

	declare shadowRoot: ShadowRoot
	protected abstract TEMPLATE_ID: string

	protected abstract updateUi(zdt: Temporal.ZonedDateTime): void

	protected resources: Promise<unknown>[] = []
	get #ready() {
		return Promise.all(this.resources)
	}

	constructor() {
		super()
		this.attachShadow({ mode: 'open' })
	}

	connectedCallback() {
		if (!this.shadowRoot.childElementCount) {
			const template = document.getElementById(this.TEMPLATE_ID)
			assert(template instanceof HTMLTemplateElement)
			const templateContent = template.content

			const initialDisplay = this.style.display
			this.style.display = 'none'

			this.shadowRoot.append(templateContent.cloneNode(true))
			this.resources.push(this.#updateState(this.#timeState))

			this.#ready.then(() => {
				this.style.display = initialDisplay
				if (this.style.cssText === '') this.removeAttribute('style')
			})
		}
	}

	disconnectedCallback() {
		this.#pause()
	}

	static readonly observedAttributes = observedAttributes
	attributeChangedCallback(
		name: ObservedAttribute,
		oldValue: string | null,
		newValue: string | null,
	) {
		if (newValue === oldValue) return
		this[name] = newValue ?? defaults[name]
	}

	#timeState: TimeState = this.#toValidTimeState(defaults.time)
	get time() {
		return this.#timeState.serialized
	}
	/** @throws {RangeError} if set to an invalid time zone or zoned datetime */
	set time(v) {
		this.#timeState = this.#toValidTimeState(v)
		this.#updateState(this.#timeState)
	}
	#locale = new Intl.Locale(defaults.locale)
	get locale() {
		return this.#locale.toString()
	}
	/** @throws {RangeError} if set to an invalid locale */
	set locale(v) {
		this.#locale = this.#toLocale(v)
	}
	get paused() {
		return this.#timeState.kind === 'paused'
	}

	#updateState(state: TimeState): Promise<void> {
		return new Promise((res) => {
			switch (state.kind) {
				case 'paused': {
					this.#pause()
					this.updateUi(state.time)
					res()
					return
				}
				case 'running': {
					this.#timeout = runEvery('second', (next) => {
						const zdt = next.toZonedDateTimeISO(state.timeZone)
						this.updateUi(zdt)
						res()
					})
					return
				}
			}
		})
	}

	#pause() {
		this.#timeout = -1
	}

	/** @throws {RangeError} if input is not a valid time zone or zoned datetime */
	#toValidTimeState(input: string): TimeState {
		if (input.includes(':')) {
			const zdt = Temporal.ZonedDateTime.from(input)
			return { kind: 'paused', time: zdt, serialized: zdt.toString() }
		} else {
			const zdt = Temporal.Now.zonedDateTimeISO(input)
			return { kind: 'running', timeZone: zdt.timeZoneId, serialized: zdt.timeZoneId }
		}
	}

	/** @throws {RangeError} if input is not a valid locale */
	#toLocale(input: string): Intl.Locale {
		return new Intl.Locale(input)
	}
}

class AnalogClock extends Clock {
	protected override TEMPLATE_ID = 'tz-clock-analog-template'

	constructor() {
		super()
		this.resources.push(document.fonts.load('1em "Poiret One"'))
	}

	#hours = 0
	#minutes = 0
	#seconds = 0

	protected override updateUi(zdt: Temporal.ZonedDateTime) {
		this.#hours = advance({ target: zdt.hour, current: this.#hours, cycle: 24 })
		this.#minutes = advance({ target: zdt.minute, current: this.#minutes, cycle: 60 })
		this.#seconds = advance({ target: zdt.second, current: this.#seconds, cycle: 60 })

		const clock = this.shadowRoot.querySelector('.clock')
		assert(clock instanceof HTMLElement)

		clock.style.setProperty('--hours', this.#hours.toString())
		clock.style.setProperty('--minutes', this.#minutes.toString())
		clock.style.setProperty('--seconds', this.#seconds.toString())

		// Update the machine-readable time for screen readers and other assistive tech
		const time = this.shadowRoot.querySelector('time')
		assert(time instanceof HTMLTimeElement)
		time.dateTime = zdt.toString()
		time.textContent = zdt.toLocaleString(this.locale)
	}
}

class DigitalClock extends Clock {
	protected override TEMPLATE_ID = 'tz-clock-digital-template'
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
