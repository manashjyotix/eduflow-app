import { Suspense } from "react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Topbar } from "@/components/layout/topbar"
import { AuthGuard } from "@/components/layout/auth-guard"
import { ImpersonationBanner } from "@/components/layout/impersonation-banner"
import { EduFlowAssistant } from "@/components/shared/eduflow-assistant"
import { CommandPalette } from "@/components/shared/command-palette"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { RoleProvider } from "@/context/role-context"
import { ExamModeProvider } from "@/context/exam-mode-context"
import { ChildProvider } from "@/context/child-context"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <ExamModeProvider>
        <ChildProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <Suspense fallback={null}>
                <ImpersonationBanner />
              </Suspense>
              <Topbar />
              <main className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto">
                <AuthGuard>{children}</AuthGuard>
              </main>
            </SidebarInset>
            <EduFlowAssistant />
            <CommandPalette />
          </SidebarProvider>
        </ChildProvider>
      </ExamModeProvider>
    </RoleProvider>
  )
}
