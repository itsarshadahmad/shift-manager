import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  CalendarDays,
  CalendarOff,
  ArrowLeftRight,
  Megaphone,
  Check,
  CheckCheck,
} from "lucide-react";
import { format } from "date-fns";
import type { Notification } from "@shared/schema";

const iconMap: Record<string, any> = {
  schedule_published: CalendarDays,
  shift_changed: CalendarDays,
  shift_assigned: CalendarDays,
  time_off_approved: CalendarOff,
  time_off_denied: CalendarOff,
  shift_swap_requested: ArrowLeftRight,
  shift_swap_approved: ArrowLeftRight,
  shift_swap_denied: ArrowLeftRight,
  announcement: Megaphone,
};

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/notifications/${id}`, {
        isRead: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/notifications/mark-all-read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-bold"
            data-testid="text-notifications-title"
          >
            Notifications
          </h1>
          <p className="text-muted-foreground text-sm">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            data-testid="button-mark-all-read"
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Bell className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-medium mb-1">No notifications</h3>
            <p className="text-sm text-muted-foreground">
              You'll see schedule changes, approvals, and announcements
              here.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = iconMap[notif.type] || Bell;
            return (
              <Card
                key={notif.id}
                className={`p-4 ${!notif.isRead ? "border-primary/30" : ""}`}
                data-testid={`notification-card-${notif.id}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${
                      !notif.isRead
                        ? "bg-primary/10"
                        : "bg-muted"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${!notif.isRead ? "text-primary" : "text-muted-foreground"}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm ${!notif.isRead ? "font-bold" : "font-medium"}`}
                      >
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {notif.message}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {format(
                        new Date(notif.createdAt),
                        "MMM d, h:mm a"
                      )}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => markRead.mutate(notif.id)}
                      data-testid={`button-read-${notif.id}`}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
