import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

// Use an existing Playwright installation; no application dependency is needed.
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ?? "playwright"
);
const origin = process.env.WEB_URL ?? "http://127.0.0.1:4173";
const output = process.env.SCREENSHOT_DIR;
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {}),
});
const errors = [];
const session = {
  user: {
    id: "startup-test",
    name: "Startup test",
    email: "startup@example.com",
    emailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  session: {
    id: "startup-session",
    userId: "startup-test",
    token: "browser-test-only",
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

async function fixture(options = {}) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  page.on("pageerror", (error) => errors.push(error.message));
  const state = { auth: { status: 200, json: session }, privateRequests: 0 };
  await page.route("**/api/auth/get-session**", async (route) => {
    await route.fulfill(await state.auth);
  });
  await page.route("**/trpc/**", (route) => {
    state.privateRequests++;
    const names = new URL(route.request().url()).pathname
      .split("/trpc/")[1]
      .split(",");
    return route.fulfill({
      json: names.map(() => ({ result: { data: { json: [] } } })),
    });
  });
  return { context, page, state };
}

async function screenshot(page, name) {
  if (output) {
    // Capture the actual paint without waiting for intentionally stalled fonts.
    const client = await page.context().newCDPSession(page);
    const { data } = await client.send("Page.captureScreenshot");
    await writeFile(`${output}/${name}.png`, Buffer.from(data, "base64"));
    await client.detach();
  }
}

try {
  if (output) await mkdir(output, { recursive: true });

  // This is the original regression: HTML must paint with every other request held.
  for (const width of [1440, 390, 320]) {
    const { context, page } = await fixture({
      viewport: { width, height: 844 },
      reducedMotion: "reduce",
    });
    await page.route("**/*", (route) => {
      if (route.request().resourceType() === "document")
        return route.continue();
      // Intentionally leave JavaScript, CSS, fonts, and API requests pending.
    });
    await page.goto(origin, { waitUntil: "commit" });
    await page
      .getByRole("status")
      .filter({ hasText: "Loading your workspace" })
      .waitFor();
    await page.waitForFunction(
      () => performance.getEntriesByName("first-contentful-paint").length > 0,
    );
    assert.equal(
      await page.locator("#root").evaluate((root) => root.childElementCount),
      0,
    );
    assert.equal(await page.locator('link[rel="stylesheet"]').count(), 0);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    assert.equal(
      await page
        .locator("#startup-screen svg")
        .evaluate((svg) => getComputedStyle(svg).animationName),
      "none",
    );
    await screenshot(page, `before-javascript-${width}`);
    await context.close();
  }
  console.log(
    "PASS: startup paints before JavaScript, CSS, or fonts at desktop and mobile widths; reduced motion works.",
  );

  const delayedRoute = await fixture();
  const appRouteUrl =
    /\/(?:assets\/_app-[^/]+\.js|src\/routes\/_app\.tsx\?tsr-split=)/;
  const releaseRoute = Promise.withResolvers();
  const routeSession = Promise.withResolvers();
  delayedRoute.state.auth = routeSession.promise;
  await delayedRoute.page.addInitScript(() => {
    window.loadingGaps = [];
    let started = false;
    function sampleFrame() {
      const startup = document.getElementById("startup-screen");
      if (startup) {
        started = true;
      }
      if (started) {
        const screen = startup ?? document.getElementById("root");
        const status = screen?.querySelector('[role="status"]');
        if (
          !status?.checkVisibility() ||
          !status.textContent.trim() ||
          !status.querySelector("svg")?.checkVisibility()
        ) {
          window.loadingGaps.push(performance.now());
        }
      }
      window.loadingFrame = requestAnimationFrame(sampleFrame);
    }
    window.loadingFrame = requestAnimationFrame(sampleFrame);
  });
  await delayedRoute.page.route(appRouteUrl, async (route) => {
    await releaseRoute.promise;
    return route.fallback();
  });
  const routeRequested = delayedRoute.page.waitForRequest(appRouteUrl);
  await delayedRoute.page.goto(origin, { waitUntil: "domcontentloaded" });
  await routeRequested;
  // Cross the router's pending delay before releasing the initial route chunk.
  await delayedRoute.page.waitForTimeout(1500);
  assert.equal(delayedRoute.state.privateRequests, 0);
  releaseRoute.resolve();
  await delayedRoute.page
    .locator("#startup-screen")
    .waitFor({ state: "detached" });
  await delayedRoute.page.waitForTimeout(300);
  const gaps = await delayedRoute.page.evaluate(() => {
    cancelAnimationFrame(window.loadingFrame);
    return window.loadingGaps;
  });
  assert.deepEqual(
    gaps,
    [],
    "Every frame must retain the loading message and spinner during the route handoff",
  );
  routeSession.resolve({ status: 200, json: session });
  await delayedRoute.page.getByLabel("Describe an expense").waitFor();
  await delayedRoute.context.close();
  console.log(
    "PASS: delayed route chunks preserve the loading screen through the first route render without a blank frame or spinner flash.",
  );

  const delayed = await fixture();
  const response = Promise.withResolvers();
  delayed.state.auth = response.promise;
  await delayed.page.goto(origin);
  await delayed.page.locator("#startup-screen").waitFor({ state: "detached" });
  await delayed.page
    .getByRole("status")
    .filter({ hasText: "Loading your workspace" })
    .waitFor();
  assert.equal(await delayed.page.locator("#root").getAttribute("inert"), null);
  assert.equal(
    await delayed.page.locator("#root").getAttribute("aria-hidden"),
    null,
  );
  assert.equal(delayed.state.privateRequests, 0);
  await delayed.page
    .getByText("This is taking longer than usual…", { exact: true })
    .waitFor({ timeout: 7000 });
  response.resolve({
    status: 503,
    json: { message: "Temporarily unavailable" },
  });
  await delayed.page
    .getByRole("button", { name: "Try again", exact: true })
    .waitFor();
  delayed.state.auth = { status: 200, json: session };
  await delayed.page
    .getByRole("button", { name: "Try again", exact: true })
    .click();
  const draft = delayed.page.getByLabel("Describe an expense");
  await draft.fill("Unsaved startup test draft");
  delayed.state.auth = {
    status: 503,
    json: { message: "Temporarily unavailable" },
  };
  await delayed.page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  await delayed.page
    .getByRole("button", { name: "Try again", exact: true })
    .waitFor();
  assert.equal(await draft.inputValue(), "Unsaved startup test draft");
  await delayed.context.close();
  console.log(
    "PASS: React handoff, slow sessions, session retry, private-query gating, and draft preservation.",
  );

  for (const path of ["/login", "/missing-startup-test-page"]) {
    const { context, page } = await fixture();
    await page.goto(`${origin}${path}`);
    await page
      .getByRole("heading", {
        name: path === "/login" ? "Sign in" : "Page not found",
        exact: true,
      })
      .waitFor();
    await page.locator("#startup-screen").waitFor({ state: "detached" });
    assert.equal(await page.locator("#root").getAttribute("inert"), null);
    await context.close();
  }
  const signedOut = await fixture();
  signedOut.state.auth = { status: 200, json: null };
  await signedOut.page.goto(`${origin}/expenses`);
  await signedOut.page.waitForURL(`${origin}/login`);
  await signedOut.page
    .getByRole("heading", { name: "Sign in", exact: true })
    .waitFor();
  await signedOut.page
    .locator("#startup-screen")
    .waitFor({ state: "detached" });
  await signedOut.context.close();
  console.log(
    "PASS: direct login, unknown routes, and signed-out redirects dismiss the startup screen.",
  );

  const routeError = await fixture();
  await routeError.page.route("**/*", (route) => {
    if (
      /\/(?:assets\/_app-[^/]+\.js|src\/routes\/_app\.tsx\?tsr-split=)/.test(
        route.request().url(),
      )
    ) {
      return route.abort("failed");
    }
    return route.fallback();
  });
  await routeError.page.goto(origin);
  await routeError.page
    .getByRole("heading", { name: "Unable to load this page", exact: true })
    .waitFor();
  await routeError.page
    .locator("#startup-screen")
    .waitFor({ state: "detached" });
  assert.equal(
    await routeError.page.locator("#root").getAttribute("inert"),
    null,
  );
  await routeError.context.close();
  console.log("PASS: a failed route chunk exposes the router error screen.");

  for (const resource of ["script", "stylesheet"]) {
    const { context, page } = await fixture();
    let failed = false;
    await page.route("**/*", (route) => {
      const request = route.request();
      const isAppScript =
        /\/(?:src\/main\.tsx|assets\/main-[^/]+\.js)(?:\?|$)/.test(
          request.url(),
        );
      const isAppCss =
        request.resourceType() === "stylesheet" ||
        request.url().endsWith("/src/styles.css");
      if (
        (resource === "script" && isAppScript) ||
        (resource === "stylesheet" && isAppCss)
      ) {
        failed = true;
        return route.abort("failed");
      }
      return route.fallback();
    });
    await page.goto(origin);
    const reload = page.getByRole("button", { name: "Reload", exact: true });
    await reload.waitFor();
    assert.equal(failed, true);
    await screenshot(page, `failed-${resource}`);
    await page.unroute("**/*");
    await reload.click();
    await page.getByLabel("Describe an expense").waitFor();
    await page.locator("#startup-screen").waitFor({ state: "detached" });
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS: failed application scripts and stylesheets show a working reload action; no uncaught browser errors.",
  );
} finally {
  await browser.close();
}
