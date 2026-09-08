import { replaceAllAsync } from '@std/regexp/unstable-replace-all-async'
import { typeByExtension } from '@std/media-types'

function resolve(path: string) {
	return new URL(import.meta.resolve(path)).pathname
}

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
	return JSON.stringify(
		await replaceAllAsync(
			await Deno.readTextFile(resolve(path)),
			/<!--\s*@stylesheet\s+(.+?)\s*-->/g,
			async (_, path) => `<style>${await Deno.readTextFile(resolve(path))}</style>`,
		),
	)
})

await Deno.writeTextFile('./dist/main.js', output)
