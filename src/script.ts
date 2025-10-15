import 'temporal-polyfill/global'
import { assert } from '@std/assert'
import { nextIncrement } from './utils.ts'
import { runEvery } from './runEvery.ts'

type TimeoutLike = { valueOf(): number }

class AnalogClock extends HTMLElement {
	#timeout: TimeoutLike
	override shadowRoot: ShadowRoot

	constructor() {
		super()
		this.shadowRoot = this.attachShadow({ mode: 'open' })
		const initialStyle = this.style.cssText
		this.style.display = 'none'

		const template = document.querySelector('#analog-clock-template' as 'template')!
		assert(template)
		const templateContent = template.content

		this.shadowRoot.append(templateContent.cloneNode(true))

		let initialized = false

		this.#timeout = runEvery('second', (next) => {
			if (!initialized) {
				this.style.cssText = initialStyle
				initialized = true
			}
			this.#cb(next)
		})
	}

	start() {
		this.#timeout = runEvery('second', (next) => {
			this.#cb(next)
		})
	}

	stop() {
		clearTimeout(this.#timeout.valueOf())
		this.#timeout = -1
	}

	static get observedAttributes(): string[] {
		return ['tz']
	}

	#tz: string = 'UTC'

	attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
		if (name === 'tz' && newValue !== oldValue) {
			this.#tz = newValue ?? 'UTC'
		}
	}

	#cb(ms: Temporal.Instant) {
		const pdt = ms.toZonedDateTimeISO(this.#tz).toPlainDateTime()
		this.#updateTimeDisplay(pdt)
	}

	#hours = 0
	#minutes = 0
	#seconds = 0

	#updateTimeDisplay(dt: Temporal.PlainDateTime) {
		this.#hours = nextIncrement({ n: dt.hour, prev: this.#hours, cycle: 24 })
		this.#minutes = nextIncrement({ n: dt.minute, prev: this.#minutes, cycle: 60 })
		this.#seconds = nextIncrement({ n: dt.second, prev: this.#seconds, cycle: 60 })

		this.style.setProperty('--hours', this.#hours.toString())
		this.style.setProperty('--minutes', this.#minutes.toString())
		this.style.setProperty('--seconds', this.#seconds.toString())
	}
}

customElements.define('analog-clock', AnalogClock)
