import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { roleConfig } from "@/components/app-sidebar";
import {
  Users,
  CalendarDays,
  CalendarOff,
  Clock,
  TrendingUp,
  AlertCircle,
  Briefcase,
  Timer,
  CalendarCheck,
} from "lucide-react";
import type { Shift, TimeOffRequest, User as UserType, Location } from "@shared/schema";
import {
  format,
  isToday,
  isTomorrow,
  startOfDay,
  endOfDay,
  addDays,
  startOfWeek,
  endOfWeek,
  differenceInHours,
} from "date-fns";

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

function AdminDashboard({
  user,
  employees,
  shifts,
  timeOffRequests,
}: {
  user: any;
  employees: UserType[];
  shifts: Shift[];
  timeOffRequests: TimeOffRequest[];
}) {
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

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" data-testid="admin-stats-grid">
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
    </>
  );
}

function EmployeeDashboard({
  user,
  shifts,
  timeOffRequests,
  locations,
}: {
  user: any;
  shifts: Shift[];
  timeOffRequests: TimeOffRequest[];
  locations: Location[];
}) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 0 });

  const myShifts = shifts.filter((s) => s.userId === user.id);
  const myTimeOff = timeOffRequests.filter((r) => r.userId === user.id);

  const myShiftsThisWeek = myShifts.filter((s) => {
    const st = new Date(s.startTime);
    return st >= weekStart && st <= weekEnd;
  });

  const myHoursThisWeek = myShiftsThisWeek.reduce((acc, s) => {
    return acc + differenceInHours(new Date(s.endTime), new Date(s.startTime));
  }, 0);

  const myPendingRequests = myTimeOff.filter((r) => r.status === "pending");

  const upcomingShifts = myShifts
    .filter((s) => new Date(s.startTime) >= today)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const nextShift = upcomingShifts[0];

  const nextShiftDisplay = nextShift
    ? format(new Date(nextShift.startTime), "MMM d, h:mm a")
    : "None";

  const recentTimeOff = [...myTimeOff]
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 5);

  const getLocationName = (locationId: string | null) => {
    if (!locationId) return null;
    const loc = locations.find((l) => l.id === locationId);
    return loc ? loc.name : null;
  };

  const statusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "approved":
      case "published":
      case "completed":
        return "default";
      case "pending":
      case "scheduled":
        return "secondary";
      case "denied":
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" data-testid="employee-stats-grid">
        <StatCard
          label="My Shifts This Week"
          value={myShiftsThisWeek.length}
          icon={CalendarDays}
          testId="stat-my-shifts-week"
        />
        <StatCard
          label="My Hours This Week"
          value={`${myHoursThisWeek}h`}
          icon={Timer}
          testId="stat-my-hours-week"
        />
        <StatCard
          label="My Pending Requests"
          value={myPendingRequests.length}
          icon={CalendarOff}
          testId="stat-my-pending-requests"
        />
        <StatCard
          label="Next Shift"
          value={nextShiftDisplay}
          icon={Briefcase}
          testId="stat-next-shift"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-4" data-testid="text-my-upcoming-shifts">
            My Upcoming Shifts
          </h3>
          {upcomingShifts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarDays className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                No upcoming shifts
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingShifts.slice(0, 5).map((shift) => {
                const locName = getLocationName(shift.locationId);
                return (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0"
                    data-testid={`my-shift-item-${shift.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" data-testid={`my-shift-date-${shift.id}`}>
                          {format(new Date(shift.startTime), "EEE, MMM d")}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`my-shift-time-${shift.id}`}>
                          {format(new Date(shift.startTime), "h:mm a")} -{" "}
                          {format(new Date(shift.endTime), "h:mm a")}
                          {locName && ` \u00B7 ${locName}`}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={statusVariant(shift.status)}
                      className="capitalize text-xs"
                      data-testid={`my-shift-status-${shift.id}`}
                    >
                      {shift.status}
                    </Badge>
                  </div>
                );
              })}
              {upcomingShifts.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-2" data-testid="text-more-shifts">
                  +{upcomingShifts.length - 5} more shifts
                </p>
              )}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4" data-testid="text-my-time-off">
            My Time Off
          </h3>
          {recentTimeOff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarOff className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                No time-off requests
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTimeOff.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0"
                  data-testid={`my-time-off-item-${req.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CalendarCheck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium capitalize truncate" data-testid={`my-time-off-type-${req.id}`}>
                        {req.type}
                      </p>
                      <p className="text-xs text-muted-foreground" data-testid={`my-time-off-dates-${req.id}`}>
                        {format(new Date(req.startDate), "MMM d")} -{" "}
                        {format(new Date(req.endDate), "MMM d")}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={statusVariant(req.status)}
                    className="capitalize text-xs"
                    data-testid={`my-time-off-status-${req.id}`}
                  >
                    {req.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const isAdmin = user?.role === "owner" || user?.role === "manager";
  const roleCfg = roleConfig[user?.role || "employee"];

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

  const { data: locations = [], isLoading: loadingLocations } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
    enabled: !isAdmin,
  });

  const isLoading = loadingEmployees || loadingShifts || loadingTimeOff || (!isAdmin && loadingLocations);

  const today = new Date();

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
      <div className="flex items-center gap-3 flex-wrap" data-testid="dashboard-header">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">
            Good {today.getHours() < 12 ? "morning" : today.getHours() < 17 ? "afternoon" : "evening"},{" "}
            {user?.firstName}
          </h1>
          <p className="text-muted-foreground" data-testid="text-dashboard-date">
            {format(today, "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <Badge variant="secondary" className={`text-xs ${roleCfg.className}`} data-testid="badge-user-role">
          {roleCfg.label}
        </Badge>
      </div>

      {isAdmin ? (
        <AdminDashboard
          user={user}
          employees={employees}
          shifts={shifts}
          timeOffRequests={timeOffRequests}
        />
      ) : (
        <EmployeeDashboard
          user={user}
          shifts={shifts}
          timeOffRequests={timeOffRequests}
          locations={locations}
        />
      )}
    </div>
  );
}
