/** A crappy PRNG */
export function prng(seed: number) {
	return () => {
		// Take the sine, multiply to shift decimals, and grab the fractional part
		const x = Math.sin(seed++) * 10000
		return x - Math.floor(x)
	}
}
