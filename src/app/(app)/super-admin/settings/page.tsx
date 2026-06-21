import { redirect } from "next/navigation"

// Global platform settings have been merged into Profile & Platform Settings.
export default function SettingsRedirect() {
  redirect("/super-admin/profile")
}
