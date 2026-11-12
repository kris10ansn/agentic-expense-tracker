# State and renders

## Keep state minimal

- Derive values from current props and state during render. Use a key when a prop change should reset a component's state.
- Read values used only in callbacks at the point of use. Subscribe only when a change must update the UI, and select the smallest value needed, such as a breakpoint boolean instead of window width.
- Use functional updates when the next state depends on previous state, such as `setCount((count) => count + 1)`. Direct updates suit values from arguments or props.
- Pass a pure initializer to `useState` for expensive initial values, such as `useState(() => buildIndex(items))`. Keep cheap initial values direct.
- Use refs for timers and transient values that do not drive rendered output. Ref changes do not trigger renders.

## Preserve identity and skip work

- Define components at module scope and pass values as props. Nested definitions create new component types, causing remounts, lost state, and lost focus.
- Move expensive work into a child that the parent can skip while loading. Memoize that child when unchanged props would otherwise repeat costly work.
- Use stable constants for default arrays, objects, and callbacks when their identity affects child props or hook dependencies.
- Compute cheap primitive expressions directly. Reserve `useMemo` for costly calculations or identities needed by memoized consumers.
- Split independent memoized calculations by their dependencies, such as filtering before sorting, so a sort change does not repeat filtering.
- If React Compiler is enabled, check its output before adding manual memoization or static JSX hoisting.

## Keep input responsive

- Use `startTransition` for non-urgent state updates. Keep controlled input updates urgent. Use the `isPending` value from `useTransition` for transition feedback instead of a duplicate loading flag.
- Wrap state updates after an `await` in another `startTransition` when they must remain transitions. Transitions do not cancel requests or guarantee their completion order. See [useTransition](https://react.dev/reference/react/useTransition).
- Use `useDeferredValue` when an input or prop drives an expensive render. Keep the input current and let the results lag, with a visible stale indicator when useful.
- Memoize the expensive calculation or child using the deferred value so urgent renders can skip it. Deferral does not debounce network requests. See [useDeferredValue](https://react.dev/reference/react/useDeferredValue).

For prop-driven effects or interaction side effects, read [Effects and events](effects.md).
