import { assert } from '@std/assert/assert'
import { runEvery } from './runEvery.ts'
import { TimeoutLike } from '~/src/types.ts'

const parsed = new DOMParser().parseFromString(
	'{{ @html ~/static/templates.html }}',
	'text/html',
)

assert(parsed.head.children.length === 2)

// must be spread into an array to avoid live collection issues
for (const $el of [...parsed.head.children]) {
	assert($el instanceof HTMLTemplateElement)
	if (document.getElementById($el.id) != null) continue
	document.head.appendChild($el)
}

// https://fonts.google.com/specimen/Caacupe+One?preview.text=1+2+3+4+5+6+7+8+9+10+11+12
// https://openfontlicense.org/open-font-license-official-text/
document.fonts.add(
	new FontFace(
		'Caacupe One',
		'url({{ @datauri ~/static/CaacupeOne-Regular-subset.woff2 }}) format("woff2")',
	),
)

const resolvedDateTimeOptions = new Intl.DateTimeFormat().resolvedOptions()
const defaultAttributeValues: Record<ObservedAttribute, string> = {
	locale: resolvedDateTimeOptions.locale,
	time: resolvedDateTimeOptions.timeZone,
	gloss: new Intl.DateTimeFormat(resolvedDateTimeOptions.locale, {
		timeZoneName: 'long',
		timeZone: resolvedDateTimeOptions.timeZone,
	}).formatToParts(new Date())
		.find((x) => x.type === 'timeZoneName')!.value,
}

type ObservedAttribute = typeof observedAttributes[number]
export const observedAttributes = ['time', 'locale', 'gloss'] as const

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

export abstract class Clock extends HTMLElement {
	protected static get TEMPLATE_ID(): string {
		// runtime workaround for lack of `static abstract` properties
		// https://github.com/microsoft/TypeScript/issues/34516
		throw new Error('abstract `TEMPLATE_ID` must be overridden in subclass')
	}

	#_timeout: TimeoutLike = -1

	#replaceTimeout(value: TimeoutLike) {
		clearTimeout(this.#_timeout.valueOf())
		this.#_timeout = value
	}

	#initialDisplay: string

	declare shadowRoot: ShadowRoot

	protected abstract updateUi(zdt: Temporal.ZonedDateTime): void | Promise<void>

	protected resources: Promise<unknown>[] = []
	get #ready() {
		return Promise.all(this.resources)
	}

	constructor() {
		super()
		this.attachShadow({ mode: 'open' })

		const $template = document.getElementById(new.target.TEMPLATE_ID)
		assert($template instanceof HTMLTemplateElement)
		const templateContent = $template.content

		this.#initialDisplay = this.style.display
		this.style.display = 'none'

		this.shadowRoot.append(templateContent.cloneNode(true))
	}

	#abortController = new AbortController()

	#setIdle(idle: boolean) {
		this.classList.toggle('idle', idle)
	}

	connectedCallback() {
		this.#ready.then(() => {
			this.style.display = this.#initialDisplay
			if (this.style.cssText === '') this.removeAttribute('style')
		})

		globalThis.addEventListener('visibilitychange', async () => {
			switch (document.visibilityState) {
				case 'hidden': {
					this.#setIdle(true)
					break
				}
				case 'visible': {
					this.#setIdle(true)
					await this.#uiUpdated.promise
					this.#setIdle(false)

					break
				}
				default: {
					// type check to ensure all cases are handled
					const _: never = document.visibilityState
				}
			}
		}, { signal: this.#abortController.signal })
	}

	disconnectedCallback() {
		this.#pause()

		this.#abortController.abort()
		this.#abortController = new AbortController()
	}

	static readonly observedAttributes = observedAttributes as readonly string[]

	attributeChangedCallback(
		name: ObservedAttribute,
		oldValue: string | null,
		newValue: string | null,
	) {
		if (newValue === oldValue) return
		this[name] = newValue ?? defaultAttributeValues[name]
	}

	protected timeState: TimeState = this.#getTimeStateOrThrow(defaultAttributeValues.time)
	get time() {
		return this.timeState.serialized
	}
	/** @throws {RangeError} if set to an invalid time zone or zoned datetime */
	set time(v) {
		this.timeState = this.#getTimeStateOrThrow(v)
		this.#updateState(this.timeState)
	}
	#locale = new Intl.Locale(defaultAttributeValues.locale)
	get locale() {
		return this.#locale.toString()
	}
	/** @throws {RangeError} if set to an invalid locale */
	set locale(v) {
		this.#locale = this.#getLocaleOrThrow(v)
	}
	get paused() {
		return this.timeState.kind === 'paused'
	}
	#gloss = defaultAttributeValues.gloss
	get gloss() {
		return this.#gloss
	}
	set gloss(v) {
		this.#gloss = v
		this.title = v
	}

	#uiUpdated = Promise.withResolvers<void>()
	async #updateUi(zdt: Temporal.ZonedDateTime) {
		await this.updateUi(zdt)
		this.#uiUpdated.resolve()
		this.#uiUpdated = Promise.withResolvers<void>()
	}

	async #updateState(state: TimeState): Promise<void> {
		switch (state.kind) {
			case 'paused': {
				this.#pause()
				await this.#updateUi(state.time)
				return
			}
			case 'running': {
				return new Promise((res) => {
					this.#replaceTimeout(runEvery('second', async (current) => {
						const zdt = current.toZonedDateTimeISO(state.timeZone)
						await this.#updateUi(zdt)
						res()
					}))
				})
			}
		}
	}

	#pause() {
		this.#replaceTimeout(-1)
	}

	/** @throws {RangeError} if input is not a valid time zone or zoned datetime */
	#getTimeStateOrThrow(input: string): TimeState {
		if (input.includes(':')) {
			const zdt = Temporal.ZonedDateTime.from(input)
			return { kind: 'paused', time: zdt, serialized: zdt.toString() }
		} else {
			const zdt = Temporal.Now.zonedDateTimeISO(input)
			return { kind: 'running', timeZone: zdt.timeZoneId, serialized: zdt.timeZoneId }
		}
	}

	/** @throws {RangeError} if input is not a valid locale */
	#getLocaleOrThrow(input: string): Intl.Locale {
		return new Intl.Locale(input)
	}
}
