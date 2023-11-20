/**
 * @param {ReadableStream<string>} stream
 * @param {RegExp} re
 * @returns {Promise<RegExpStringIterator>}
 */
async function readableStreamMatchAll(stream, re) {
    const array = []
    let buffer = ""
    for await (const chunk of stream) {
        
    }
    return array.values()
}

const response = await fetch("https://raw.githubusercontent.com/eneko/Pi/master/one-million.txt")
const stream = response.body.pipeThrough(new TextDecoderStream())
const matches = [...await readableStreamMatchAll(stream, /420/)]
console.table(matches)