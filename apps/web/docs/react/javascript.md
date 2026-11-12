# JavaScript hot paths

Apply these optimizations to measured bottlenecks. Keep the simpler expression when its cost is negligible.

## Choose collections and algorithms

- Build a `Map` once for repeated lookups by key, or a `Set` for repeated membership checks. Reuse the index across the lookups that justify it.
- Combine repeated array scans when they are costly. Use `flatMap` when each input produces zero or more outputs. Use a loop for several result collections.
- Find minima or maxima in one pass. Sorting adds unnecessary work, and spreading a large array into `Math.min` or `Math.max` can exceed argument limits.
- Compare array lengths before sorting or deep comparison. Return as soon as the final result is known.
- Treat props and state as immutable. Use `toSorted`, `toReversed`, `toSpliced`, or `with`. Copy first when a mutating operation is required.

## Reuse work deliberately

- Hoist invariant property reads out of hot loops when the value cannot change during the loop.
- Cache expensive pure function results by all relevant inputs. A module `Map` can serve components, utilities, and handlers. Bound its growth and define invalidation.
- Hoist constant regular expressions or memoize dynamic ones by their inputs. Escape literal user input in patterns, and account for mutable `lastIndex` on global or sticky expressions.
- For synchronous browser storage reads, follow [storage cache rules](client-data.md#cache-repeated-storage-reads). For layout measurements, follow [rendering rules](rendering.md#reduce-browser-work).

## Defer background work

- Use `requestIdleCallback` for non-urgent analytics, prefetching, or data processing. Keep user feedback and time-sensitive work immediate.
- Supply a timeout when work must not wait indefinitely. Split large jobs using `deadline.timeRemaining()` and reschedule unfinished work.
- Feature-detect `requestIdleCallback` and provide a timer fallback. A timer does not supply an `IdleDeadline`. Use a separate chunking path if the callback needs one.
