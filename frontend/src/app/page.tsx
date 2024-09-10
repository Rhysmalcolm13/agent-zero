import { AppSidebar2 } from "@/components/app-sidebar2"
import {
  SidebarLayout,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import ChatInterface from "@/components/ChatInterface"

export default async function Page() {
  const { cookies } = await import("next/headers")
  return (
    <SidebarLayout
      defaultOpen={cookies().get("sidebar:state")?.value === "true"}
    >
      <AppSidebar2 />  
      <main className="flex flex-1 flex-col p-2 transition-all duration-300 ease-in-out h-screen">
        <div className="h-full rounded-md border-2 border-dashed p-2 flex flex-col pb-4">
          <SidebarTrigger />
          <div className="flex-1 overflow-auto">
            <ChatInterface />
          </div>
        </div>
      </main>
    </SidebarLayout>
  )
}
