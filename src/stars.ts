export class StarCreator {
	random = Math.random

	createStarsSvg(count: number, dimensions: [width: number, height: number]) {
		const [width, height] = dimensions
		const stars = Array.from({ length: count }, () => this.#createStar(width, height))
		return this.#svgBoilerplate(
			width,
			height,
			stars.map((star) =>
				`<circle cx="${star.x}" cy="${star.y}" r="${star.size}" fill="url(#star)" fill-opacity="${star.alpha}" />`
			).join('\n'),
		)
	}

	#createStar(width: number, height: number) {
		return {
			x: width * this.random(),
			y: height * this.random(),
			size: 1 + this.random() * 2,
			// skews distribution for rare bright stars
			alpha: Math.pow(this.random(), 4),
		}
	}

	#svgBoilerplate(width: number, height: number, content: string) {
		return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
			<defs>
				<radialGradient id="star">
					<stop offset="10%" stop-color="#ffff" />
					<stop offset="95%" stop-color="#fff0" />
				</radialGradient>
			</defs>
			<rect width="100%" height="100%" fill="#001" />

			${content}
		</svg>`
	}
}
