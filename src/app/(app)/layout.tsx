import { Suspense } from "react"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppScrollArea } from "@/components/layout/app-scroll-area"
import { Topbar } from "@/components/layout/topbar"
import { AuthGuard } from "@/components/layout/auth-guard"
import { ImpersonationBanner } from "@/components/layout/impersonation-banner"
import { EduFlowAssistant } from "@/components/shared/eduflow-assistant"
import { CommandPalette } from "@/components/shared/command-palette"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { RoleProvider } from "@/context/role-context"
import { ExamModeProvider } from "@/context/exam-mode-context"
import { AttendanceModeProvider } from "@/context/attendance-mode-context"
import { ChildProvider } from "@/context/child-context"
import { BirthdayWishProvider } from "@/context/birthday-wish-context"
import { StudentLeaveProvider } from "@/context/student-leave-context"
import { AttendanceProvider } from "@/context/attendance-context"
import { NotificationProvider } from "@/context/notification-context"
import { ClassJournalProvider } from "@/context/class-journal-context"
import { ReportCardProvider } from "@/context/report-card-context"
import { ExamScheduleProvider } from "@/context/exam-schedule-context"
import { TransportProvider } from "@/context/transport-context"
import { SOSProvider } from "@/context/sos-context"
import { HazardAlertProvider } from "@/context/hazard-alert-context"
import { HazardAlertBanner } from "@/components/domain/hazard/hazard-alert-banner"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <ExamModeProvider>
        <AttendanceModeProvider>
        <ChildProvider>
          <BirthdayWishProvider>
            <StudentLeaveProvider>
              <AttendanceProvider>
                <NotificationProvider>
                  <ClassJournalProvider>
                    <ReportCardProvider>
                      <ExamScheduleProvider>
                        <TransportProvider>
                          <SOSProvider>
                            <HazardAlertProvider>
                              <SidebarProvider>
                                <AppSidebar />
                                <SidebarInset>
                                  <Suspense fallback={null}>
                                    <ImpersonationBanner />
                                  </Suspense>
                                  <HazardAlertBanner />
                                  <Topbar />
                                  <AppScrollArea>
                                    <AuthGuard>{children}</AuthGuard>
                                  </AppScrollArea>
                                </SidebarInset>
                                <EduFlowAssistant />
                                <CommandPalette />
                              </SidebarProvider>
                            </HazardAlertProvider>
                          </SOSProvider>
                        </TransportProvider>
                      </ExamScheduleProvider>
                    </ReportCardProvider>
                  </ClassJournalProvider>
                </NotificationProvider>
              </AttendanceProvider>
            </StudentLeaveProvider>
          </BirthdayWishProvider>
        </ChildProvider>
        </AttendanceModeProvider>
      </ExamModeProvider>
    </RoleProvider>
  )
}
