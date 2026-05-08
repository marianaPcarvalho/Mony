import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tags, PiggyBank, TrendingUp, CalendarDays, Home, UserCircle2 } from "lucide-react";
import { useStore } from "@/lib/store";
import monyLogo from "@/assets/mony-logo.png";

export type ViewKey = "home" | "categories" | "savings" | "investments" | "annual" | "profile";

const items: { key: ViewKey; label: string; icon: any }[] = [
  { key: "home", label: "Início", icon: Home },
  { key: "categories", label: "Categorias", icon: Tags },
  { key: "savings", label: "Poupanças", icon: PiggyBank },
  { key: "investments", label: "Investimentos", icon: TrendingUp },
  { key: "annual", label: "Vista Anual", icon: CalendarDays },
];

export function AppSidebar({ active, onSelect }: { active: ViewKey; onSelect: (v: ViewKey) => void }) {
  const { getProfile } = useStore();
  const profile = getProfile();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-1 py-1.5">
          <img
            src={monyLogo}
            alt="MONY logo"
            width={36}
            height={36}
            className="h-9 w-9 rounded-xl object-contain flex-shrink-0 bg-white shadow-lg p-1"
          />
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-base font-extrabold tracking-tight text-sidebar-foreground truncate font-display">MONY</p>
            <p className="text-xs text-sidebar-foreground/70 truncate">Olá, {profile.name} ✨</p>
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
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={active === "profile"}
              onClick={() => onSelect("profile")}
              tooltip={`Perfil — ${profile.name}`}
              className="h-11"
            >
              <UserCircle2 className="h-4 w-4" />
              <div className="flex flex-col items-start min-w-0 leading-tight">
                <span className="text-sm font-semibold truncate">{profile.name}</span>
                <span className="text-[11px] text-sidebar-foreground/60 truncate">Ver perfil</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && null}
      </SidebarFooter>
    </Sidebar>
  );
}
