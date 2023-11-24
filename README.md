# Matcher streams

🔠 Incrementally match a `RegExp` or other [matchable] against a `ReadableStream`

## Usage

```js
import { MatchAllStream } from "matcher-streams"
const response = await fetch("https://html.spec.whatwg.org/")
const stream = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new MatchAllStream(/web\s+(\S+)/gi))
const matches = (await Array.fromAsync(stream)).flat()
console.table(matches)
```

<details><summary>ℹ If possible, it's recommended to <code>delete match.input</code> ASAP so that the chunk string can be garbage collected.</summary>

You can do this either by consuming the chunks without collecting or buffering them...

```js
import { MatchAllStream } from "matcher-streams"
const response = await fetch("https://streams.spec.whatwg.org/")
const stream = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new MatchAllStream(/web\s+(\S+)/gi))
for await (const matches of stream) {
    console.log(matches)
}
```

...or by manually discarding each chunk's input.

```js
import { MatchAllStream } from "matcher-streams"
const response = await fetch("https://streams.spec.whatwg.org/")
const stream = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new MatchAllStream(/web\s+(\S+)/gi))
    .pipeThrough(new TransformStream({
        transform(matches, controller) {
            for (const match of matches) {
                delete match.input
            }
            controller.enqueue(matches)
        }
    }))
const matches = (await Array.fromAsync(stream)).flat()
console.table(matches)
```

</details>

```js
import { ReplaceAllStream } from "matcher-streams"
const response = await fetch("https://streams.spec.whatwg.org/")
const stream = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new ReplaceAllStream(/html|css|js/gi, "magic"))
    .pipeThrough(new ReplaceAllStream(/\w/gi, x => x.toUpperCase()))
const text = (await Array.fromAsync(stream)).join("")
console.log(text)
```

## How it works

We are taking advantage of the `lastIndex` property that is critical to making this work. When you do `/hello/g.exec("hello hello world")` the `.lastIndex` property of the `/hello/g` `RegExp` object gets set to `5`. That means the next time we call `.exec("hello hello world")` that the internal matching algorithm will ignore the first five characters. That means we can effectively drop them from our internall stream buffer and just reset `.lastIndex` to zero.

⚠️ Since `(?=startswith)` lookbehind assertions and other assertion-like markers like `^` and `$` don't actually _consume_ tokens they can be fooled into false negatives.

<details><summary>Here's an example of a <code>(?=startswith)</code> lookbehind that behaves differently on whole-text and stream-text</summary>

```js
const input = "hihihi"
const re = /(?=hi)hi/g
const matches = []
let match
while (match = re.exec(input)) {
    matches.push(match)
}
console.log(matches)
//=> 
```

</details>
