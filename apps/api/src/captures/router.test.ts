import {
  afterAll,
  afterEach,
  describe,
  expect,
  mock,
  spyOn,
  test,
} from "bun:test";
import { createDatabase } from "../db";
import { appRouter } from "../router";

const db = createDatabase("postgresql://test:test@localhost:1/expenses");
const caller = appRouter.createCaller({ db });

function expenseForm(description = "", files: File[] = []) {
  const form = new FormData();
  form.set("id", "00000000-0000-4000-8000-000000000001");
  form.set("collectionId", "00000000-0000-4000-8000-000000000002");
  form.set("description", description);
  for (const file of files) form.append("files", file);
  return form;
}

const image = new File(["image"], "receipt.png", { type: "image/png" });

afterEach(() => mock.restore());
afterAll(async () => {
  await db.$client.close();
});

describe("captures.start", () => {
  test.each([
    ["empty form", () => new FormData()],
    ["no text or images", () => expenseForm()],
    ["whitespace", () => expenseForm(" \n ")],
    [
      "empty file",
      () =>
        expenseForm("Coffee", [
          new File([], "empty.png", { type: "image/png" }),
        ]),
    ],
    [
      "unsupported file type",
      () =>
        expenseForm("Coffee", [
          new File(["text"], "receipt.txt", { type: "text/plain" }),
        ]),
    ],
    [
      "file over 5 MiB",
      () =>
        expenseForm("Coffee", [
          new File([new Uint8Array(5 * 1024 * 1024 + 1)], "receipt.png", {
            type: "image/png",
          }),
        ]),
    ],
    [
      "more than five files",
      () =>
        expenseForm(
          "Coffee",
          Array.from({ length: 6 }, () => image),
        ),
    ],
    [
      "text in the files field",
      () => {
        const form = expenseForm("Coffee");
        form.append("files", "receipt.png");
        return form;
      },
    ],
    [
      "file in the description field",
      () => {
        const form = expenseForm();
        form.set("description", image);
        return form;
      },
    ],
  ])(
    "rejects %s before accessing the database or calling Gemini",
    async (_, createForm) => {
      const insert = spyOn(db, "insert");
      const googleFetch = spyOn(globalThis, "fetch").mockRejectedValue(
        new Error("Unexpected Gemini request"),
      );
      await expect(caller.captures.start(createForm())).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
      expect(insert).not.toHaveBeenCalled();
      expect(googleFetch).not.toHaveBeenCalled();
    },
  );

  test.each([
    ["id", null],
    ["id", "invalid"],
    ["collectionId", null],
    ["collectionId", "invalid"],
  ])(
    "rejects %s set to %s before accessing the database",
    async (field, value) => {
      const form = expenseForm("Coffee");
      if (value === null) form.delete(field);
      else form.set(field, value);
      const insert = spyOn(db, "insert");
      await expect(caller.captures.start(form)).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
      expect(insert).not.toHaveBeenCalled();
    },
  );
});
