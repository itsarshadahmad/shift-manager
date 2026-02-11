import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  LayoutDashboard,
  Users,
  CalendarOff,
  Bell,
  MessageSquare,
  BarChart3,
  MapPin,
  LogOut,
  ArrowLeftRight,
  UserCog,
} from "lucide-react";
import type { Message, Notification as NotifType } from "@shared/schema";

export const roleConfig: Record<string, { label: string; className: string }> = {
  owner: { label: "Admin", className: "bg-violet-500/15 text-violet-700 dark:text-violet-400 no-default-hover-elevate no-default-active-elevate" },
  manager: { label: "Manager", className: "bg-sky-500/15 text-sky-700 dark:text-sky-400 no-default-hover-elevate no-default-active-elevate" },
  employee: { label: "Employee", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 no-default-hover-elevate no-default-active-elevate" },
};

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Schedule", url: "/schedule", icon: Calendar },
  { title: "Time Off", url: "/time-off", icon: CalendarOff },
  { title: "Swap Requests", url: "/swaps", icon: ArrowLeftRight },
  { title: "Employees", url: "/employees", icon: Users, managerOnly: true },
  { title: "Locations", url: "/locations", icon: MapPin, managerOnly: true },
  { title: "Messages", url: "/messages", icon: MessageSquare, badgeKey: "messages" as const },
  { title: "Notifications", url: "/notifications", icon: Bell, badgeKey: "notifications" as const },
  { title: "Reports", url: "/reports", icon: BarChart3, ownerOnly: true },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isManager = user?.role === "owner" || user?.role === "manager";
  const isOwner = user?.role === "owner";

  const { data: allMessages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    refetchInterval: 15000,
  });

  const { data: allNotifications = [] } = useQuery<NotifType[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 15000,
  });

  const unreadMessages = allMessages.filter(
    (m) => !m.isRead && (m.recipientId === user?.id || (m.isBroadcast && m.senderId !== user?.id))
  ).length;

  const unreadNotifications = allNotifications.filter((n) => !n.isRead).length;

  const badgeCounts: Record<string, number> = {
    messages: unreadMessages,
    notifications: unreadNotifications,
  };

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "??";

  const roleCfg = roleConfig[user?.role || "employee"];

  const filteredNav = navItems.filter((item) => {
    if ((item as any).ownerOnly && !isOwner) return false;
    if ((item as any).managerOnly && !isManager) return false;
    return true;
  });

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <span className="font-bold text-sm">ShiftFlow</span>
            <Badge variant="secondary" className={`block text-[10px] mt-0.5 w-fit ${roleCfg.className}`}>
              {roleCfg.label}
            </Badge>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNav.map((item) => {
                const isActive = location === item.url || location.startsWith(item.url + "/");
                const badgeCount = (item as any).badgeKey ? badgeCounts[(item as any).badgeKey] || 0 : 0;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span className="flex-1">{item.title}</span>
                        {badgeCount > 0 && (
                          <Badge variant="default" className="text-xs ml-auto no-default-hover-elevate no-default-active-elevate">
                            {badgeCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="w-9 h-9">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </Link>
          <Button
            size="icon"
            variant="ghost"
            onClick={logout}
            className="text-destructive"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
