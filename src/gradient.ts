const MS_IN_DAY = 24 * 60 * 60 * 1000

type Rgba = [r: number, g: number, b: number, a: number]
type RgbaStr = `rgba(${number} ${number} ${number} / ${number})`

function parseRgba(rgba: RgbaStr): Rgba {
	const match = rgba.match(/[\d.]+/g)!
	return match.map(Number) as Rgba
}

// deno-fmt-ignore
type H24<T> = [
	T, T, T, T, T, T, T, T,
	T, T, T, T, T, T, T, T,
	T, T, T, T, T, T, T, T,
]

const _zeniths: H24<RgbaStr> = [
	'rgba(0 0 6 / 0)',
	'rgba(2 1 12 / 0)',
	'rgba(2 1 14 / 0)',
	'rgba(2 1 17 / 0)',
	'rgba(32 32 44 / 0.5)',
	'rgba(64 64 92 / 0.8)',
	'rgba(74 73 105 / 1)',
	'rgba(117 122 191 / 1)',
	'rgba(130 173 219 / 1)',
	'rgba(148 197 248 / 1)',
	'rgba(163 214 230 / 1)',
	'rgba(144 223 254 / 1)',
	'rgba(87 193 235 / 1)',
	'rgba(45 145 194 / 1)',
	'rgba(36 115 171 / 1)',
	'rgba(40 92 152 / 1)',
	'rgba(30 82 142 / 1)',
	'rgba(21 66 119 / 1)',
	'rgba(22 60 82 / 0.9)',
	'rgba(7 27 38 / 0.8)',
	'rgba(1 10 16 / 0.6)',
	'rgba(9 4 1 / 0.3)',
	'rgba(0 0 12 / 1)',
	'rgba(0 0 6 / 0)',
]

const _horizons: H24<RgbaStr> = [
	'rgba(0 0 12 / 0)',
	'rgba(32 32 44 / 0.8)',
	'rgba(58 58 82 / 1)',
	'rgba(81 81 117 / 1)',
	'rgba(138 118 171 / 1)',
	'rgba(205 130 160 / 1)',
	'rgba(234 176 209 / 1)',
	'rgba(235 178 177 / 1)',
	'rgba(177 181 234 / 1)',
	'rgba(148 223 255 / 1)',
	'rgba(103 209 251 / 1)',
	'rgba(56 163 209 / 1)',
	'rgba(60 156 189 / 1)',
	'rgba(26 182 221 / 1)',
	'rgba(41 186 214 / 1)',
	'rgba(51 188 214 / 1)',
	'rgba(61 196 214 / 1)',
	'rgba(37 135 209 / 1)',
	'rgba(32 106 192 / 1)',
	'rgba(22 96 182 / 1)',
	'rgba(22 36 122 / 1)',
	'rgba(75 29 6 / 0.5)',
	'rgba(21 8 0 / 0.1)',
	'rgba(0 0 12 / 0)',
]

const zeniths = _zeniths.map(parseRgba) as H24<Rgba>
const horizons = _horizons.map(parseRgba) as H24<Rgba>

export function getGradient(pt: Temporal.PlainTime): { zenith: RgbaStr; horizon: RgbaStr } {
	const fractionOfDay = (pt.hour * 60 * 60 * 1000 + pt.minute * 60 * 1000 + pt.second * 1000 + pt.millisecond) /
		MS_IN_DAY

	const i = fractionOfDay * 24

	const floor = Math.floor(i) % 24
	const ceil = Math.ceil(i) % 24
	const progress = i % 1

	const zenith = rgbaToString(interpolateRgba(zeniths[floor], zeniths[ceil], progress))
	const horizon = rgbaToString(interpolateRgba(horizons[floor], horizons[ceil], progress))

	return { zenith, horizon }
}

function interpolateRgba(low: Rgba, high: Rgba, progress: number): Rgba {
	const r = interpolateValue(low[0], high[0], progress)
	const g = interpolateValue(low[1], high[1], progress)
	const b = interpolateValue(low[2], high[2], progress)
	const a = interpolateValue(low[3], high[3], progress)

	return [r, g, b, a]
}

function interpolateValue(low: number, high: number, progress: number): number {
	return low + (high - low) * progress
}

function rgbaToString([r, g, b, a]: Rgba): RgbaStr {
	return `rgba(${Math.round(r)} ${Math.round(g)} ${Math.round(b)} / ${Number(a.toFixed(3))})`
}
