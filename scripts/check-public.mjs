import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import assert from "node:assert/strict";

const base = process.env.PUBLIC_TEST_URL || "http://localhost:3000";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Public smoke check is local-only.");
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await mkdir("test-results/public", { recursive: true });
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/", "/login", "/signup"]) {
      const response = await page.goto(base + path);
      assert.equal(response.status(), 200, path);
      await page.locator("h1").waitFor();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (overflow) {
        console.log(await page.locator("body *").evaluateAll((elements) => elements
          .filter((element) => element.getBoundingClientRect().right > window.innerWidth + 1)
          .slice(0, 10).map((element) => ({ tag: element.tagName, class: element.getAttribute("class"), right: element.getBoundingClientRect().right }))));
      }
      assert.equal(overflow, false, `${path} overflows at ${width}`);
      const missingLabels = await page.locator('input:not([type="hidden"]),select,textarea').evaluateAll((elements) =>
        elements.filter((element) => !element.labels?.length && !element.getAttribute("aria-label")).length);
      assert.equal(missingLabels, 0, `${path} has missing labels`);
      if (path !== "/") {
        assert.equal(await page.getByRole("button", { name: path === "/login" ? "Log in" : "Create your account", exact: true }).isDisabled(), true);
        assert.equal(await page.getByRole("region", { name: "Supabase setup required" }).isVisible(), true);
      }
      if (width === 390 || width === 1440) await page.screenshot({ path: `test-results/public/${path.replaceAll("/", "") || "landing"}-${width}.png`, fullPage: true });
    }
  }
  for (const path of ["/dashboard", "/students", "/students/00000000-0000-4000-8000-000000000001", "/opportunities", "/opportunities/00000000-0000-4000-8000-000000000001", "/opportunities/00000000-0000-4000-8000-000000000001/edit", "/create-opportunity", "/my-opportunities", "/profile"]) {
    await page.goto(base + path);
    assert.equal(new URL(page.url()).pathname, "/login", `${path} must redirect`);
    assert.equal(new URL(page.url()).searchParams.get("next"), path);
  }
  for (const path of ["/auth/callback", "/auth/confirm"]) {
    await page.goto(base + path);
    assert.equal(new URL(page.url()).pathname, "/login");
    assert.equal(await page.getByRole("alert").isVisible(), true);
  }
  await page.goto(base);
  await page.keyboard.press("Tab");
  assert.equal(await page.getByRole("link", { name: "Skip to content" }).evaluate((element) => element === document.activeElement), true);
  await page.keyboard.press("Enter");
  assert.equal(new URL(page.url()).hash, "#main-content");
  const missing = await page.goto(base + "/does-not-exist");
  assert.equal(missing.status(), 404);
  assert.deepEqual(errors, [], "Browser runtime errors");
  console.log("PASS: public landing/login/signup at 360/390/768/1024/1440px; no overflow; form labels; explicit setup state; nine protected redirects; invalid auth links; keyboard skip link; 404; no browser runtime errors.");
  console.log("Screenshots saved under test-results/public. Live backend not exercised.");
} finally {
  await browser.close();
}
