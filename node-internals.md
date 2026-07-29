### What is the Node.js Event Loop?

The event loop is the mechanism that allows Node.js to perform non-blocking I/O operations while using a single JavaScript thread.

It cycles through six phases each iteration, always in the same order, then wraps back to the top.

1. **timers:** runs callbacks scheduled by `setTimeout` and `setInterval` whose threshold has elapsed.
2. **pending callbacks:** executes I/O callbacks deferred from the previous loop iteration.
3. **idle, prepare:** internal-only phase Node uses to prepare for the poll phase. Not used by application code.
4. **poll:** retrieves new I/O events and runs their callbacks (file reads, network data).
5. **check:** runs `setImmediate` callbacks, right after the poll phase completes.
6. **close callbacks:** runs close event callbacks, e.g. `socket.on('close', ...)`

--------

### What is Libuv and What Role Does It Play in Node.js?

`libuv` is the C library that implements the Node.js event loop and all of the asynchronous behaviors of the platform.

It provides:

- The event loop implementation itself, the six phases are `libuv`'s design, not something Node built on top of it
- A thread pool (default 4 threads) for operations that can't be done async at the OS level
- OS-level async I/O abstraction since Linux, macOS, and Windows all handle async I/O differently, so `libuv` gives Node one consistent API regardless of platform

--------

### How Does Node.js Handle Asynchronous Operations Under the Hood?

Node.js forwards the request to `libuv` and continues running. 

`libuv` determines how to execute it depending on the operation:

- **Network I/O:** Handled by the OS, no thread pool needed. `libuv` just registers interest and gets notified when data is ready.
- **Timers:** Just registered with a target time, `libuv` checks elapsed time each loop iteration in the timers phase.
- **File system I/O, crypto (e.g. pbkdf2), some zlib:** These OS APIs are often blocking, so `libuv` offloads them to the thread pool.

When the operation finishes (callback is queued, Promise is resolved, async function continues), the event loop executes the callback when the call stack is empty.

--------

### What is the Difference Between the Call Stack, Event Queue, and Event Loop in Node.js?

- **Call stack:** contains functions that are currently executing.
- **Event queue:** holds callbacks from timers, I/O, and `setImmediate` waiting to be executed when the loop reaches the right phase and the call stack becomes empty.
- **Event loop:** acts as the coordinator between the call Stack and callback queues, it cycles through phases and moves callbacks from queues onto the call stack when it becomes empty.

--------

### What is the Node.js Thread Pool and How to Set the Thread Pool Size?

`libuv` provides a fixed-size thread pool (default 4) used for operations that cannot be performed asynchronously by the OS.

To set the thread pool size, set the `UV_THREADPOOL_SIZE` environment variable before starting Node, e.g. `UV_THREADPOOL_SIZE=8 node server.js`.

--------

### How Does Node.js Handle Blocking and Non-Blocking Code Execution?

- **Blocking:** runs synchronously on the main thread and halts the event loop, nothing else can execute until it finishes.

```js
const data = fs.readFileSync('bigfile.txt');

console.log("Log") // won't be logged till the file read finishes
```

- **Non-blocking:** kicks off the operation, returns immediately, and lets the event loop keep processing other work (going through the six phases). The result arrives later via callback/Promise.

```js
fs.readFile('bigfile.txt', (err, data) => { /* ... */ });

console.log("Log") // logged immediately, won't wait till the file read finishes
```