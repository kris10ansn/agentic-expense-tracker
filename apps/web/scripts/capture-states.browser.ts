import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import type { CaptureEvent } from "@ai-expenses/api";
import { chromium, type Response, type Route } from "playwright";
import superjson from "superjson";
import { z } from "zod";
import type { Capture } from "../src/features/capture/useCaptureProgress";

const origin = process.env.WEB_URL ?? "http://127.0.0.1:4173";
const screenshots = process.env.SCREENSHOT_DIR;
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {}),
});
const session = {
  user: {
    id: "capture-test",
    name: "Capture test",
    email: "capture@example.com",
    emailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  session: {
    id: "capture-session",
    userId: "capture-test",
    token: "browser-test-only",
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};
const capture = {
  id: "00000000-0000-4000-8000-000000000001",
  description: "Capture state fixture",
  status: "extracting",
  fileNames: [],
  failures: null,
  errorMessage: null,
  dismissedAt: null,
} satisfies Capture;
const outcomes = {
  failed: {
    capture: { status: "failed", errorMessage: "AI unavailable" },
  },
  review: {
    capture: {
      status: "complete",
      failures: [
        {
          partialExpense: { title: "Coffee" },
          sourceText: "Coffee, amount not written on receipt",
          reason: "Missing amount",
          suggestions: [],
        },
      ],
    },
    createdExpenses: [],
  },
  complete: {
    capture: { status: "complete", failures: [] },
    createdExpenses: [],
  },
} satisfies Record<string, CaptureEvent>;

try {
  if (screenshots) {
    await mkdir(screenshots, { recursive: true });
  }
  for (const scenario of [
    "failed",
    "review",
    "disconnected",
    "reconnecting",
    "error",
    "complete",
    "unauthorized",
  ]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let finished = false;
    let signedOut = false;
    let activeReads = 0;
    let watchRequests = 0;
    const testTransition = scenario === "failed" || scenario === "review";
    let accepted = !testTransition;
    let currentCapture: Capture = capture;
    let dismissed = false;
    let dismissalAttempts = 0;
    let failRefresh = false;
    const failedRefreshSeen = Promise.withResolvers<void>();
    const allowFailedDismissal = Promise.withResolvers<void>();
    const allowDismissal = Promise.withResolvers<void>();
    const acceptUpload = Promise.withResolvers<void>();
    const sendOutcome = Promise.withResolvers<void>();
    const watchStarted = Promise.withResolvers<void>();
    await page.route("**/api/auth/get-session**", (route) =>
      route.fulfill({ json: signedOut ? null : session }),
    );
    const handleRpc = async (route: Route) => {
      const url = new URL(route.request().url());
      if (url.pathname === "/trpc/captures.start") {
        const requestBody = route.request().postDataBuffer();
        assert.ok(requestBody, "Capture submission requires a multipart body");
        const form = await new Request(route.request().url(), {
          method: "POST",
          headers: route.request().headers(),
          body: new Uint8Array(requestBody),
        }).formData();
        const id = form.get("id");
        if (typeof id !== "string") {
          throw new Error("Missing capture ID");
        }
        currentCapture = {
          ...capture,
          id,
          fileNames: form
            .getAll("files")
            .filter((file) => file instanceof File)
            .map((file) => file.name),
        };
        await acceptUpload.promise;
        accepted = true;
        return route.fulfill({
          json: { result: { data: superjson.serialize(currentCapture) } },
        });
      }
      if (url.pathname === "/trpc/captures.watch") {
        watchRequests++;
        watchStarted.resolve();
        if (testTransition) {
          await sendOutcome.promise;
        }
        if (scenario === "reconnecting") {
          return route.abort("failed");
        }
        let body = "event: connected\ndata: {}\n\n";
        if (scenario === "unauthorized" || scenario === "error") {
          signedOut = scenario === "unauthorized";
          body += `event: serialized-error\ndata: ${superjson.stringify({
            code: signedOut ? -32001 : -32600,
            message: signedOut
              ? "Sign in required"
              : "Subscription unavailable",
            data: {
              code: signedOut ? "UNAUTHORIZED" : "BAD_REQUEST",
              httpStatus: signedOut ? 401 : 400,
            },
          })}\n\n`;
        } else {
          body += `data: ${superjson.stringify({ capture: { status: "extracting" } })}\n\n`;
          if (
            scenario === "failed" ||
            scenario === "review" ||
            scenario === "complete"
          ) {
            finished = true;
            currentCapture = {
              ...currentCapture,
              ...outcomes[scenario].capture,
            };
            body += `data: ${superjson.stringify(outcomes[scenario])}\n\n`;
          }
          body += "event: return\ndata: \n\n";
        }
        return route.fulfill({ contentType: "text/event-stream", body });
      }
      const results = await Promise.all(
        url.pathname
          .slice("/trpc/".length)
          .split(",")
          .map(async (name) => {
            if (name === "captures.dismiss") {
              dismissalAttempts++;
              if (dismissalAttempts === 1) {
                await allowFailedDismissal.promise;
                currentCapture = {
                  ...currentCapture,
                  fileNames: ["refetched-receipt.png"],
                };
                return {
                  error: superjson.serialize({
                    code: -32603,
                    message: "Dismissal unavailable",
                    data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500 },
                  }),
                };
              }
              await allowDismissal.promise;
              dismissed = true;
              currentCapture = { ...currentCapture, dismissedAt: new Date() };
              return {
                result: {
                  data: superjson.serialize({ id: currentCapture.id }),
                },
              };
            }
            if (name === "captures.listVisible") {
              activeReads++;
              if (failRefresh) {
                failedRefreshSeen.resolve();
                return {
                  error: superjson.serialize({
                    code: -32603,
                    message: "Capture list unavailable",
                    data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500 },
                  }),
                };
              }
              return {
                result: {
                  data: superjson.serialize(
                    accepted &&
                      !dismissed &&
                      !(finished && scenario === "complete")
                      ? [currentCapture]
                      : [],
                  ),
                },
              };
            }
            if (name === "collections.list") {
              return {
                result: {
                  data: superjson.serialize([
                    {
                      id: "00000000-0000-4000-8000-000000000002",
                      title: "Meals",
                      color: "#458a72",
                    },
                  ]),
                },
              };
            }
            return { result: { data: superjson.serialize([]) } };
          }),
      );
      return route.fulfill({ json: results });
    };
    await page.route("**/trpc/**", handleRpc);

    const watchResponse =
      scenario === "complete"
        ? page.waitForResponse((response) =>
            response.url().includes("/trpc/captures.watch"),
          )
        : undefined;
    let activeRefetch: Promise<Response> | undefined;
    await page.goto(origin);
    const captureCard = page
      .getByRole("status")
      .filter({ hasText: capture.description });
    if (testTransition) {
      await page.getByLabel("Describe an expense").fill(capture.description);
      await page
        .getByRole("button", { name: "Choose from gallery" })
        .locator("input")
        .setInputFiles({
          name: "receipt.png",
          mimeType: "image/png",
          buffer: Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
            "base64",
          ),
        });
      await page.getByRole("button", { name: "Add described expense" }).click();
      await captureCard.getByText("Sending data...", { exact: true }).waitFor();
      await captureCard.evaluate((element) =>
        element.setAttribute("data-original-card", "true"),
      );
      await captureCard
        .getByRole("img", { name: "receipt.png" })
        .evaluate((element) =>
          element.setAttribute("data-original-preview", "true"),
        );
      const previewUrl = await captureCard.getByRole("img").getAttribute("src");
      assert.ok(previewUrl?.startsWith("blob:"));
      await captureCard.evaluate(
        (element, url) => element.setAttribute("data-original-url", url ?? ""),
        previewUrl,
      );
      acceptUpload.resolve();
      await watchStarted.promise;
      await captureCard
        .getByText("Connecting to progress updates...", { exact: true })
        .waitFor();
      assert.equal(
        await captureCard.getAttribute("data-original-card"),
        "true",
        "Upload acceptance must preserve the card",
      );
      activeRefetch = page.waitForResponse(
        (response) =>
          response.url().includes("captures.listVisible") && finished,
      );
      sendOutcome.resolve();
    }
    if (scenario === "unauthorized") {
      await page.waitForURL(`${origin}/login`);
    } else if (scenario === "complete") {
      await watchResponse;
      await page.getByText(capture.description, { exact: true }).waitFor({
        state: "detached",
      });
      await page.waitForFunction(
        () => !document.querySelector("#startup-screen"),
      );
      assert.equal(finished, true);
    } else {
      const titles = {
        failed: "Capture failed",
        review: "Capture complete · Review needed",
      };
      const title =
        scenario === "failed" || scenario === "review"
          ? titles[scenario]
          : "Status unavailable";
      const card = page.getByRole("status").filter({ hasText: title });
      await card.waitFor();
      assert.equal(
        await card
          .locator(".animate-spin, .motion-safe\\:animate-spin")
          .count(),
        0,
      );
      assert.equal(await card.getByText("Not saved yet").count(), 0);
      assert.equal(await card.getByText("Sending data...").count(), 0);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      if (scenario === "failed" || scenario === "review") {
        if (scenario === "review") {
          const details = card.getByRole("list", {
            name: "Items needing review",
            includeHidden: true,
          });
          const reviewButton = card.getByRole("button", {
            name: "Review 1 item",
          });
          await card.getByText("1 item not saved", { exact: true }).waitFor();
          assert.equal(await details.isVisible(), false);
          assert.equal(
            await reviewButton.getAttribute("aria-expanded"),
            "false",
          );
          assert.equal(
            await reviewButton.getAttribute("aria-controls"),
            await details.getAttribute("id"),
          );
          if (screenshots) {
            await page.screenshot({
              path: `${screenshots}/review-collapsed.png`,
            });
          }
          await reviewButton.press("Enter");
          await details.waitFor();
          const hideButton = card.getByRole("button", { name: "Hide details" });
          assert.equal(await hideButton.getAttribute("aria-expanded"), "true");
          await details.getByText("Coffee", { exact: true }).waitFor();
          await details
            .getByText("Coffee, amount not written on receipt", { exact: true })
            .waitFor();
          await hideButton.click();
          await details.waitFor({ state: "hidden" });
          await reviewButton.click();
          await details.waitFor();
        }
        await card
          .getByText(
            scenario === "failed" ? "AI unavailable" : "Missing amount",
            { exact: true },
          )
          .waitFor();
        const response = await activeRefetch;
        await response?.finished();
        await card.waitFor();
        assert.equal(
          await card.getAttribute("data-original-card"),
          "true",
          "Terminal state must preserve the card DOM node",
        );
        assert.equal(
          await card.getByRole("img").getAttribute("data-original-preview"),
          "true",
          "Terminal state must preserve the image DOM node",
        );
        assert.equal(
          await card.getByRole("img").getAttribute("src"),
          await card.getAttribute("data-original-url"),
          "Terminal state must retain the preview URL",
        );
        assert.equal(
          watchRequests,
          1,
          "Terminal notices must not restart the subscription",
        );
        assert.ok(
          activeReads >= 2,
          "Terminal notice must survive a visible-list refetch",
        );
        if (screenshots) {
          await page.screenshot({ path: `${screenshots}/${scenario}.png` });
          await page.setViewportSize({ width: 1280, height: 900 });
          await page.screenshot({
            path: `${screenshots}/${scenario}-desktop.png`,
          });
        }
        await page.reload();
        await card.waitFor();
        await card.getByText("receipt.png", { exact: true }).waitFor();
        assert.equal(await card.getByRole("img").count(), 0);
        assert.equal(
          watchRequests,
          1,
          "Persisted notices must not open a subscription after reload",
        );

        const freshContext = await browser.newContext();
        try {
          const freshPage = await freshContext.newPage();
          freshPage.setDefaultTimeout(5000);
          freshPage.on("pageerror", (error) => errors.push(error.message));
          await freshPage.route("**/api/auth/get-session**", (route) =>
            route.fulfill({ json: session }),
          );
          await freshPage.route("**/trpc/**", handleRpc);
          await freshPage.goto(origin);
          const freshCard = freshPage
            .getByRole("status")
            .filter({ hasText: title });
          await freshCard.waitFor();
          await freshCard.getByText("receipt.png", { exact: true }).waitFor();
          if (scenario === "review") {
            await freshCard
              .getByRole("button", { name: "Review 1 item" })
              .click();
          }
          await freshCard
            .getByText(
              scenario === "failed" ? "AI unavailable" : "Missing amount",
              { exact: true },
            )
            .waitFor();
          await freshCard
            .getByRole("button", { name: "Dismiss", exact: true })
            .click();
          await freshCard.waitFor({ state: "detached" });
          assert.equal(
            dismissed,
            false,
            "Dismissal must hide the card before the server replies",
          );
          failRefresh = scenario === "failed";
          if (scenario === "review") {
            await freshPage
              .getByRole("navigation", { name: "Desktop navigation" })
              .getByRole("link", { name: "Expenses", exact: true })
              .click();
            await freshPage.waitForURL(`${origin}/expenses`);
          }
          allowFailedDismissal.resolve();
          const notifications = freshPage.getByRole("region", {
            name: /Notifications/,
          });
          const dismissalToast = notifications.getByText(
            "Unable to dismiss a capture. Please try again.",
            { exact: true },
          );
          await dismissalToast.waitFor();
          assert.equal(
            await freshCard
              .getByText("Unable to dismiss a capture. Please try again.")
              .count(),
            0,
          );
          if (failRefresh) {
            await failedRefreshSeen.promise;
            assert.equal(
              await freshCard.count(),
              0,
              "A failed refetch must leave the error visible without restoring a cached snapshot",
            );
            failRefresh = false;
          }
          if (scenario === "review") {
            await freshPage
              .getByRole("navigation", { name: "Desktop navigation" })
              .getByRole("link", { name: "Home", exact: true })
              .click();
            await freshPage.waitForURL(`${origin}/`);
          }
          await freshCard.waitFor();
          await freshCard
            .getByText("refetched-receipt.png", { exact: true })
            .waitFor();
          assert.equal(dismissed, false);
          await notifications
            .getByRole("button", { name: "Close toast", exact: true })
            .click();
          await dismissalToast.waitFor({ state: "detached" });
          await freshCard
            .getByRole("button", { name: "Dismiss", exact: true })
            .click();
          await freshCard.waitFor({ state: "detached" });
          assert.equal(
            dismissed,
            false,
            "Retry must also hide the card optimistically",
          );
          const reconciled = freshPage.waitForResponse((response) =>
            response.url().includes("captures.listVisible"),
          );
          allowDismissal.resolve();
          await (await reconciled).finished();
          assert.equal(await freshCard.count(), 0);
          assert.equal(dismissalAttempts, 2);
          await freshPage.reload();
          await freshPage
            .getByText("Your expenses will appear here.", { exact: true })
            .waitFor();
          assert.equal(await freshCard.count(), 0);
          await page.reload();
          await page
            .getByText("Your expenses will appear here.", { exact: true })
            .waitFor();
          assert.equal(
            await card.count(),
            0,
            "Dismissal must persist across sessions",
          );
        } finally {
          await freshContext.close();
        }
      } else if (screenshots) {
        await page.screenshot({ path: `${screenshots}/${scenario}.png` });
      }
    }
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS: ${scenario}`);
  }

  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    try {
      const page = await context.newPage();
      page.setDefaultTimeout(5000);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") {
          errors.push(message.text());
        }
      });
      const failures = [
        {
          partialExpense: { title: "Lunch" },
          sourceText: "Lunch 120 / Lunch 150",
          sourceImageIds: ["image-2", "image-3"],
          reason: "Conflicting totals",
          suggestions: [],
        },
        {
          partialExpense: { title: "Tea" },
          sourceText: "",
          sourceImageIds: ["image-2"],
          reason: "Missing amount",
          suggestions: [],
        },
        {
          partialExpense: { title: "Dinner" },
          sourceText: "Dinner",
          sourceImageIds: [],
          reason: "Missing amount in description",
          suggestions: [],
        },
        {
          partialExpense: { title: "Older capture failure" },
          sourceText: "Coffee",
          reason: "Missing amount",
          suggestions: [],
        },
      ];
      let currentCapture: Capture | undefined;
      await page.route("**/api/auth/get-session**", (route) =>
        route.fulfill({ json: session }),
      );
      await page.route("**/trpc/**", async (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path === "/trpc/captures.start") {
          const body = route.request().postDataBuffer();
          assert.ok(body);
          const form = await new Request(route.request().url(), {
            method: "POST",
            headers: route.request().headers(),
            body: new Uint8Array(body),
          }).formData();
          const id = z.uuid().parse(form.get("id"));
          currentCapture = {
            ...capture,
            id,
            description: "Image source fixture",
            fileNames: form
              .getAll("files")
              .filter((file) => file instanceof File)
              .map((file) => file.name),
          };
          return route.fulfill({
            json: { result: { data: superjson.serialize(currentCapture) } },
          });
        }
        if (path === "/trpc/captures.watch") {
          assert.ok(currentCapture);
          currentCapture = { ...currentCapture, status: "complete", failures };
          const event = {
            capture: { status: "complete", failures },
            createdExpenses: [],
          } satisfies CaptureEvent;
          return route.fulfill({
            contentType: "text/event-stream",
            body: `event: connected\ndata: {}\n\ndata: ${superjson.stringify(event)}\n\nevent: return\ndata: \n\n`,
          });
        }
        const results = path
          .slice("/trpc/".length)
          .split(",")
          .map((name) => {
            if (name === "captures.listVisible") {
              return {
                result: {
                  data: superjson.serialize(
                    currentCapture ? [currentCapture] : [],
                  ),
                },
              };
            }
            if (name === "collections.list") {
              return {
                result: {
                  data: superjson.serialize([
                    {
                      id: "00000000-0000-4000-8000-000000000002",
                      title: "Meals",
                      color: "#458a72",
                    },
                  ]),
                },
              };
            }
            return { result: { data: superjson.serialize([]) } };
          });
        return route.fulfill({ json: results });
      });
      await page.goto(origin);
      await page.getByLabel("Describe an expense").fill("Image source fixture");
      await page
        .getByRole("button", { name: "Choose from gallery" })
        .locator("input")
        .setInputFiles(
          ["receipt.png", "receipt.png", "second-total.png"].map((name) => ({
            name,
            mimeType: "image/png",
            buffer: Buffer.from(
              "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
              "base64",
            ),
          })),
        );
      await page.getByRole("button", { name: "Add described expense" }).click();
      const card = page
        .getByRole("status")
        .filter({ hasText: "Image source fixture" });
      for (const reloaded of [false, true]) {
        if (reloaded) {
          await page.reload();
        }
        await card.getByRole("button", { name: "Review 4 items" }).click();
        const details = card.getByRole("list", {
          name: "Items needing review",
        });
        const lunch = details
          .locator(":scope > li")
          .filter({ hasText: "Conflicting totals" });
        const sources = lunch.getByRole("list", { name: "Source images" });
        assert.deepEqual(
          await sources.getByRole("listitem").allTextContents(),
          ["receipt.pngImage 2", "second-total.pngImage 3"],
        );
        assert.equal(await sources.getByRole("img").count(), reloaded ? 0 : 2);
        await lunch
          .getByText("Lunch 120 / Lunch 150", { exact: true })
          .waitFor();
        const tea = details
          .locator(":scope > li")
          .filter({ has: page.getByText("Tea", { exact: true }) });
        assert.deepEqual(
          await tea
            .getByRole("list", { name: "Source images" })
            .getByRole("listitem")
            .allTextContents(),
          ["receipt.pngImage 2"],
        );
        assert.equal(await tea.locator("blockquote").count(), 0);
        for (const title of ["Dinner", "Older capture failure"]) {
          const item = details
            .locator(":scope > li")
            .filter({ has: page.getByText(title, { exact: true }) });
          assert.equal(
            await item.getByRole("list", { name: "Source images" }).count(),
            0,
          );
          assert.equal(await item.locator("blockquote").count(), 1);
        }
        if (!reloaded) {
          assert.equal(
            await sources
              .getByRole("img")
              .evaluateAll((images) =>
                images.every(
                  (image) =>
                    image instanceof HTMLImageElement &&
                    image.complete &&
                    image.naturalWidth > 0,
                ),
              ),
            true,
          );
        }
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
        if (screenshots) {
          await page.screenshot({
            path: `${screenshots}/image-sources${reloaded ? "-reloaded" : ""}.png`,
          });
        }
      }
      assert.deepEqual(errors, []);
      console.log(
        "PASS: image references, duplicate filenames, and legacy failures across reload",
      );
    } finally {
      await context.close();
    }
  }

  for (const order of ["failure-first", "success-first", "together"]) {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      page.setDefaultTimeout(5000);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const first: Capture = {
        ...capture,
        status: "failed",
        errorMessage: "AI unavailable",
      };
      const second = {
        ...first,
        id: "00000000-0000-4000-8000-000000000003",
        description: "Second capture",
      };
      let stored = [first, second];
      let reads = 0;
      const failFirst = Promise.withResolvers<void>();
      const finishSecond = Promise.withResolvers<void>();
      await page.route("**/api/auth/get-session**", (route) =>
        route.fulfill({ json: session }),
      );
      await page.route("**/trpc/**", async (route) => {
        const names = new URL(route.request().url()).pathname
          .slice("/trpc/".length)
          .split(",");
        const results = await Promise.all(
          names.map(async (name, index) => {
            if (name === "captures.listVisible") {
              reads++;
              return { result: { data: superjson.serialize(stored) } };
            }
            if (name === "captures.dismiss") {
              const inputs = z
                .record(z.string(), z.object({ json: z.string() }))
                .parse(route.request().postDataJSON());
              const id = inputs[String(index)]?.json;
              if (id === first.id) {
                await failFirst.promise;
                return {
                  error: superjson.serialize({
                    code: -32603,
                    message: "Dismissal unavailable",
                    data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500 },
                  }),
                };
              }
              assert.equal(id, second.id);
              await finishSecond.promise;
              stored = [first];
              return { result: { data: superjson.serialize({ id }) } };
            }
            return { result: { data: superjson.serialize([]) } };
          }),
        );
        await route.fulfill({ json: results });
      });
      await page.goto(origin);
      const firstCard = page
        .getByRole("status")
        .filter({ hasText: first.description });
      const secondCard = page
        .getByRole("status")
        .filter({ hasText: second.description });
      await firstCard.waitFor();
      await secondCard.waitFor();
      const readsBefore = reads;
      await firstCard
        .getByRole("button", { name: "Dismiss", exact: true })
        .click();
      await firstCard.waitFor({ state: "detached" });
      await secondCard
        .getByRole("button", { name: "Dismiss", exact: true })
        .click();
      await secondCard.waitFor({ state: "detached" });
      if (order === "failure-first") {
        failFirst.resolve();
        await page
          .getByRole("region", { name: /Notifications/ })
          .getByText("Unable to dismiss a capture. Please try again.")
          .waitFor();
        await firstCard.waitFor();
        assert.ok(
          reads > readsBefore,
          "A failed dismissal must refetch the list",
        );
      }
      if (order === "success-first") {
        const refreshed = page.waitForResponse((response) =>
          response.url().includes("captures.listVisible"),
        );
        finishSecond.resolve();
        await (await refreshed).finished();
        assert.equal(await secondCard.count(), 0);
      }
      const reconciled = page.waitForResponse((response) =>
        response.url().includes("captures.listVisible"),
      );
      failFirst.resolve();
      finishSecond.resolve();
      await (await reconciled).finished();
      await firstCard.waitFor();
      await page
        .getByRole("region", { name: /Notifications/ })
        .getByText("Unable to dismiss a capture. Please try again.")
        .waitFor();
      assert.equal(await secondCard.count(), 0);
      assert.ok(
        reads > readsBefore,
        "Settled dismissals must refresh server state",
      );
      assert.deepEqual(errors, []);
      console.log(`PASS: concurrent dismissals ${order}`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
