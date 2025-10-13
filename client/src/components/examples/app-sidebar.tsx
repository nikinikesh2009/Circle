import { AppSidebar } from '../app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

export default function AppSidebarExample() {
  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex-1 p-6">
          <h2 className="text-lg font-semibold">Main Content Area</h2>
        </div>
      </div>
    </SidebarProvider>
  )
}
