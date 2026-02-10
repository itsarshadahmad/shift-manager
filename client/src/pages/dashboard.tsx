import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  CalendarDays,
  CalendarOff,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import type { Shift, TimeOffRequest, User as UserType } from "@shared/schema";
import { format, isToday, isTomorrow, startOfDay, endOfDay, addDays } from "date-fns";

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  testId,
}: {
  label: string;
  value: string | number;
  icon: any;
  trend?: string;
  testId: string;
}) {
  return (
    <Card className="p-5" data-testid={testId}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: employees = [], isLoading: loadingEmployees } = useQuery<
    UserType[]
  >({
    queryKey: ["/api/users"],
  });

  const { data: shifts = [], isLoading: loadingShifts } = useQuery<Shift[]>({
    queryKey: ["/api/shifts"],
  });

  const { data: timeOffRequests = [], isLoading: loadingTimeOff } = useQuery<
    TimeOffRequest[]
  >({
    queryKey: ["/api/time-off"],
  });

  const isLoading = loadingEmployees || loadingShifts || loadingTimeOff;

  const today = new Date();
  const todayShifts = shifts.filter((s) => {
    const st = new Date(s.startTime);
    return st >= startOfDay(today) && st <= endOfDay(today);
  });

  const tomorrowShifts = shifts.filter((s) => {
    const tomorrow = addDays(today, 1);
    const st = new Date(s.startTime);
    return st >= startOfDay(tomorrow) && st <= endOfDay(tomorrow);
  });

  const pendingRequests = timeOffRequests.filter(
    (r) => r.status === "pending"
  );

  const activeEmployees = employees.filter((e) => e.isActive);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">
          Good {today.getHours() < 12 ? "morning" : today.getHours() < 17 ? "afternoon" : "evening"},{" "}
          {user?.firstName}
        </h1>
        <p className="text-muted-foreground">
          {format(today, "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Active Employees"
          value={activeEmployees.length}
          icon={Users}
          testId="stat-employees"
        />
        <StatCard
          label="Today's Shifts"
          value={todayShifts.length}
          icon={CalendarDays}
          testId="stat-today-shifts"
        />
        <StatCard
          label="Pending Time Off"
          value={pendingRequests.length}
          icon={CalendarOff}
          testId="stat-pending-time-off"
        />
        <StatCard
          label="Tomorrow's Shifts"
          value={tomorrowShifts.length}
          icon={Clock}
          testId="stat-tomorrow-shifts"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-4" data-testid="text-today-schedule">
            Today's Schedule
          </h3>
          {todayShifts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarDays className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                No shifts scheduled for today
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayShifts.slice(0, 6).map((shift) => {
                const employee = employees.find(
                  (e) => e.id === shift.userId
                );
                return (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0"
                    data-testid={`shift-item-${shift.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {employee
                            ? `${employee.firstName} ${employee.lastName}`
                            : "Unassigned"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {shift.position || "General"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(shift.startTime), "h:mm a")} -{" "}
                        {format(new Date(shift.endTime), "h:mm a")}
                      </span>
                      <Badge
                        variant={
                          shift.status === "published"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {shift.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {todayShifts.length > 6 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{todayShifts.length - 6} more shifts
                </p>
              )}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3
            className="font-semibold mb-4"
            data-testid="text-pending-requests"
          >
            Pending Time-Off Requests
          </h3>
          {pendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarOff className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                No pending requests
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.slice(0, 5).map((req) => {
                const employee = employees.find(
                  (e) => e.id === req.userId
                );
                return (
                  <div
                    key={req.id}
                    className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0"
                    data-testid={`time-off-item-${req.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {employee
                            ? `${employee.firstName} ${employee.lastName}`
                            : "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(req.startDate), "MMM d")} -{" "}
                          {format(new Date(req.endDate), "MMM d")}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="capitalize text-xs">
                      {req.type}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
