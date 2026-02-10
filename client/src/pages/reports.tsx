import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Clock,
  DollarSign,
  Users,
  CalendarOff,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { Shift, TimeOffRequest, User as UserType } from "@shared/schema";
import { differenceInHours } from "date-fns";

const COLORS = [
  "hsl(217, 91%, 35%)",
  "hsl(173, 58%, 39%)",
  "hsl(197, 37%, 45%)",
  "hsl(43, 74%, 49%)",
  "hsl(27, 87%, 47%)",
];

export default function ReportsPage() {
  const { data: shifts = [], isLoading: loadingShifts } = useQuery<Shift[]>({
    queryKey: ["/api/shifts"],
  });

  const { data: employees = [], isLoading: loadingEmployees } = useQuery<
    UserType[]
  >({
    queryKey: ["/api/users"],
  });

  const { data: timeOffRequests = [], isLoading: loadingTimeOff } = useQuery<
    TimeOffRequest[]
  >({
    queryKey: ["/api/time-off"],
  });

  const isLoading = loadingShifts || loadingEmployees || loadingTimeOff;

  const hoursPerEmployee = employees
    .filter((e) => e.isActive)
    .map((emp) => {
      const empShifts = shifts.filter(
        (s) =>
          s.userId === emp.id &&
          (s.status === "completed" || s.status === "published")
      );
      const totalHours = empShifts.reduce((acc, s) => {
        return (
          acc +
          differenceInHours(new Date(s.endTime), new Date(s.startTime))
        );
      }, 0);
      const laborCost = emp.hourlyRate
        ? totalHours * parseFloat(emp.hourlyRate)
        : 0;
      return {
        name: `${emp.firstName} ${emp.lastName[0]}.`,
        hours: totalHours,
        cost: laborCost,
      };
    })
    .sort((a, b) => b.hours - a.hours);

  const timeOffByType = ["vacation", "sick", "personal", "unpaid"].map(
    (type) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: timeOffRequests.filter(
        (r) => r.type === type && r.status === "approved"
      ).length,
    })
  );

  const totalHours = hoursPerEmployee.reduce(
    (acc, emp) => acc + emp.hours,
    0
  );
  const totalCost = hoursPerEmployee.reduce(
    (acc, emp) => acc + emp.cost,
    0
  );
  const approvedTimeOff = timeOffRequests.filter(
    (r) => r.status === "approved"
  ).length;

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-reports-title">
          Reports
        </h1>
        <p className="text-muted-foreground text-sm">
          Team performance and labor analytics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5" data-testid="stat-total-hours">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-2xl font-bold">{totalHours}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5" data-testid="stat-total-cost">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-md bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Labor Cost
              </p>
              <p className="text-2xl font-bold">
                ${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-5" data-testid="stat-time-off-approved">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-md bg-amber-500/10 flex items-center justify-center">
              <CalendarOff className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Approved Time Off
              </p>
              <p className="text-2xl font-bold">{approvedTimeOff}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <h3
            className="font-semibold mb-4"
            data-testid="text-hours-chart"
          >
            Hours by Employee
          </h3>
          {hoursPerEmployee.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                No shift data available yet
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hoursPerEmployee.slice(0, 10)}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="hours"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5">
          <h3
            className="font-semibold mb-4"
            data-testid="text-timeoff-chart"
          >
            Time Off by Type
          </h3>
          {timeOffByType.every((t) => t.value === 0) ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarOff className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                No approved time-off data
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={timeOffByType.filter((t) => t.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {timeOffByType
                    .filter((t) => t.value > 0)
                    .map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-4" data-testid="text-labor-table">
          Labor Cost Breakdown
        </h3>
        {hoursPerEmployee.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No data available
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-labor">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium text-muted-foreground">
                    Employee
                  </th>
                  <th className="text-right py-2 font-medium text-muted-foreground">
                    Hours
                  </th>
                  <th className="text-right py-2 font-medium text-muted-foreground">
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {hoursPerEmployee.map((emp) => (
                  <tr
                    key={emp.name}
                    className="border-b border-border last:border-0"
                  >
                    <td className="py-2">{emp.name}</td>
                    <td className="py-2 text-right">
                      {emp.hours}h
                    </td>
                    <td className="py-2 text-right">
                      ${emp.cost.toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold">
                  <td className="py-2">Total</td>
                  <td className="py-2 text-right">{totalHours}h</td>
                  <td className="py-2 text-right">
                    ${totalCost.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
