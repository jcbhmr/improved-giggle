class MatchAllStream {
    static {
        Object.defineProperty(this, "name", { value: "MatcherStream", configurable: true })
        Object.defineProperty(this.prototype, Symbol.toStringTag, { value: "MatcherStream", configurable: true })
    }

    /** @type {ReadableStream<RegExpExecArray>} */
    #readable
    /** @type {WritableStream<string>} */
    #writable
    /** @type {{ exec(s: string) => any; lastIndex: number }} */
    #matcher
    /** @type {string} */
    #buffer = ""
    /** @type {number} */
    #offset = 0
    /** @param {RegExp | string | { exec(s: string) => any; lastIndex: number }} matcherRaw */
    constructor(matcherRaw) {
        if (matcherRaw == null) {
            throw new TypeError("matcher must not be null or undefined")
        }
        if (!matcherRaw.flags.includes("g")) {
            throw new TypeError("matcher RegExp must have g flag set")
        }
    const { readable, writable } = new TransformStream({
        transform: this.#transform.bind(this),
        flush: this.#flush.bind(this)
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
/**
 * @param {string} chunk
 * @param {TransformStreamDefaultController} controller
 */
#transform(chunk, controller) {
    let buffer = this.#buffer
    let offset = this.#offset
    const matcher = this.#matcher
    buffer += `${chunk}`
    for (let match = matcher.exec(buffer); match != null; match = matcher.exec(buffer)) {
        console.log({ buffer, match, "matcher.lastIndex": matcher.lastIndex, matcher, offset })
        controller.enqueue(match)
        const lastIndex = Math.min(Math.max(0, Math.trunc(matcher.lastIndex)), Number.MAX_SAFE_INTEGER) || 1
        const used = Math.min(lastIndex, buffer.length)
        buffer = buffer.slice(used)
        offset += used
        matcher.lastIndex = lastIndex - used
    }
    this.#buffer = buffer
    this.#offset = offset
}
/** @param {TransformStreamDefaultController} controller */
#flush(controller) {
    this.buffer = ""
    this.matcher = undefined
}
}

export { MatchStream, MatchAllStream }