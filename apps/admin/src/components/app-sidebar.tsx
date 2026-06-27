"use client";

import {
  FileText,
  HelpCircle,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquareQuote,
  Settings,
  UserCog,
  Users,
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
import { useLogout } from "@/hooks/use-session";

const nav = [
  { title: "Overview", href: "/", icon: LayoutDashboard },
  { title: "Leads", href: "/leads", icon: Users },
  { title: "Subscribers", href: "/subscribers", icon: Mail },
  { title: "Blog", href: "/blog", icon: FileText },
  { title: "Testimonials", href: "/testimonials", icon: MessageSquareQuote },
  { title: "FAQs", href: "/faqs", icon: HelpCircle },
  { title: "Media", href: "/media", icon: ImageIcon },
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "Account", href: "/account", icon: UserCog },
];

export function AppSidebar({ user }: { user?: { name: string; email: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary font-semibold text-primary-foreground">
            S
          </span>
          <span className="font-semibold">Strophic</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarMenu>
            {nav.map((item) => {
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
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.name ?? "Admin"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
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
      </SidebarFooter>
    </Sidebar>
  );
}
