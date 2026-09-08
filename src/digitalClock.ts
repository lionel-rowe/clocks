import { assert } from '@std/assert'
import { Clock } from '~/src/clock.ts'

class DigitalClock extends Clock {
	protected static override readonly TEMPLATE_ID = 'tz-clock-digital-template'

	protected override updateUi(zdt: Temporal.ZonedDateTime) {
		// Update the machine-readable time for screen readers and other assistive tech
		const $time = this.shadowRoot.querySelector('time')
		assert($time instanceof HTMLTimeElement)
		$time.dateTime = zdt.toString()
		$time.textContent = zdt.toLocaleString(this.locale)
		this.title = this.gloss
	}
}

customElements.define('tz-clock-digital', DigitalClock)
