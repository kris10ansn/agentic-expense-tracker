import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import type { CaptureEvent } from "@ai-expenses/api";
import { chromium, type Response, type Route } from "playwright";
import superjson from "superjson";
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
          await freshCard
            .getByRole("alert")
            .getByText("Unable to dismiss this capture. Please try again.")
            .waitFor();
          assert.equal(dismissed, false);
          await freshCard
            .getByRole("button", { name: "Dismiss", exact: true })
            .click();
          const dismissing = freshCard.getByRole("button", {
            name: "Dismissing...",
            exact: true,
          });
          await dismissing.waitFor();
          assert.equal(await dismissing.isDisabled(), true);
          allowDismissal.resolve();
          await freshCard.waitFor({ state: "detached" });
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
} finally {
  await browser.close();
}
