# Effects and events

## Separate events from synchronization

- Run submit, click, and drag side effects in their event handlers. Use effects to synchronize with external systems.
- List every reactive value an effect reads. Depend on the specific primitive or derived boolean it uses, such as `user.id`, instead of a broader object.
- Split unrelated effects with different dependencies so each synchronizes independently.
- Run app-wide initialization in the browser entry module or behind a module guard. An empty dependency array does not make an effect run once per app load. Components can remount.

## Keep subscriptions current

- Use `useEffectEvent` for callbacks fired by an effect's subscription or timer that need the latest props or state without resubscribing.
- Call Effect Events only from effects or callbacks they install. Keep them local to the component or hook that owns the effect.
- Omit Effect Events from dependency arrays because their identity is not stable. Keep actual synchronization dependencies explicit. See [useEffectEvent](https://react.dev/reference/react/useEffectEvent).

The listener stays attached while `onResize` can change:

```js
const handleResize = useEffectEvent(onResize);

useEffect(() => {
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);
```

## Share global listeners

- When many components subscribe to the same global event, share one listener and dispatch to subscribers. Remove it when the last subscriber leaves.
- Use `{ passive: true }` for touch or wheel listeners that never call `preventDefault()`. Keep gesture handlers non-passive when they must prevent scrolling.
