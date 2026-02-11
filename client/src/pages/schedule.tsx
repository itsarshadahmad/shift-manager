import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalIcon,
  Loader2,
  Clock,
  MapPin,
  User,
  Pencil,
  Trash2,
  Briefcase,
  FileText,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isSameDay,
  setHours,
  setMinutes,
  differenceInMinutes,
} from "date-fns";
import { cn } from "@/lib/utils";
import type { Shift, User as UserType, Location } from "@shared/schema";

interface ShiftFormData {
  userId: string;
  locationId: string;
  startTime: string;
  endTime: string;
  position: string;
  notes: string;
  status: string;
}

const statusConfig: Record<string, { label: string; badgeClass: string }> = {
  scheduled: {
    label: "Scheduled",
    badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-transparent",
  },
  published: {
    label: "Published",
    badgeClass: "bg-primary/15 text-primary border-transparent",
  },
  completed: {
    label: "Completed",
    badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-transparent",
  },
  cancelled: {
    label: "Cancelled",
    badgeClass: "bg-destructive/15 text-destructive border-transparent",
  },
};

function formatTime(date: Date | string) {
  const d = new Date(date);
  return format(d, "h:mm a");
}

function formatDuration(start: Date | string, end: Date | string) {
  const mins = differenceInMinutes(new Date(end), new Date(start));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function parse24hTo12h(time24: string): { hour: string; minute: string; period: string } {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  const minute = String(Math.round(m / 15) * 15).padStart(2, "0");
  return { hour: String(h), minute: minute === "60" ? "00" : minute, period };
}

function to24h(hour: string, minute: string, period: string): string {
  let h = parseInt(hour, 10);
  if (period === "AM" && h === 12) h = 0;
  else if (period === "PM" && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:${minute}`;
}

function TimePicker({
  value,
  onChange,
  label,
  testIdPrefix,
}: {
  value: string;
  onChange: (val: string) => void;
  label: string;
  testIdPrefix: string;
}) {
  const [open, setOpen] = useState(false);
  const parsed = parse24hTo12h(value);
  const displayTime = `${parsed.hour}:${parsed.minute} ${parsed.period}`;

  const handleChange = (field: "hour" | "minute" | "period", val: string) => {
    const current = parse24hTo12h(value);
    const next = { ...current, [field]: val };
    onChange(to24h(next.hour, next.minute, next.period));
  };

  const presetTimes = [
    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
    "18:00", "19:00", "20:00", "21:00", "22:00", "23:00",
  ];

  const formatPreset = (t: string) => {
    const p = parse24hTo12h(t);
    return `${p.hour}:${p.minute} ${p.period}`;
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start font-normal"
            data-testid={`${testIdPrefix}-trigger`}
          >
            <Clock className="mr-2 w-4 h-4 text-muted-foreground" />
            {displayTime}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{displayTime}</span>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)} data-testid={`${testIdPrefix}-done`}>
                Done
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Hour</p>
            <div className="grid grid-cols-4 gap-1">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                <Button
                  key={h}
                  type="button"
                  size="sm"
                  variant={parsed.hour === String(h) ? "default" : "ghost"}
                  onClick={() => handleChange("hour", String(h))}
                  data-testid={`${testIdPrefix}-hour-${h}`}
                >
                  {h}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 mb-2">Minute</p>
            <div className="flex items-center gap-1">
              <div className="flex-1 grid grid-cols-4 gap-1">
                {["00", "15", "30", "45"].map((m) => (
                  <Button
                    key={m}
                    type="button"
                    size="sm"
                    variant={parsed.minute === m ? "default" : "ghost"}
                    onClick={() => handleChange("minute", m)}
                    data-testid={`${testIdPrefix}-min-${m}`}
                  >
                    :{m}
                  </Button>
                ))}
              </div>
              <div className="flex flex-col gap-1 ml-1">
                {["AM", "PM"].map((p) => (
                  <Button
                    key={p}
                    type="button"
                    size="sm"
                    variant={parsed.period === p ? "default" : "ghost"}
                    onClick={() => handleChange("period", p)}
                    data-testid={`${testIdPrefix}-${p.toLowerCase()}`}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div className="px-3 pt-2 pb-1">
            <p className="text-xs text-muted-foreground">Quick Select</p>
          </div>
          <div className="px-2 pb-2 max-h-[180px] overflow-y-auto grid grid-cols-3 gap-1">
            {presetTimes.map((t) => (
              <Button
                key={t}
                type="button"
                size="sm"
                variant={value === t ? "default" : "ghost"}
                className={cn(value !== t && "text-muted-foreground")}
                onClick={() => {
                  onChange(t);
                  setOpen(false);
                }}
                data-testid={`${testIdPrefix}-preset-${t.replace(":", "")}`}
              >
                {formatPreset(t)}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function EmployeeCombobox({
  value,
  onChange,
  employees,
}: {
  value: string;
  onChange: (val: string) => void;
  employees: UserType[];
}) {
  const [open, setOpen] = useState(false);
  const selected = employees.find((e) => e.id === value);

  return (
    <div className="space-y-2">
      <Label>Employee</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
            data-testid="select-employee"
          >
            {selected
              ? `${selected.firstName} ${selected.lastName}`
              : value === "unassigned"
                ? "Unassigned"
                : "Select employee (optional)"}
            <ChevronsUpDown className="ml-2 w-4 h-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
          <Command>
            <CommandInput placeholder="Search employees..." data-testid="input-search-employee" />
            <CommandList>
              <CommandEmpty>No employee found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="unassigned"
                  onSelect={() => {
                    onChange("unassigned");
                    setOpen(false);
                  }}
                  data-testid="option-employee-unassigned"
                >
                  <Check className={cn("mr-2 w-4 h-4", value === "unassigned" ? "opacity-100" : "opacity-0")} />
                  <div>
                    <p className="text-sm font-medium">Unassigned</p>
                    <p className="text-xs text-muted-foreground">No employee assigned</p>
                  </div>
                </CommandItem>
                {employees
                  .filter((e) => e.isActive)
                  .map((e) => (
                    <CommandItem
                      key={e.id}
                      value={`${e.firstName} ${e.lastName} ${e.email} ${e.position || ""}`}
                      onSelect={() => {
                        onChange(e.id);
                        setOpen(false);
                      }}
                      data-testid={`option-employee-${e.id}`}
                    >
                      <Check className={cn("mr-2 w-4 h-4", value === e.id ? "opacity-100" : "opacity-0")} />
                      <div>
                        <p className="text-sm font-medium">
                          {e.firstName} {e.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {e.position && <span>{e.position} &middot; </span>}
                          {e.email}
                        </p>
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function ShiftCard({
  shift,
  employees,
  locations,
  isCurrentDay,
  onClick,
}: {
  shift: Shift;
  employees: UserType[];
  locations: Location[];
  isCurrentDay: boolean;
  onClick: () => void;
}) {
  const emp = employees.find((e) => e.id === shift.userId);
  const loc = locations.find((l) => l.id === shift.locationId);
  const cfg = statusConfig[shift.status] || statusConfig.scheduled;

  return (
    <Card
      className={cn(
        "p-3 cursor-pointer hover-elevate transition-all",
        isCurrentDay && "border-primary/20"
      )}
      onClick={onClick}
      data-testid={`shift-card-${shift.id}`}
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6 flex-shrink-0">
            <AvatarFallback className="text-[10px]">
              {emp ? `${emp.firstName[0]}${emp.lastName[0]}` : "?"}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium truncate" data-testid={`text-shift-employee-${shift.id}`}>
            {emp ? `${emp.firstName} ${emp.lastName}` : "Unassigned"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3 h-3 flex-shrink-0" />
          <span data-testid={`text-shift-time-${shift.id}`}>
            {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
          </span>
        </div>
        {shift.position && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Briefcase className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{shift.position}</span>
          </div>
        )}
        {loc && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{loc.name}</span>
          </div>
        )}
        <Badge variant="secondary" className={cn("text-[10px]", cfg.badgeClass)} data-testid={`badge-shift-status-${shift.id}`}>
          {cfg.label}
        </Badge>
      </div>
    </Card>
  );
}

export default function SchedulePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [viewingShift, setViewingShift] = useState<Shift | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [mobileDayIndex, setMobileDayIndex] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  });
  const [formData, setFormData] = useState<ShiftFormData>({
    userId: "",
    locationId: "",
    startTime: "09:00",
    endTime: "17:00",
    position: "",
    notes: "",
    status: "scheduled",
  });

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const isManager = user?.role === "owner" || user?.role === "manager";

  const { data: shifts = [], isLoading: loadingShifts } = useQuery<Shift[]>({
    queryKey: ["/api/shifts"],
  });

  const { data: employees = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const createShift = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/shifts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      toast({ title: "Shift created successfully" });
      setShowFormDialog(false);
    },
    onError: (err: Error) => {
      toast({ title: "Could not create shift", description: err.message, variant: "destructive" });
    },
  });

  const updateShift = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiRequest("PATCH", `/api/shifts/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      toast({ title: "Shift updated successfully" });
      setShowFormDialog(false);
      setShowDetailDialog(false);
    },
    onError: (err: Error) => {
      toast({ title: "Could not update shift", description: err.message, variant: "destructive" });
    },
  });

  const deleteShift = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/shifts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      toast({ title: "Shift deleted" });
      setShowFormDialog(false);
      setShowDetailDialog(false);
    },
    onError: (err: Error) => {
      toast({ title: "Could not delete shift", description: err.message, variant: "destructive" });
    },
  });

  const openCreateDialog = (day: Date) => {
    setSelectedDate(day);
    setEditingShift(null);
    setFormData({
      userId: "",
      locationId: locations[0]?.id || "",
      startTime: "09:00",
      endTime: "17:00",
      position: "",
      notes: "",
      status: "scheduled",
    });
    setShowFormDialog(true);
  };

  const openEditDialog = (shift: Shift) => {
    setSelectedDate(new Date(shift.startTime));
    setEditingShift(shift);
    const st = new Date(shift.startTime);
    const et = new Date(shift.endTime);
    setFormData({
      userId: shift.userId || "",
      locationId: shift.locationId,
      startTime: `${st.getHours().toString().padStart(2, "0")}:${st.getMinutes().toString().padStart(2, "0")}`,
      endTime: `${et.getHours().toString().padStart(2, "0")}:${et.getMinutes().toString().padStart(2, "0")}`,
      position: shift.position || "",
      notes: shift.notes || "",
      status: shift.status,
    });
    setShowDetailDialog(false);
    setShowFormDialog(true);
  };

  const openDetailDialog = (shift: Shift) => {
    setViewingShift(shift);
    setShowDetailDialog(true);
  };

  const handleSave = () => {
    if (!selectedDate) return;
    if (!formData.locationId) {
      toast({ title: "Please select a location", variant: "destructive" });
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      toast({ title: "Please set both start and end times", variant: "destructive" });
      return;
    }
    const [startH, startM] = formData.startTime.split(":").map(Number);
    const [endH, endM] = formData.endTime.split(":").map(Number);
    if (endH < startH || (endH === startH && endM <= startM)) {
      toast({ title: "End time must be after start time", variant: "destructive" });
      return;
    }
    const startTime = setMinutes(setHours(new Date(selectedDate), startH), startM);
    const endTime = setMinutes(setHours(new Date(selectedDate), endH), endM);
    const payload = {
      organizationId: user!.organizationId,
      locationId: formData.locationId,
      userId: formData.userId === "unassigned" ? null : formData.userId || null,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      position: formData.position || null,
      notes: formData.notes || null,
      status: formData.status,
    };
    if (editingShift) {
      updateShift.mutate({ id: editingShift.id, ...payload });
    } else {
      createShift.mutate(payload);
    }
  };

  const shiftsByDay = useMemo(() => {
    const map = new Map<string, Shift[]>();
    weekDays.forEach((day) => {
      const key = format(day, "yyyy-MM-dd");
      map.set(
        key,
        shifts
          .filter((s) => isSameDay(new Date(s.startTime), day))
          .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      );
    });
    return map;
  }, [shifts, weekDays]);

  const totalWeekShifts = weekDays.reduce((sum, day) => {
    return sum + (shiftsByDay.get(format(day, "yyyy-MM-dd"))?.length || 0);
  }, 0);

  if (loadingShifts) {
    return (
      <div className="p-6 space-y-4" data-testid="schedule-loading">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  const renderDayColumn = (day: Date) => {
    const key = format(day, "yyyy-MM-dd");
    const dayShifts = shiftsByDay.get(key) || [];
    const isCurrentDay = isSameDay(day, new Date());

    return (
      <div key={key} data-testid={`day-column-${key}`} className="space-y-2">
        <div
          className={cn(
            "flex items-center justify-between gap-1 p-2 rounded-md",
            isCurrentDay ? "bg-primary/10" : "bg-accent/50"
          )}
        >
          <div className="text-center flex-1">
            <p className="text-xs text-muted-foreground uppercase font-medium">
              {format(day, "EEE")}
            </p>
            <p className={cn("text-xl font-bold", isCurrentDay && "text-primary")}>
              {format(day, "d")}
            </p>
          </div>
          {isManager && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => openCreateDialog(day)}
              data-testid={`button-add-shift-${key}`}
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="space-y-2 min-h-[120px]">
          {dayShifts.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-xs text-muted-foreground/40">No shifts</p>
            </div>
          ) : (
            dayShifts.map((shift) => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                employees={employees}
                locations={locations}
                isCurrentDay={isCurrentDay}
                onClick={() => openDetailDialog(shift)}
              />
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-4" data-testid="schedule-page">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-schedule-title">
            Schedule
          </h1>
          <p className="text-muted-foreground text-sm" data-testid="text-schedule-range">
            {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
            <span className="ml-2 text-muted-foreground/60">
              ({totalWeekShifts} shift{totalWeekShifts !== 1 ? "s" : ""})
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            data-testid="button-prev-week"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentWeek(new Date())}
            data-testid="button-today"
          >
            <CalIcon className="w-4 h-4 mr-2" />
            Today
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            data-testid="button-next-week"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Desktop: 7-column grid */}
      <div className="hidden lg:grid grid-cols-7 gap-3" style={{ minWidth: "1120px" }} data-testid="schedule-grid-desktop">
        {weekDays.map((day) => renderDayColumn(day))}
      </div>

      {/* Tablet: Scrollable horizontal week */}
      <div className="hidden md:block lg:hidden overflow-x-auto -mx-4 md:-mx-6 px-4 md:px-6" data-testid="schedule-grid-tablet">
        <div className="grid grid-cols-7 gap-3 min-w-[700px]">
          {weekDays.map((day) => renderDayColumn(day))}
        </div>
      </div>

      {/* Mobile: Single-day view with day selector tabs */}
      <div className="block md:hidden" data-testid="schedule-grid-mobile">
        <div className="flex items-center gap-1 overflow-x-auto pb-3" data-testid="mobile-day-tabs">
          {weekDays.map((day, idx) => {
            const isCurrentDay = isSameDay(day, new Date());
            const isSelected = mobileDayIndex === idx;
            return (
              <Button
                key={idx}
                variant={isSelected ? "default" : "ghost"}
                className={cn("flex-col gap-0 min-w-[48px]", isSelected && isCurrentDay && "ring-2 ring-primary/30")}
                onClick={() => setMobileDayIndex(idx)}
                data-testid={`button-mobile-day-${idx}`}
              >
                <span className="text-[10px] uppercase">{format(day, "EEE")}</span>
                <span className="text-sm font-bold">{format(day, "d")}</span>
              </Button>
            );
          })}
        </div>
        {renderDayColumn(weekDays[mobileDayIndex])}
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Shift Details</DialogTitle>
            <DialogDescription>
              {viewingShift && format(new Date(viewingShift.startTime), "EEEE, MMMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>
          {viewingShift &&
            (() => {
              const emp = employees.find((e) => e.id === viewingShift.userId);
              const loc = locations.find((l) => l.id === viewingShift.locationId);
              const cfg = statusConfig[viewingShift.status] || statusConfig.scheduled;
              return (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-md bg-accent/50">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>
                        {emp ? `${emp.firstName[0]}${emp.lastName[0]}` : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium" data-testid="text-detail-employee">
                        {emp ? `${emp.firstName} ${emp.lastName}` : "Unassigned"}
                      </p>
                      {emp?.position && (
                        <p className="text-xs text-muted-foreground">{emp.position}</p>
                      )}
                    </div>
                    <div className="ml-auto">
                      <Badge variant="secondary" className={cfg.badgeClass} data-testid="badge-detail-status">
                        {cfg.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> Time
                      </p>
                      <p className="text-sm font-medium" data-testid="text-detail-time">
                        {formatTime(viewingShift.startTime)} - {formatTime(viewingShift.endTime)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDuration(viewingShift.startTime, viewingShift.endTime)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" /> Location
                      </p>
                      <p className="text-sm font-medium" data-testid="text-detail-location">
                        {loc?.name || "Unknown"}
                      </p>
                      {loc?.address && (
                        <p className="text-xs text-muted-foreground">{loc.address}</p>
                      )}
                    </div>
                  </div>
                  {viewingShift.position && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Briefcase className="w-3 h-3" /> Position
                      </p>
                      <p className="text-sm font-medium" data-testid="text-detail-position">
                        {viewingShift.position}
                      </p>
                    </div>
                  )}
                  {viewingShift.notes && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <FileText className="w-3 h-3" /> Notes
                      </p>
                      <p className="text-sm" data-testid="text-detail-notes">
                        {viewingShift.notes}
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
          <DialogFooter className="gap-2 flex-wrap">
            {isManager && viewingShift && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => deleteShift.mutate(viewingShift.id)}
                  disabled={deleteShift.isPending}
                  data-testid="button-delete-shift-detail"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <div className="flex-1" />
                <Button
                  variant="outline"
                  onClick={() => openEditDialog(viewingShift)}
                  data-testid="button-edit-shift-detail"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </>
            )}
            {!isManager && <div className="flex-1" />}
            <Button variant="outline" onClick={() => setShowDetailDialog(false)} data-testid="button-close-detail">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingShift ? "Edit Shift" : "Create Shift"}</DialogTitle>
            <DialogDescription>
              {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <EmployeeCombobox
              value={formData.userId}
              onChange={(v) => setFormData((f) => ({ ...f, userId: v }))}
              employees={employees}
            />
            <div className="space-y-2">
              <Label>Location</Label>
              <Select
                value={formData.locationId}
                onValueChange={(v) => setFormData((f) => ({ ...f, locationId: v }))}
              >
                <SelectTrigger data-testid="select-location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <TimePicker
                value={formData.startTime}
                onChange={(v) => setFormData((f) => ({ ...f, startTime: v }))}
                label="Start Time"
                testIdPrefix="select-start-time"
              />
              <TimePicker
                value={formData.endTime}
                onChange={(v) => setFormData((f) => ({ ...f, endTime: v }))}
                label="End Time"
                testIdPrefix="select-end-time"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Position</Label>
                <Input
                  placeholder="e.g. Front Desk"
                  value={formData.position}
                  onChange={(e) => setFormData((f) => ({ ...f, position: e.target.value }))}
                  data-testid="input-position"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData((f) => ({ ...f, status: v }))}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Optional notes..."
                value={formData.notes}
                onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                className="resize-none"
                data-testid="input-notes"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 flex-wrap">
            {editingShift && (
              <Button
                variant="destructive"
                onClick={() => deleteShift.mutate(editingShift.id)}
                disabled={deleteShift.isPending}
                data-testid="button-delete-shift"
              >
                Delete
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setShowFormDialog(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createShift.isPending || updateShift.isPending}
              data-testid="button-save-shift"
            >
              {(createShift.isPending || updateShift.isPending) && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              {editingShift ? "Update Shift" : "Create Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
