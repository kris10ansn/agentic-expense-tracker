# Bundles and resources

## Limit initial code

- Prefer direct local imports over barrels that re-export many modules. Use package subpaths only when the package exports them with types. Check the bundle before changing library imports. Deep `lucide-react` paths may lack declarations.
- Load large modules or data with `import()` when their feature is activated. Defer optional analytics and logging until after the initial render.
- Declare heavy components with `lazy` at module scope and render them inside [Suspense](async.md#place-loading-boundaries). Adapt named exports to the default export that `lazy` expects. See [React lazy](https://react.dev/reference/react/lazy).
- Use literal import paths or an explicit loader map so build tools can identify the reachable files. Keep server file paths statically analyzable too. See [Vite dynamic imports](https://vite.dev/guide/features.html#dynamic-import).
- Preload a likely feature on hover, focus, or an enabled feature flag. Reuse its loader so preloading and rendering request the same module.

For a named component export:

```js
const loadEditor = () => import("./Editor");
const Editor = lazy(() =>
  loadEditor().then((module) => ({ default: module.Editor })),
);
```

## Schedule scripts and resources

- For external classic scripts, use `defer` when execution order or the parsed DOM matters. Use `async` for independent scripts. Module scripts defer by default.
- Choose [React DOM resource hints](https://react.dev/reference/react-dom#resource-preloading-apis) for resources the current or likely next view needs:

| API                         | Purpose                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| `prefetchDNS`               | Resolve a domain in advance.                                       |
| `preconnect`                | Open a connection before a request.                                |
| `preload` / `preloadModule` | Download a resource or ES module.                                  |
| `preinit` / `preinitModule` | Download and apply a stylesheet, or execute a script or ES module. |

Use the [server guide](server.md#nextjs) for Next.js equivalents.
