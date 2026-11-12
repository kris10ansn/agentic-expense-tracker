import { describe, expect, test } from "bun:test";
import { configSchema } from "./config";

const databaseUrl = "postgresql://user:password@localhost:5432/expenses";
const validConfig = {
  DATABASE_URL: databaseUrl,
  GOOGLE_GENERATIVE_AI_API_KEY: "test-api-key",
};

describe("API configuration", () => {
  test("uses the default API port", () => {
    expect(configSchema.parse(validConfig)).toEqual({
      ...validConfig,
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
