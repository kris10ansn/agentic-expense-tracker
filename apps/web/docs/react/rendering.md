# Rendering

## Reduce browser work

- Batch layout reads before style writes. If a measurement needs updated styles, apply the writes together and measure once. Interleaving reads and writes forces repeated layout.
- Prefer CSS classes for grouped style changes.
- For long lists, use `content-visibility: auto` with `contain-intrinsic-size` to skip offscreen layout and paint while reserving space. React still renders the components.
- If SVG transforms animate poorly, animate an HTML wrapper and verify the result in the browser.
- Reduce SVG coordinate precision only as far as the image remains visually unchanged at its intended size.
- Hoist static JSX, especially large SVGs, outside components when it has no props or state dependencies. Check [compiler guidance](state.md#preserve-identity-and-skip-work) before doing this manually.

## Preserve intended UI behavior

- Use an explicit boolean or ternary for conditional JSX when a value can be `0` or `NaN`, such as `count > 0 ? <Badge /> : null`.
- Use `<Activity mode={isOpen ? "visible" : "hidden"}>` for frequently toggled UI whose state and DOM should survive hiding. Hidden effects are cleaned up and restored when shown. See [Activity](https://react.dev/reference/react/Activity).

For differences between server and client markup, read [Hydration](server.md#hydration). For scripts and preloads, read [Bundles and resources](bundles.md#schedule-scripts-and-resources).
