import { describe, expect, test } from "bun:test";
import { testAuthConfig } from "./auth/test-context";
import { authConfigSchema, configSchema } from "./config";

const databaseUrl = "postgresql://user:password@localhost:5432/expenses";
const validConfig = {
  ...testAuthConfig,
  DATABASE_URL: databaseUrl,
  GOOGLE_GENERATIVE_AI_API_KEY: "test-api-key",
};

describe("API configuration", () => {
  test("normalizes the email allowlist", () => {
    expect(
      authConfigSchema.parse({
        ...testAuthConfig,
        AUTH_ALLOWED_EMAILS: " Alice@Example.com , bob@example.com ",
      }).AUTH_ALLOWED_EMAILS,
    ).toEqual(["alice@example.com", "bob@example.com"]);
  });

  test.each(["", "not-an-email", "alice@example.com,"])(
    "rejects invalid allowlist %s",
    (emails) => {
      expect(() =>
        authConfigSchema.parse({
          ...testAuthConfig,
          AUTH_ALLOWED_EMAILS: emails,
        }),
      ).toThrow("AUTH_ALLOWED_EMAILS");
    },
  );

  test("requires a strong auth secret and an HTTP origin", () => {
    expect(() =>
      authConfigSchema.parse({
        ...testAuthConfig,
        BETTER_AUTH_SECRET: "short",
      }),
    ).toThrow("BETTER_AUTH_SECRET");
    expect(() =>
      authConfigSchema.parse({
        ...testAuthConfig,
        BETTER_AUTH_URL: "ftp://localhost",
      }),
    ).toThrow("BETTER_AUTH_URL");
  });

  test("uses the default API port", () => {
    expect(configSchema.parse(validConfig)).toEqual({
      ...validConfig,
      AUTH_ALLOWED_EMAILS: ["test@example.com"],
      API_PORT: 3001,
    });
  });

  test("accepts an explicit API port", () => {
    expect(
      configSchema.parse({ ...validConfig, API_PORT: "4000" }).API_PORT,
    ).toBe(4000);
  });

  test("requires a database URL", () => {
    expect(() => configSchema.parse({})).toThrow("DATABASE_URL");
  });

  test.each(["not-a-url", "https://localhost/database", "sqlite://database"])(
    "rejects invalid database URL %s",
    (url) => {
      expect(() =>
        configSchema.parse({ ...validConfig, DATABASE_URL: url }),
      ).toThrow("DATABASE_URL");
    },
  );

  test.each(["", "0", "-1", "65536", "3001.5", "invalid"])(
    "rejects invalid port %s",
    (port) => {
      expect(() =>
        configSchema.parse({ ...validConfig, API_PORT: port }),
      ).toThrow("API_PORT");
    },
  );
});
