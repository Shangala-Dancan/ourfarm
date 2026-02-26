import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Bell } from "lucide-react";

export function AppLayout() {
  const { user, currentFarm } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <h2 className="text-sm font-medium text-muted-foreground">
                {currentFarm?.name || "No farm selected"}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
                <Bell className="h-4 w-4" />
              </button>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
