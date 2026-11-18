import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import type { CaptureEvent } from "@ai-expenses/api";
import { chromium } from "playwright";
import superjson from "superjson";

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
};
const outcomes = {
  failed: {
    capture: { status: "failed" },
    errorMessage: "AI unavailable",
  },
  review: {
    capture: {
      status: "complete",
      failures: [
        {
          partialExpense: { title: "Coffee" },
          sourceText: "Coffee",
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
    await page.route("**/api/auth/get-session**", (route) =>
      route.fulfill({ json: signedOut ? null : session }),
    );
    await page.route("**/trpc/**", (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === "/trpc/captures.watch") {
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
            body += `data: ${superjson.stringify(outcomes[scenario])}\n\n`;
          }
          body += "event: return\ndata: \n\n";
        }
        return route.fulfill({ contentType: "text/event-stream", body });
      }
      const results = url.pathname
        .slice("/trpc/".length)
        .split(",")
        .map((name) => {
          if (name === "captures.listActive") {
            activeReads++;
            return {
              result: { data: superjson.serialize(finished ? [] : [capture]) },
            };
          }
          return { result: { data: superjson.serialize([]) } };
        });
      return route.fulfill({ json: results });
    });

    const watchResponse =
      scenario === "complete"
        ? page.waitForResponse((response) =>
            response.url().includes("/trpc/captures.watch"),
          )
        : undefined;
    const activeRefetch =
      scenario === "failed" || scenario === "review"
        ? page.waitForResponse(
            (response) =>
              response.url().includes("captures.listActive") && activeReads > 1,
          )
        : undefined;
    await page.goto(origin);
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
        review: "Needs review",
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
        await card
          .getByText(
            scenario === "failed" ? "AI unavailable" : "Missing amount",
            { exact: true },
          )
          .waitFor();
        const response = await activeRefetch;
        await response?.finished();
        await card.waitFor();
        assert.ok(
          activeReads >= 2,
          "Terminal notice must survive an empty active-list response",
        );
        if (screenshots) {
          await page.screenshot({ path: `${screenshots}/${scenario}.png` });
        }
        await card.getByRole("button", { name: "Dismiss" }).click();
        await card.waitFor({ state: "detached" });
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
