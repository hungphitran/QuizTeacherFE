import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiFetch, ApiError } from "@/lib/api";

const originalFetch = global.fetch;

describe("apiFetch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls fetch with base URL and parses JSON", async () => {
    const mockResponse = { data: "ok" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve(mockResponse),
    });

    const data = await apiFetch("/quizzes");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/quizzes"),
      expect.objectContaining({ method: "GET" }),
    );
    expect(data).toEqual(mockResponse);
  });

  it("throws ApiError when response not ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve({ message: "Unauthorized" }),
    });

    await expect(apiFetch("/quizzes")).rejects.toBeInstanceOf(ApiError);
  });
});

global.fetch = originalFetch;

