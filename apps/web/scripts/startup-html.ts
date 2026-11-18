import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { compile } from "tailwindcss";
import type { Plugin } from "vite";
import { Button } from "../src/components/inputs.tsx";
import { LoadingScreen } from "../src/components/LoadingScreen.tsx";

const stylesheet = fileURLToPath(new URL("../src/styles.css", import.meta.url));
const require = createRequire(import.meta.url);
const marker = "<!-- startup-screen -->";

export async function renderStartupHtml() {
  const loading = renderToStaticMarkup(
    createElement(LoadingScreen, { kind: "loading", phase: "loading" }),
  );
  const error = renderToStaticMarkup(
    createElement(LoadingScreen, {
      kind: "error",
      message: "Unable to load the app. Please try again.",
      action: createElement(Button, null, "Reload"),
    }),
  );
  const content = `<div id="startup-screen" class="fixed inset-0 z-50">${loading}</div><template id="startup-error">${error}</template>`;
  const classes = new Set(
    [...content.matchAll(/class="([^"]*)"/g)].flatMap((match) =>
      (match[1] ?? "").split(/\s+/),
    ),
  );
  const compiler = await compile(await readFile(stylesheet, "utf8"), {
    base: dirname(stylesheet),
    async loadStylesheet(id, base) {
      const path =
        id === "tailwindcss"
          ? require.resolve("tailwindcss/index.css")
          : resolve(base, id);
      return {
        path,
        base: dirname(path),
        content: await readFile(path, "utf8"),
      };
    },
  });

  return { content, css: compiler.build([...classes]) };
}

export function startupHtml(): Plugin {
  return {
    name: "startup-html",
    transformIndexHtml: {
      order: "post",
      async handler(html) {
        if (!html.includes(marker)) {
          throw new Error(
            "The startup-screen marker is missing from index.html.",
          );
        }
        const { content, css } = await renderStartupHtml();
        return {
          html: html.replace(marker, content),
          tags: [
            {
              tag: "style",
              attrs: { id: "startup-styles" },
              children: css,
              injectTo: "head",
            },
          ],
        };
      },
    },
  };
}
