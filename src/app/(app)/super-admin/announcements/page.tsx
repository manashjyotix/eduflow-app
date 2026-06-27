import { AnnouncementsView } from "@/components/shared/announcements-view"

export default function SuperAdminAnnouncementsPage() {
  return (
    <AnnouncementsView
      role="super_admin"
      subtitle="Platform-wide announcements — broadcast to all tenant schools"
    />
  )
}
