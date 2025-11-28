import { test, expect } from "@playwright/test";

test("homepage renders call to action", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /quản trị bài kiểm tra/i })).toBeVisible();
  await expect(page.getByRole("link", { name: "Đăng nhập" })).toBeVisible();
});

