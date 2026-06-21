/**
 * data-table.test.tsx
 * Example-based component tests for DataTable accessibility (Property 4).
 *
 * Validates: Requirements 6.4
 * Property 4 — DataTable renders a <caption> element when a caption prop is
 * provided, satisfying WCAG 1.3.1 (Info and Relationships).
 */
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { DataTable, type ColumnDef } from "@/components/shared/data-table"

// ─── Minimal fixture types ────────────────────────────────────────────────────

interface Row {
  id: string
  name: string
}

const columns: ColumnDef<Row>[] = [
  {
    key: "name",
    header: "Name",
    cell: (row) => row.name,
  },
]

const data: Row[] = [
  { id: "1", name: "Alice" },
  { id: "2", name: "Bob" },
]

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("DataTable — accessible table caption requirement (Property 4)", () => {
  it("renders a <caption> element when the caption prop is provided (WCAG 1.3.1)", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(row) => row.id}
        caption="Teacher attendance records"
      />
    )
    const captionEl = document.querySelector("caption")
    expect(captionEl).toBeInTheDocument()
    expect(captionEl).toHaveTextContent("Teacher attendance records")
  })

  it("does not render a <caption> element when no caption prop is passed", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(row) => row.id}
      />
    )
    const captionEl = document.querySelector("caption")
    expect(captionEl).not.toBeInTheDocument()
  })

  it("caption is visually hidden (sr-only) but present in the DOM for screen readers", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(row) => row.id}
        caption="Proxy assignments table"
      />
    )
    const captionEl = document.querySelector("caption")
    expect(captionEl).toBeInTheDocument()
    expect(captionEl?.className).toContain("sr-only")
  })

  it("still renders data rows correctly when a caption is provided", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(row) => row.id}
        caption="Student list"
      />
    )
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("Bob")).toBeInTheDocument()
  })

  it("renders a column header inside the table", () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        keyExtractor={(row) => row.id}
        caption="Fee collection"
      />
    )
    expect(screen.getByText("Name")).toBeInTheDocument()
  })

  it("renders empty state when data is an empty array", () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        keyExtractor={(row) => row.id}
        caption="Empty table"
      />
    )
    expect(screen.getByText("No results found.")).toBeInTheDocument()
  })
})
