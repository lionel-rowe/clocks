import { assert } from '@std/assert'
import { Clock } from '~/src/clock.ts'
import { loadTemplate } from '~/src/utils.ts'

export class DigitalClock extends Clock {
	protected static override readonly TEMPLATE_ID = 'tz-clock-digital-template'

	static {
		const $template = loadTemplate('{{ @text ~/static/digital-clock.html }}')
		if ($template != null) {
			customElements.define('tz-clock-digital', DigitalClock)
		}
	}

	protected override _updateUi(zdt: Temporal.ZonedDateTime) {
		// Update the machine-readable time for screen readers and other assistive tech
		const $time = this.shadowRoot.querySelector('time')
		assert($time instanceof HTMLTimeElement)
		$time.dateTime = zdt.toString()
		$time.textContent = zdt.toLocaleString(this.locale)
	}
}
