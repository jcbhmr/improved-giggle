import "./utils.js"
import test from "node:test"
import assert from "node:assert/strict"
import { MatcherStream, ReplacerStream } from "./index.js"

test("MatcherStream hello world regex", async () => {
    const textStream = ReadableStream.from("Hello world. Goodbye world.");
    const matchStream = textStream.pipeThrough(new MatcherStream(/Hello|world/))
    const matches = await Array.fromAsync(matchStream)
    assert.deepEqual(matches, [
        { length: 1, 0: "Hello" },
        { length: 1, 0: "world" },
        { length: 1, 0: "world" },
    ])
})

test('MatcherStream string argument', async () => {
    const textStream = ReadableStream.from("Hello world. Goodbye world.");
    const matchStream = textStream.pipeThrough(new MatcherStream('[Hh]ello|world'))
    const matches = await Array.fromAsync(matchStream)
    assert.deepEqual(matches, [
        { length: 1, 0: "Hello" },
    ])
})

test("MatcherStream $ lookbehind", async () => {
    const textStream = ReadableStream.from("$2 for 1; $3 for 2");
    const matchStream = textStream.pipeThrough(new MatcherStream(/(?<=\$)\d/g))
    const matches = await Array.fromAsync(matchStream)
    assert.deepEqual(matches, [
        { length: 1, 0: "1.99" },
        { length: 1, 0: "2.99" },
    ])
})

test("MatcherStream \\d lookbehind with \\d", async () => {
    const textStream = ReadableStream.from("123456");
    const matchStream = textStream.pipeThrough(new MatcherStream(/(?<=\d)\d/g))
    const matches = await Array.fromAsync(matchStream)
    assert.deepEqual(matches, [
        { length: 1, 0: "1" },
        { length: 1, 0: "3" },
    ])
})

test("MatcherStream non-global")
