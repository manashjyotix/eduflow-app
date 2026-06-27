import { NoticeBoardView } from "@/components/shared/notice-board-view"

export default function SuperAdminNoticesPage() {
  return (
    <NoticeBoardView
      role="super_admin"
      subtitle="Platform notices — broadcast circulars to all tenant schools"
    />
  )
}
