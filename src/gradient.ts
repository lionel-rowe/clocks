import { MS_IN_DAY, MS_IN_HOUR, MS_IN_MIN, MS_IN_S } from '~/src/consts.ts'

type HslaStr = `hsla(${number}, ${number}%, ${number}%, ${number})`

type Gradient = {
	stops: [zenith: HslaStr, horizon: HslaStr]
}

const gradients: Gradient[] = [
	/* 00 */ { stops: ['hsla(  0,   0%,   0%, 0   )', 'hsla(  0,   0%,   0%, 0   )'] },
	/* 03 */ { stops: ['hsla(  0,   0%,   0%, 0   )', 'hsla(240,  18%,  39%, 1   )'] },
	/* 06 */ { stops: ['hsla(242,  28%,  35%, 1   )', 'hsla(323,  54%,  64%, 1   )'] },
	/* 09 */ { stops: ['hsla(210,  90%,  30%, 1   )', 'hsla(200, 100%,  60%, 1   )'] },
	/* 12 */ { stops: ['hsla(212,  85%,  50%, 1   )', 'hsla(202, 100%,  70%, 1   )'] },
	/* 15 */ { stops: ['hsla(215,  80%,  30%, 1   )', 'hsla(205,  95%,  60%, 1   )'] },
	/* 18 */ { stops: ['hsla(217,  80%,  25%, 1   )', 'hsla(207,  90%,  50%, 1   )'] },
	/* 21 */ { stops: ['hsla(220,  80%,  20%, 0.9 )', 'hsla( 36,  91%,  33%, 1   )'] },
]

export function getGradient(pt: Temporal.PlainTime) {
	const f = fractionOfDay(pt)

	const i = f * gradients.length

	const floor = Math.floor(i) % gradients.length
	const ceil = Math.ceil(i) % gradients.length
	const progress = i % 1

	const floorStops = gradients[floor]!.stops
	const ceilStops = gradients[ceil]!.stops

	const zenithColour = `color-mix(in oklab, ${floorStops[0]}, ${ceilStops[0]} ${progress * 100}%)`
	const horizonColour = `color-mix(in oklab, ${floorStops[1]}, ${ceilStops[1]} ${progress * 100}%)`

	return `linear-gradient(
		to bottom,
		${zenithColour},
		${horizonColour}
	)`
}

function fractionOfDay(pt: Temporal.PlainTime): number {
	return (pt.hour * MS_IN_HOUR + pt.minute * MS_IN_MIN + pt.second * MS_IN_S + pt.millisecond) / MS_IN_DAY
}
