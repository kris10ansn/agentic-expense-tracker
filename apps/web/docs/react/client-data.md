# Client data

## Share requests

- Use the existing tRPC and TanStack Query integration for request caching and deduplication across components.
- Include every input that changes a result in its query key. Use the query library's mutation state and cache updates or invalidation after writes. See [TanStack Query keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys).
- Give immutable data an appropriate freshness policy to avoid unnecessary revalidation.

## Store minimal browser data

- Version storage keys, such as `preferences:v1`, and migrate or discard older schemas when their shape changes.
- Persist only the fields the feature needs. Keep tokens, sensitive personal data, and internal server fields out of browser storage.
- Catch storage access and JSON parsing failures. Fall back to usable defaults when storage is unavailable, full, or malformed.

## Cache repeated storage reads

- If repeated synchronous reads are a measured cost, cache `localStorage`, `sessionStorage`, or cookie values in memory. A module cache also works in utilities and event handlers.
- Update or invalidate the cache on local writes. Handle relevant `storage` events, including a null key when storage is cleared.
- Refresh on visibility changes when other tabs or server-set cookies can change the value. Define invalidation before adding the cache.
