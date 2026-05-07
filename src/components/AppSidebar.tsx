import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

export type ViewKey = "home" | "categories" | "savings" | "investments" | "annual" | "profile";

const items: { key: ViewKey; label: string; icon: string }[] = [
  { key: "home", label: "Home", icon: "🏠" },
  { key: "categories", label: "Categories", icon: "🏷️" },
  { key: "savings", label: "Savings", icon: "🐷" },
  { key: "investments", label: "Investments", icon: "📈" },
  { key: "annual", label: "Annual View", icon: "🗓️" },
  { key: "profile", label: "Profile", icon: "👤" },
];

export function AppSidebar({ active, onSelect }: { active: ViewKey; onSelect: (v: ViewKey) => void }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-sidebar-primary text-sidebar-primary-foreground text-base font-bold flex-shrink-0">
            💰
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-bold tracking-tight text-sidebar-foreground truncate">Mony</p>
            <p className="text-xs text-sidebar-foreground/70 truncate">Hi, Mariana 👋</p>
          </div>
        </div>
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
                    <span aria-hidden="true" className="text-base leading-none">
                      {item.icon}
                    </span>
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
