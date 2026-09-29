import { typeByExtension } from '@std/media-types'
import { minify } from '@node-minify/core'
import { lightningCss } from '@node-minify/lightningcss'
import { htmlMinifier } from '@node-minify/html-minifier'

export function resolve(path: string) {
	return new URL(import.meta.resolve(path)).pathname
}

export function stringify(str: string) {
	return JSON.stringify(str)
		.replaceAll("'", String.raw`\'`)
		.replaceAll(/[\u2028\u2029]/g, (m) => String.raw`\u${m.charCodeAt(0).toString(16).padStart(4, '0')}`)
		.slice(1, -1)
}

export function getType(path: string) {
	return typeByExtension(path.split('.').pop() ?? '')
}

export async function dataUri(path: string) {
	return `data:${getType(path)};base64,${new Uint8Array(await Deno.readFile(path)).toBase64()}`
}

export async function text(path: string) {
	const content = await Deno.readTextFile(path)
	const type = getType(path)

	let compressor
	switch (type) {
		case 'text/html': {
			compressor = htmlMinifier
			break
		}
		case 'text/css': {
			compressor = lightningCss
			break
		}
	}

	return stringify(compressor == null ? content : await minify({ compressor, content }))
}
