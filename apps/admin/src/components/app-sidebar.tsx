"use client";

import {
  BarChart3,
  Briefcase,
  FileText,
  FolderGit2,
  HelpCircle,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutTemplate,
  ListTodo,
  LogOut,
  Mail,
  MessageSquareQuote,
  Package,
  Settings,
  UserCog,
  Users,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useLogout } from "@/hooks/use-session";

const navGroups = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
      { title: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Business",
    items: [
      { title: "Leads", href: "/leads", icon: Users },
      { title: "Subscribers", href: "/subscribers", icon: Mail },
      { title: "Todos", href: "/todos", icon: ListTodo },
    ],
  },
  {
    label: "Content",
    items: [
      { title: "Blog", href: "/blog", icon: FileText },
      { title: "Services", href: "/services", icon: Briefcase },
      { title: "Portfolio", href: "/projects", icon: FolderGit2 },
      { title: "Micro-SaaS", href: "/products", icon: Package },
      { title: "Testimonials", href: "/testimonials", icon: MessageSquareQuote },
      { title: "FAQs", href: "/faqs", icon: HelpCircle },
      { title: "Team", href: "/team", icon: UsersRound },
      { title: "Homepage", href: "/homepage", icon: LayoutTemplate },
      { title: "Media", href: "/media", icon: ImageIcon },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Settings", href: "/settings", icon: Settings },
      { title: "Account", href: "/account", icon: UserCog },
    ],
  },
];

export function AppSidebar({ user }: { user?: { name: string; email: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <img
            src="/logo.svg"
            alt="Strophic"
            width={32}
            height={32}
            className="h-8 w-8 rounded-[22%] ring-1 ring-white/10"
          />
          <span className="font-semibold">Strophic</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const active =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.title}
                      render={<Link href={item.href} />}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.name ?? "Admin"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex items-center gap-0.5">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              onClick={async () => {
                await logout.mutateAsync();
                router.replace("/login");
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
