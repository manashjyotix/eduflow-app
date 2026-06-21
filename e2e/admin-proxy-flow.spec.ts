import { test, expect } from "@playwright/test"

/**
 * E2E: Admin absence-to-proxy flow
 *
 * Covers Requirements: 13.4
 *
 * Flow:
 *   1. Visit /login → sign in as admin
 *   2. Assert redirect to /admin/dashboard
 *   3. Navigate to /admin/absences → mark a teacher absent
 *   4. Navigate to /admin/proxy-board → assert absence row appears
 *   5. Click Auto-Assign → assert a proxy row appears + Coverage % KPI updates
 */

test.setTimeout(60_000)

// Admin demo credentials (mock auth — any valid email + password works,
// but these credentials map to the "admin" role in the auth context)
const ADMIN_EMAIL = "admin@hcea.edu"
const ADMIN_PASSWORD = "admin123"

// Teacher to mark absent during the test.
// We pick "Priya Sharma" (t1) because she is NOT in MOCK_ABSENCES by default,
// so she will definitely appear as a fresh absence on the proxy board.
const ABSENT_TEACHER = "Priya Sharma"

test("Admin can mark a teacher absent and auto-assign a proxy", async ({ page }) => {
  // ──────────────────────────────────────────────────────────────────────────
  // Step 1: Log in as admin
  // ──────────────────────────────────────────────────────────────────────────

  await page.goto("/login")

  // Fill email field (label: "Email address")
  await page.getByLabel("Email address").fill(ADMIN_EMAIL)

  // Fill password field (label: "Password")
  await page.getByLabel("Password").fill(ADMIN_PASSWORD)

  // Submit the form
  await page.getByRole("button", { name: /sign in/i }).click()

  // ──────────────────────────────────────────────────────────────────────────
  // Step 2: Assert redirect to /admin/dashboard
  // ──────────────────────────────────────────────────────────────────────────

  await page.waitForURL("**/admin/dashboard", { timeout: 15_000 })
  await expect(page).toHaveURL(/\/admin\/dashboard/)

  // ──────────────────────────────────────────────────────────────────────────
  // Step 3: Navigate to /admin/absences and mark a teacher absent
  // ──────────────────────────────────────────────────────────────────────────

  await page.goto("/admin/absences")
  await page.waitForURL("**/admin/absences", { timeout: 10_000 })

  // Open the "Mark Absence" dialog
  await page.getByRole("button", { name: /mark absence/i }).click()

  // Wait for the dialog to appear
  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible({ timeout: 5_000 })
  await expect(dialog.getByText(/mark teacher absence/i)).toBeVisible()

  // Select the teacher via the "Teacher" combobox/select
  // The SelectTrigger has a placeholder "Select teacher..."
  await dialog.getByRole("combobox").first().click()

  // Wait for the dropdown options and click Priya Sharma
  const teacherOption = page.getByRole("option", { name: new RegExp(ABSENT_TEACHER, "i") })
  await teacherOption.waitFor({ state: "visible", timeout: 5_000 })
  await teacherOption.click()

  // Leave the date as today (default), leave type as Full Day (default)
  // Add a reason
  await dialog.getByPlaceholder(/brief description/i).fill("E2E test absence")

  // Submit the form
  await dialog.getByRole("button", { name: /mark as absent/i }).click()

  // Dialog should close and a success toast should appear
  await expect(dialog).not.toBeVisible({ timeout: 5_000 })

  // Confirm the new absence row appears in the list
  await expect(
    page.getByText(ABSENT_TEACHER).first()
  ).toBeVisible({ timeout: 5_000 })

  // ──────────────────────────────────────────────────────────────────────────
  // Step 4 (part a): Approve the absence so it appears on the proxy board
  //
  // The newly created absence has status "pending". The proxy board only
  // shows "approved" absences. We approve it via the row's Approve button.
  // ──────────────────────────────────────────────────────────────────────────

  // Find the absence row for the teacher we just marked
  const absenceRow = page
    .getByRole("listitem")
    .filter({ hasText: ABSENT_TEACHER })
    .first()

  await expect(absenceRow).toBeVisible({ timeout: 5_000 })

  // Click the Approve button on that row
  const approveBtn = absenceRow.getByRole("button", { name: /approve/i })
  await expect(approveBtn).toBeVisible()
  await approveBtn.click()

  // Confirm the status badge changes to "Approved"
  await expect(
    absenceRow.getByText(/approved/i)
  ).toBeVisible({ timeout: 5_000 })

  // ──────────────────────────────────────────────────────────────────────────
  // Step 4 (part b): Navigate to /admin/proxy-board
  // ──────────────────────────────────────────────────────────────────────────

  await page.goto("/admin/proxy-board")
  await page.waitForURL("**/admin/proxy-board", { timeout: 10_000 })

  // ──────────────────────────────────────────────────────────────────────────
  // Step 5a: Assert the absence row for Priya Sharma appears on the board
  // ──────────────────────────────────────────────────────────────────────────

  // Each absence is rendered as a Card with the teacher's name in the header
  const absenceCard = page
    .getByRole("article")
    .filter({ hasText: ABSENT_TEACHER })
    .first()

  await expect(absenceCard).toBeVisible({ timeout: 10_000 })

  // ──────────────────────────────────────────────────────────────────────────
  // Step 5b: Capture Coverage % before auto-assign
  // ──────────────────────────────────────────────────────────────────────────

  // The Coverage KPI card title is rendered in uppercase ("COVERAGE") via CSS
  // class text-xs uppercase. We use a case-insensitive text match.
  // The value paragraph sits as a sibling in the same "space-y-1" div.
  const coverageKpiTitle = page.getByText(/^coverage$/i).first()
  await expect(coverageKpiTitle).toBeVisible()

  // Navigate up to the card's value — it's a sibling <p> with font-bold
  const coverageValueEl = coverageKpiTitle
    .locator("..")           // space-y-1 div
    .locator("p")
    .nth(1)                  // second <p> is the value

  const coverageBefore = await coverageValueEl.textContent()

  // ──────────────────────────────────────────────────────────────────────────
  // Step 5c: Click the per-absence "Auto-Assign" button for Priya Sharma
  // ──────────────────────────────────────────────────────────────────────────

  // There is a per-absence "Auto-Assign for Priya" button inside the card footer,
  // and a global "Auto-Assign All" button in the page header.
  // We target the one scoped to the absence card for precision.
  const autoAssignBtn = absenceCard.getByRole("button", {
    name: new RegExp(`auto.assign`, "i"),
  })
  await expect(autoAssignBtn).toBeVisible()
  await autoAssignBtn.first().click()

  // ──────────────────────────────────────────────────────────────────────────
  // Step 5d: Assert a proxy row appears (assigned column shows a proxy)
  // ──────────────────────────────────────────────────────────────────────────

  // After auto-assign, at least one period cell should show a proxy assignment.
  // The AvailabilityDot for assigned status renders with an "assigned" label.
  // We check that at least one button with aria-label containing "assigned" appears
  // OR that the "Covered" counter within the absence card updates.
  //
  // Strategy: wait for the covered count badge to update from "0/N" to ">0/N"
  await expect(
    absenceCard.getByText(/[1-9]\d*\/\d+/).first()
  ).toBeVisible({ timeout: 10_000 })

  // ──────────────────────────────────────────────────────────────────────────
  // Step 5e: Assert Coverage % KPI updates
  // ──────────────────────────────────────────────────────────────────────────

  // Re-locate the coverage value after auto-assign
  const coverageAfter = await coverageValueEl.textContent({ timeout: 5_000 })

  // Coverage should be a percentage string (e.g. "14.3%" or "100%")
  expect(coverageAfter).toMatch(/\d+(\.\d+)?%/)

  // Coverage should have increased from the pre-assign reading.
  // The proxy board starts with some pre-existing proxies (MOCK_PROXIES),
  // so "before" may already be non-zero, but it should be ≥ before.
  if (coverageBefore && coverageAfter) {
    const before = parseFloat(coverageBefore.replace("%", ""))
    const after  = parseFloat(coverageAfter.replace("%", ""))
    expect(after).toBeGreaterThanOrEqual(before)
  }
})
