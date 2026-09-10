import { replaceAllAsync } from '@std/regexp/unstable-replace-all-async'
import { typeByExtension } from '@std/media-types'
import { debounce } from '@std/async/debounce'
import { minify } from '@node-minify/core'
import { lightningCss } from '@node-minify/lightningcss'
import { htmlMinifier } from '@node-minify/html-minifier'

const isWatchMode = Deno.args.includes('--watch') || Deno.args.includes('-w')

function resolve(path: string) {
	return new URL(import.meta.resolve(path)).pathname
}

const build = debounce(async () => {
	const proc = new Deno.Command('deno', {
		args: ['bundle', './src/main.ts'],
		stdout: 'piped',
	}).spawn()

	let output = new TextDecoder().decode((await proc.output()).stdout)

	output = await replaceAllAsync(
		output,
		/\{\{\s*@datauri\s+(.+?)\s*\}\}/g,
		async (_, path) =>
			`data:${typeByExtension(path.split('.').pop() ?? '')};base64,${
				new Uint8Array(await Deno.readFile(resolve(path))).toBase64()
			}`,
	)

	output = await replaceAllAsync(output, /(['"])\{\{\s*@html\s+(.+?)\s*\}\}\1/g, async (_, _2, path) => {
		const content = await replaceAllAsync(
			await Deno.readTextFile(resolve(path)),
			/<!--\s*@stylesheet\s+(.+?)\s*-->/g,
			async (_, path) => {
				const content = await Deno.readTextFile(resolve(path))

				const css = await minify({
					compressor: lightningCss,
					content,
				})
				return `<style>${css}</style>`
			},
		)

		const html = await minify({
			compressor: htmlMinifier,
			content,
		})

		return JSON.stringify(html)
	})

	await Deno.writeTextFile('./dist/main.js', output)
}, 200)

build()

if (isWatchMode) {
	await watch()
}

async function watch() {
	for await (const event of Deno.watchFs(['./src', './static'])) {
		if (event.kind === 'modify') {
			build()
		}
	}
}
