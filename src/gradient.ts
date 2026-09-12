import { MS_IN_DAY, MS_IN_HOUR, MS_IN_MIN, MS_IN_S } from '~/src/consts.ts'

type HslaStr = `hsla(${number}, ${number}%, ${number}%, ${number})`

type Gradient = {
	stops: [zenith: HslaStr, horizon: HslaStr]
}

const gradients: Gradient[] = [
	/* 00 */ { stops: ['hsla(  0,   0%,   0%, 0   )', 'hsla(  0,   0%,   0%, 0   )'] },
	/* 03 */ { stops: ['hsla(  0,   0%,   0%, 0   )', 'hsla(240,  18%,  39%, 1   )'] },
	/* 06 */ { stops: ['hsla(242,  28%,  35%, 1   )', 'hsla(323,  54%,  64%, 1   )'] },
	/* 09 */ { stops: ['hsla(210,  86%,  46%, 1   )', 'hsla(205, 100%,  65%, 1   )'] },
	/* 12 */ { stops: ['hsla(210,  72%,  47%, 1   )', 'hsla(205,  70%,  59%, 1   )'] },
	/* 15 */ { stops: ['hsla(210,  63%,  38%, 1   )', 'hsla(205,  60%,  59%, 1   )'] },
	/* 18 */ { stops: ['hsla(210,  68%,  35%, 1   )', 'hsla(205,  40%,  53%, 1   )'] },
	/* 21 */ { stops: ['hsla(210,  90%,  30%, 0.6 )', 'hsla(36,   91%,  33%, 0.8 )'] },
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
