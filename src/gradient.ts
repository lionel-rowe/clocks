import { MS_IN_DAY, MS_IN_HOUR, MS_IN_MIN, MS_IN_S } from '~/src/consts.ts'
import { interpolate } from '~/src/utils.ts'

type HslaStr = `hsla(${number}, ${number}%, ${number}%, ${number})`

type Gradient = {
	time: number
	stops: [zenith: HslaStr, horizon: HslaStr]
}

// deno-fmt-ignore
const gradients: Gradient[] = [
	{ time:  0, stops: ['hsla(  0,   0%,   0%, 0   )', 'hsla(  0,   0%,   0%, 0   )'] },
	{ time:  4, stops: ['hsla(  0,   0%,   0%, 0   )', 'hsla(210,  50%,  20%, 0.5 )'] },
	{ time:  6, stops: ['hsla(  0,   0%,   0%, 0   )', 'hsla(240,  18%,  39%, 1   )'] },
	{ time:  8, stops: ['hsla(242,  28%,  35%, 1   )', 'hsla(323,  54%,  64%, 1   )'] },
	{ time: 10, stops: ['hsla(210,  90%,  30%, 1   )', 'hsla(200, 100%,  60%, 1   )'] },
	{ time: 12, stops: ['hsla(212,  85%,  50%, 1   )', 'hsla(205, 100%,  70%, 1   )'] },
	{ time: 15, stops: ['hsla(215,  80%,  30%, 1   )', 'hsla(210,  95%,  60%, 1   )'] },
	{ time: 18, stops: ['hsla(217,  80%,  25%, 1   )', 'hsla(215,  90%,  50%, 1   )'] },
	{ time: 20, stops: ['hsla(220,  80%,  20%, 0.9 )', 'hsla( 36,  91%,  33%, 1   )'] },
	{ time: 22, stops: ['hsla(220,  80%,  20%, 0.6 )', 'hsla(220,  80%,  20%, 0.3 )'] },
]

const times = gradients.map((g) => g.time)

export function getGradient(pt: Temporal.PlainTime) {
	const f = fractionOfDay(pt)
	const { progress, startIdx, endIdx } = interpolate(times, { target: f * 24, total: 24 })

	const startStops = gradients[startIdx]!.stops
	const endStops = gradients[endIdx]!.stops

	const zenithColour = `color-mix(in oklab, ${startStops[0]}, ${endStops[0]} ${progress * 100}%)`
	const horizonColour = `color-mix(in oklab, ${startStops[1]}, ${endStops[1]} ${progress * 100}%)`

	return `linear-gradient(
		to bottom,
		${zenithColour},
		${horizonColour}
	)`
}

function fractionOfDay(pt: Temporal.PlainTime): number {
	return (pt.hour * MS_IN_HOUR + pt.minute * MS_IN_MIN + pt.second * MS_IN_S + pt.millisecond) / MS_IN_DAY
}
