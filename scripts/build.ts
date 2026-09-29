import { replaceAllAsync } from '@std/regexp/unstable-replace-all-async'
import { debounce } from '@std/async/debounce'
import { unreachable } from '@std/assert/unreachable'
import { dataUri, resolve, text } from '~/scripts/buildUtils.ts'

const isWatchMode = Deno.args.includes('--watch') || Deno.args.includes('-w')

const build = debounce(async () => {
	const proc = new Deno.Command('deno', {
		args: ['bundle', './src/main.ts'],
		stdout: 'piped',
	}).spawn()

	let output = new TextDecoder().decode((await proc.output()).stdout)

	output = await replaceAllAsync(
		output,
		/\{\{\s*@(text|datauri)\s+(.+?)\s*\}\}/g,
		(_, ident, path) => {
			path = resolve(path)

			switch (ident) {
				case 'text': {
					return text(path)
				}
				case 'datauri': {
					return dataUri(path)
				}
				default: {
					unreachable()
				}
			}
		},
	)

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
