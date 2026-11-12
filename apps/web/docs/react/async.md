# Async work

## Remove request waterfalls

- Check cheap synchronous guards before remote flags. Preserve ordering when checks depend on each other or have ordered side effects.
- Start optional work inside the branch that needs it. Await required work only where its result is needed.
- Start independent operations together and await them with `Promise.all()`, including in API handlers.
- Chain dependent work from its own prerequisite so unrelated requests cannot delay it. Keep authorization before protected work.
- For nested collections, chain each item's dependent fetch inside its promise, then await the collection. A slow item should delay only its own dependencies.

Here, the profile starts as soon as the user arrives, even if config is still loading:

```js
const userPromise = fetchUser();
const [profile, config] = await Promise.all([
  userPromise.then((user) => fetchProfile(user.id)),
  fetchConfig(),
]);
```

## Place loading boundaries

- Put a Suspense boundary around the part that waits so the surrounding layout can render immediately. Share a cached promise when multiple consumers need the same result.
- Use a fallback that preserves layout. Keep layout-critical data together, and consider initial content requirements before splitting a boundary.
- Suspense needs a supported source, such as `lazy` or a Suspense-enabled data API. Fetches in effects or event handlers do not activate it. See [React Suspense](https://react.dev/reference/react/Suspense).
