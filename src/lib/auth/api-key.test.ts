// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";

import { checkApiKey, isValidApiKey, MIN_API_KEY_LENGTH } from "./api-key";

const ENV = "TEST_READ_API_KEY";
const KEY = "a".repeat(64);

function req(headers: Record<string, string> = {}) {
  return new Request("https://portal.test/api/external/reports", { headers });
}

afterEach(() => {
  delete process.env[ENV];
});

describe("isValidApiKey", () => {
  it("acepta la clave exacta", () => {
    expect(isValidApiKey(KEY, KEY)).toBe(true);
  });

  it("rechaza una clave distinta, más corta o vacía", () => {
    expect(isValidApiKey("b".repeat(64), KEY)).toBe(false);
    expect(isValidApiKey(KEY.slice(0, 10), KEY)).toBe(false);
    expect(isValidApiKey("", KEY)).toBe(false);
    expect(isValidApiKey(KEY, "")).toBe(false);
  });
});

describe("checkApiKey", () => {
  it("503 si la env var no está configurada", async () => {
    const res = checkApiKey(req({ "x-api-key": KEY }), ENV);
    expect(res?.status).toBe(503);
  });

  it("503 si la clave configurada es demasiado corta", () => {
    process.env[ENV] = "x".repeat(MIN_API_KEY_LENGTH - 1);
    const res = checkApiKey(req({ "x-api-key": process.env[ENV] }), ENV);
    expect(res?.status).toBe(503);
  });

  it("401 si falta la cabecera", () => {
    process.env[ENV] = KEY;
    expect(checkApiKey(req(), ENV)?.status).toBe(401);
  });

  it("403 si la clave no coincide", () => {
    process.env[ENV] = KEY;
    expect(checkApiKey(req({ "x-api-key": "b".repeat(64) }), ENV)?.status).toBe(403);
  });

  it("null (pasa) con la clave correcta", () => {
    process.env[ENV] = KEY;
    expect(checkApiKey(req({ "x-api-key": KEY }), ENV)).toBeNull();
  });

  it("las respuestas de error no se cachean", () => {
    const res = checkApiKey(req(), ENV);
    expect(res?.headers.get("cache-control")).toBe("private, no-store");
  });
});
