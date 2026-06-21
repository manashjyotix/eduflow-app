import { test, expect } from "@playwright/test";

/**
 * E2E: Teacher accept proxy flow
 *
 * Validates Requirements: 13.4
 *
 * Flow:
 *  1. Log in as teacher (Priya Sharma) via the login form
 *  2. Navigate to /teacher/dashboard (should redirect there after login)
 *  3. Assert the pending proxy request card is visible
 *  4. Click "Accept"
 *  5. Assert the proxy request card disappears and the "Proxy accepted!" confirmation appears
 */

test.setTimeout(60_000);

test.describe("Teacher proxy accept flow", () => {
  test("teacher can accept a pending proxy request", async ({ page }) => {
    // ── Step 1: Navigate to the login page ───────────────────────────────────
    await page.goto("/login");

    // Wait for the login form to be ready
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

    // ── Step 2: Fill in teacher credentials ──────────────────────────────────
    await page.getByLabel("Email address").fill("priya@hcea.edu");
    await page.getByLabel("Password").fill("teacher123");

    // Submit the form
    await page.getByRole("button", { name: /sign in/i }).click();

    // ── Step 3: Wait for post-login redirect to teacher dashboard ────────────
    // The auth context redirects teachers to /teacher/dashboard
    await page.waitForURL("**/teacher/dashboard", { timeout: 15_000 });
    await expect(page).toHaveURL(/\/teacher\/dashboard/);

    // ── Step 4: Assert the proxy request card is visible ─────────────────────
    // The card renders when there are pending proxy requests.
    // It contains the text "Proxy Request" and the subject/class/period details.
    const proxyCard = page.locator('[class*="border-warning"]').filter({
      hasText: "Proxy Request",
    });
    await expect(proxyCard).toBeVisible({ timeout: 10_000 });

    // Confirm the card contains expected content from mock data
    await expect(proxyCard).toContainText("P4");
    await expect(proxyCard).toContainText("VII-B");
    await expect(proxyCard).toContainText("English");
    await expect(proxyCard).toContainText("Anita Devi");

    // ── Step 5: Click the "Accept" button ────────────────────────────────────
    const acceptButton = proxyCard.getByRole("button", { name: "Accept" });
    await expect(acceptButton).toBeVisible();
    await acceptButton.click();

    // ── Step 6: Assert the proxy request card is gone ────────────────────────
    // After accepting, the card is removed from the pending list
    await expect(proxyCard).not.toBeVisible({ timeout: 5_000 });

    // ── Step 7: Assert the "Accepted" confirmation card appears ──────────────
    // The dashboard renders a success card with a CheckCircle icon and
    // "Proxy accepted! Management has been notified." text
    const confirmationCard = page.locator('[class*="border-success"]').filter({
      hasText: "Proxy accepted",
    });
    await expect(confirmationCard).toBeVisible({ timeout: 5_000 });
    await expect(confirmationCard).toContainText("Management has been notified");
  });

  test("teacher dashboard shows proxy pending badge before accepting", async ({ page }) => {
    // ── Login ─────────────────────────────────────────────────────────────────
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

    await page.getByLabel("Email address").fill("priya@hcea.edu");
    await page.getByLabel("Password").fill("teacher123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL("**/teacher/dashboard", { timeout: 15_000 });

    // ── Assert pending badge in the page header ───────────────────────────────
    // The PageHeader renders a Badge: "1 proxy request pending"
    const pendingBadge = page.getByText(/proxy request.*pending/i);
    await expect(pendingBadge).toBeVisible({ timeout: 10_000 });

    // ── Assert the KPI card shows proxy count ────────────────────────────────
    await expect(page.getByText("Proxy Today")).toBeVisible();
  });

  test("Accept button is accessible via keyboard", async ({ page }) => {
    // ── Login ─────────────────────────────────────────────────────────────────
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

    await page.getByLabel("Email address").fill("priya@hcea.edu");
    await page.getByLabel("Password").fill("teacher123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL("**/teacher/dashboard", { timeout: 15_000 });

    // ── Assert "Accept" button is reachable and has accessible name ───────────
    const acceptButton = page.getByRole("button", { name: "Accept" });
    await expect(acceptButton).toBeVisible({ timeout: 10_000 });
    await expect(acceptButton).toBeEnabled();

    // Keyboard activate: Tab to focus + Enter to click
    await acceptButton.focus();
    await page.keyboard.press("Enter");

    // Confirmation should appear
    const confirmationCard = page.locator('[class*="border-success"]').filter({
      hasText: "Proxy accepted",
    });
    await expect(confirmationCard).toBeVisible({ timeout: 5_000 });
  });
});
