if (!ReadableStream.from) {
    // Polyfill for ReadableStream.from
    ReadableStream.from = function (anyIterable) {
      if (typeof anyIterable !== 'object' || anyIterable === null) {
        throw new TypeError('ReadableStream.from() expects an iterable or async iterable.');
      }
  
      // Check if it's an async iterable
      const isAsyncIterable = Symbol.asyncIterator in anyIterable;
  
      return new ReadableStream({
        async start(controller) {
          const iterator = isAsyncIterable ? anyIterable[Symbol.asyncIterator]() : anyIterable[Symbol.iterator]();
  
          async function pull() {
            const result = isAsyncIterable ? await iterator.next() : iterator.next();
  
            if (result.done) {
              controller.close();
            } else {
              controller.enqueue(result.value);
              pull();
            }
          }
  
          pull();
        },
      });
    };
  }

  if (!Array.fromAsync) {
    Array.fromAsync = async function(arrayLike, mapFn, thisArg) {
      // Ensure arrayLike is iterable
      if (!arrayLike[Symbol.asyncIterator] && !arrayLike[Symbol.iterator]) {
        throw new TypeError('Object is not iterable');
      }
  
      const iterator = arrayLike[Symbol.asyncIterator] || arrayLike[Symbol.iterator];
  
      // Ensure mapFn is a function if provided
      if (mapFn && typeof mapFn !== 'function') {
        throw new TypeError('The second argument must be a function');
      }
  
      // Ensure thisArg is provided and is an object
      if (thisArg && typeof thisArg !== 'object') {
        throw new TypeError('The third argument must be an object');
      }
  
      const resultArray = [];
      let index = 0;
  
      try {
        for await (const element of iterator.call(arrayLike)) {
          const mappedValue = mapFn ? await mapFn.call(thisArg, element, index) : element;
          resultArray.push(mappedValue);
          index++;
        }
      } catch (error) {
        // Handle errors during iteration
        throw error;
      }
  
      return resultArray;
    };
  }