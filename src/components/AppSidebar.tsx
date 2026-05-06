import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Tags, PiggyBank, TrendingUp, CalendarDays, Home, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";

export type ViewKey = "home" | "categories" | "savings" | "investments" | "annual" | "profile";

const items: { key: ViewKey; label: string; icon: any }[] = [
  { key: "home", label: "Home", icon: Home },
  { key: "categories", label: "Categories", icon: Tags },
  { key: "savings", label: "Savings", icon: PiggyBank },
  { key: "investments", label: "Investments", icon: TrendingUp },
  { key: "annual", label: "Annual View", icon: CalendarDays },
];

export function AppSidebar({ active, onSelect }: { active: ViewKey; onSelect: (v: ViewKey) => void }) {
  const { getProfile } = useStore();
  const profile = getProfile();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-0 border-b border-sidebar-border">
        <button
          type="button"
          onClick={() => onSelect("profile")}
          aria-label="Open profile"
          className={`group/profile w-full text-left px-4 py-5 flex items-center gap-2.5 transition-colors hover:bg-sidebar-accent/60 ${active === "profile" ? "bg-sidebar-accent" : ""}`}
        >
          <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-sidebar-primary text-sidebar-primary-foreground text-base font-bold flex-shrink-0">
            💰
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-bold tracking-tight text-sidebar-foreground truncate">BudgetFlow</p>
            <p className="text-xs text-sidebar-foreground/70 truncate">Hi, {profile.name} 👋</p>
          </div>
          <ChevronRight className="h-4 w-4 text-sidebar-foreground/50 opacity-0 group-hover/profile:opacity-100 transition-opacity group-data-[collapsible=icon]:hidden" />
        </button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(item => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    isActive={active === item.key}
                    onClick={() => onSelect(item.key)}
                    tooltip={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
