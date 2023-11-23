function isObject(thing) {
    return thing != null && (typeof thing === "object" || typeof thing === "function")
}

/**
 * @param {any} match 
 * @param {number} offset 
 */
function applyOffset(match, offset) {
    if (!isObject(match)) {
        return match
    }
    index: if ("index" in match) {
        const { index } = match
        if (typeof index !== "number") {
            break index;
        }
        match.index = index + offset;
    }
    indices: if ("indices" in match) {
        const {indices} = match
        if (!isObject(indices)) {
            break indices
        }
        if (Symbol.iterator in indices) {
            for (const pair of indices) {
                if (typeof pair !== "object" || pair == null) {
                    continue
                }
                const { 0: a } = pair
                if (typeof a === "number") {
                    pair[0] = a + offset
                }
                const { 1: b } = pair
                if (typeof b === "number") {
                    pair[1] = b + offset
                }
            }
        }
        groups: if ("groups" in indices) {
            const {groups} = indices
            if (!isObject(groups)) {
                break groups;
            }
            const values = Object.keys(groups)
            for (let i = 0; i < values.length; i++) {
                const value = values[i]
                const { 0: a } = value
                if (typeof a === "number") {
                    value[0] = a + offset
                }
                const {1: b} = value
                if (typeof b === "number") {
                    value[1] = b + offset
                }
            }
        }
    }
    return match
}

class MatcherStream {
    static {
        Object.defineProperty(this, "name", { value: "MatcherStream", configurable: true })
        Object.defineProperty(this.prototype, Symbol.toStringTag, { value: "MatcherStream", configurable: true })
    }

    /** @type {ReadableStream<RegExpExecArray>} */
    #readable
    /** @type {WritableStream<string>} */
    #writable
    /** @param {RegExp | string | { exec(s: string) => any; lastIndex: number }} matcherRaw */
    constructor(matcherRaw) {
        if (!isObject(matcherRaw)) {
            throw new TypeError(`$1 is not an object`)
        }
        const { constructor = RegExp } = matcherRaw
        if (!isObject(constructor)) {
            throw new TypeError(`$1.constructor is not an object`)
        }
        const species = constructor[Symbol.species] ?? RegExp
        try {
            Reflect.construct(Object, [], species)
        } catch {
            throw new TypeError(`$1.constructor.@@species is not a constructor`)
        }
        /** @type {{ exec(s: string) => any; lastIndex: number }} */
        const matcher = new species(matcherRaw, `${matcherRaw.flags}`)
        matcher.lastIndex = Math.min(Math.max(0, Math.trunc(matcherRaw.lastIndex)), 2 ** 32) || 0
    const { readable, writable } = new TransformStream({
        matcher,
        buffer: "",
        offset: 0,
        chunks: 0,
        matches: 0,
        transform(chunk, controller) {
            let { buffer, offset, matcher } = this
            this.chunks++
            buffer += `${chunk}`
            for (let match = matcher.exec(buffer); match != null; match = matcher.exec(buffer)) {
                this.matches++
                applyOffset(match, offset)
                controller.enqueue(match)
                const lastIndex = Math.min(Math.max(0, Math.trunc(matcher.lastIndex)), 2 ** 32) || 1
                const used = Math.min(lastIndex, buffer.length)
                buffer = buffer.slice(used)
                offset += used
                matcher.lastIndex = lastIndex - used
            }
            this.buffer = buffer
            this.offset = offset
        },
        flush(controller) {
            this.buffer = ""
            this.matcher = undefined
        },
    })
    this.#readable = readable
    this.#writable = writable
}
get readable() {
    return this.#readable
}
get writable() {
    return this.#writable
}
}

/**
 * @template T
 * @param {AsyncIterable<T>} stream
 */
async function collect(stream) {
    /** @type {T[]} */
    const list = [];
    for await (const chunk of stream) {
        list.push(chunk);
    }
    return list;
  }

import { Readable } from "node:stream";
import { createReadStream } from "node:fs"
const stream = Readable.toWeb(createReadStream("all_shakespeare.txt", {encoding: "utf8"}))
// const matches = [...await readableStreamMatchAll(stream, /.{0,40}(?<w>the.{0,20}).{0,20}/gmds)].map(x => (delete x.input, {...x, ...x.indices && { indices: {...x.indices}}}))
// console.log("matches.length:", matches.length)
// console.log("last 5 matches:")
// console.dir(matches.slice(-5), { depth: null })

const matches = await collect(stream.pipeThrough(new MatcherStream(/.{0,40}(?<w>the.{0,20}).{0,20}/gmds)))
console.log("matches.length:", matches.length)