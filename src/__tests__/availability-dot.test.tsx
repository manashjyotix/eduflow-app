/**
 * availability-dot.test.tsx
 * Example-based component tests for AvailabilityDot accessibility (Property 1).
 *
 * Validates: Requirements 6.1
 * Property 1 — Every AvailabilityDot status renders a non-empty visible text label
 * alongside the dot, satisfying WCAG 1.4.1 (no color alone).
 */
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { AvailabilityDot, DOT_LABELS, type TeacherAvailability } from "@/components/shared/status-badge"

const STATUSES: TeacherAvailability[] = [
  "available-same",
  "available-diff",
  "capped",
  "unavailable",
]

describe("AvailabilityDot — accessibility label requirement (Property 1)", () => {
  it.each(STATUSES)(
    'renders a visible text label for status "%s" (WCAG 1.4.1)',
    (status) => {
      render(<AvailabilityDot status={status} />)
      const expectedLabel = DOT_LABELS[status]
      expect(expectedLabel).toBeTruthy()
      const labelEl = screen.getByText(expectedLabel)
      expect(labelEl).toBeInTheDocument()
    }
  )

  it('renders the default label "Available (same subject)" for available-same', () => {
    render(<AvailabilityDot status="available-same" />)
    expect(screen.getByText("Available (same subject)")).toBeInTheDocument()
  })

  it('renders the default label "Available (alt subject)" for available-diff', () => {
    render(<AvailabilityDot status="available-diff" />)
    expect(screen.getByText("Available (alt subject)")).toBeInTheDocument()
  })

  it('renders the default label "Capped" for capped', () => {
    render(<AvailabilityDot status="capped" />)
    expect(screen.getByText("Capped")).toBeInTheDocument()
  })

  it('renders the default label "Unavailable" for unavailable', () => {
    render(<AvailabilityDot status="unavailable" />)
    expect(screen.getByText("Unavailable")).toBeInTheDocument()
  })

  it("renders a custom label when the label prop is provided", () => {
    render(<AvailabilityDot status="available-same" label="Free this period" />)
    expect(screen.getByText("Free this period")).toBeInTheDocument()
    // default label should not appear when overridden
    expect(screen.queryByText("Available (same subject)")).not.toBeInTheDocument()
  })

  it("dot element is aria-hidden so screen readers rely on text label only", () => {
    const { container } = render(<AvailabilityDot status="capped" />)
    // The colored dot span should carry aria-hidden="true"
    const dot = container.querySelector('[aria-hidden="true"]')
    expect(dot).toBeInTheDocument()
  })

  it("DOT_LABELS covers all four statuses with non-empty strings", () => {
    for (const status of STATUSES) {
      expect(DOT_LABELS[status]).toBeTruthy()
      expect(typeof DOT_LABELS[status]).toBe("string")
      expect(DOT_LABELS[status].length).toBeGreaterThan(0)
    }
  })
})
