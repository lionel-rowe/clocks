import { MS_IN_DAY, MS_IN_HOUR, MS_IN_MIN, MS_IN_S } from '~/src/consts.ts'
import { interpolate } from '~/src/utils.ts'

type HslaStr = `hsla(${number}, ${number}%, ${number}%, ${number})`

type Stop = [hsla: HslaStr, stopPercent: number | null]
type Stops = [zenith: Stop, horizon: Stop]

type Gradient = [
	time: `${number}:${number}`,
	stops: Stops,
]

const gradients: Gradient[] = [
	['00:00', [['hsla(  0,   0%,   0%, 0   )', null], ['hsla(  0,   0%,   0%, 0   )', null]]],
	['04:00', [['hsla(  0,   0%,   0%, 0   )', null], ['hsla(210,  50%,  20%, 0.5 )', null]]],
	['06:00', [['hsla(  0,   0%,   0%, 0   )', null], ['hsla(240,  18%,  39%, 1   )', null]]],
	['08:00', [['hsla(242,  28%,  35%, 1   )', 0.60], ['hsla(323,  54%,  64%, 1   )', null]]],
	['10:00', [['hsla(210,  90%,  30%, 1   )', null], ['hsla(200, 100%,  60%, 1   )', null]]],
	['12:00', [['hsla(212,  85%,  50%, 1   )', null], ['hsla(205, 100%,  70%, 1   )', null]]],
	['15:00', [['hsla(215,  80%,  30%, 1   )', null], ['hsla(210,  95%,  60%, 1   )', null]]],
	['18:00', [['hsla(217,  80%,  25%, 1   )', null], ['hsla(215,  90%,  50%, 1   )', null]]],
	['20:00', [['hsla(220,  80%,  20%, 0.9 )', 0.60], ['hsla( 36,  91%,  33%, 1   )', null]]],
	['22:00', [['hsla(220,  80%,  20%, 0.6 )', null], ['hsla(220,  80%,  20%, 0.3 )', null]]],
]

const times = gradients.map((g) => fractionOfDay(Temporal.PlainTime.from(`T${g[0]}`)))

export function getGradient(pt: Temporal.PlainTime) {
	const f = fractionOfDay(pt)
	const { progress, startIdx, endIdx } = interpolate(times, { target: f, total: 1 })

	const startStops = gradients[startIdx]![1]
	const endStops = gradients[endIdx]![1]

	const zenithColour = toGradientStop(startStops[0], endStops[0], progress, 1)
	const horizonColour = toGradientStop(startStops[1], endStops[1], progress, -1)

	return `linear-gradient(
		to bottom,
		${zenithColour},
		${horizonColour}
	)`
}

function toGradientStop(
	startStop: [HslaStr, number | null],
	endStop: [HslaStr, number | null],
	progress: number,
	dir: 1 | -1,
): string {
	let [startHsla, startPercent] = startStop
	let [endHsla, endPercent] = endStop
	startPercent ??= 0
	endPercent ??= 0

	let pct = (startPercent + (endPercent - startPercent) * progress) * 100

	if (dir === -1) pct = 100 - pct

	return `color-mix(in oklab, ${startHsla}, ${endHsla} ${Number((progress * 100).toFixed(2))}%) ${
		Number(pct.toFixed(2))
	}%`
}

function fractionOfDay(pt: Temporal.PlainTime): number {
	return (pt.hour * MS_IN_HOUR + pt.minute * MS_IN_MIN + pt.second * MS_IN_S + pt.millisecond) / MS_IN_DAY
}
