import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalIcon,
  Loader2,
  GripVertical,
  AlertTriangle,
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
} from "date-fns";
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

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function ShiftCard({
  shift,
  employees,
  onClick,
}: {
  shift: Shift;
  employees: UserType[];
  onClick: () => void;
}) {
  const emp = employees.find((e) => e.id === shift.userId);
  const startH = new Date(shift.startTime).getHours();
  const startM = new Date(shift.startTime).getMinutes();
  const endH = new Date(shift.endTime).getHours();
  const endM = new Date(shift.endTime).getMinutes();

  const statusColors: Record<string, string> = {
    scheduled: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    published: "bg-primary/15 text-primary",
    completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    cancelled: "bg-destructive/15 text-destructive",
  };

  return (
    <div
      onClick={onClick}
      className="p-2 rounded-md text-xs cursor-pointer border border-border hover-elevate transition-colors"
      style={{
        backgroundColor: `hsl(var(--${shift.status === "published" ? "primary" : "accent"}) / 0.08)`,
      }}
      data-testid={`shift-card-${shift.id}`}
    >
      <div className="flex items-center gap-1 mb-1">
        <GripVertical className="w-3 h-3 text-muted-foreground/50" />
        <span className="font-medium truncate">
          {emp ? `${emp.firstName} ${emp.lastName[0]}.` : "Unassigned"}
        </span>
      </div>
      <p className="text-muted-foreground">
        {`${startH}:${startM.toString().padStart(2, "0")} - ${endH}:${endM.toString().padStart(2, "0")}`}
      </p>
      {shift.position && (
        <p className="text-muted-foreground truncate mt-0.5">
          {shift.position}
        </p>
      )}
    </div>
  );
}

export default function SchedulePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showDialog, setShowDialog] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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
      setShowDialog(false);
    },
    onError: (err: Error) => {
      toast({
        title: "Could not create shift",
        description: err.message,
        variant: "destructive",
      });
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
      setShowDialog(false);
    },
    onError: (err: Error) => {
      toast({
        title: "Could not update shift",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteShift = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/shifts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      toast({ title: "Shift deleted" });
      setShowDialog(false);
    },
    onError: (err: Error) => {
      toast({
        title: "Could not delete shift",
        description: err.message,
        variant: "destructive",
      });
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
    setShowDialog(true);
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
    setShowDialog(true);
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

    const startTime = setMinutes(
      setHours(new Date(selectedDate), startH),
      startM
    );
    const endTime = setMinutes(
      setHours(new Date(selectedDate), endH),
      endM
    );

    const payload = {
      organizationId: user!.organizationId,
      locationId: formData.locationId,
      userId: formData.userId || null,
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
        shifts.filter((s) => isSameDay(new Date(s.startTime), day))
          .sort(
            (a, b) =>
              new Date(a.startTime).getTime() -
              new Date(b.startTime).getTime()
          )
      );
    });
    return map;
  }, [shifts, weekDays]);

  const isManager = user?.role === "owner" || user?.role === "manager";

  if (loadingShifts) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-schedule-title">
            Schedule
          </h1>
          <p className="text-muted-foreground text-sm">
            {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
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

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayShifts = shiftsByDay.get(key) || [];
          const isCurrentDay = isSameDay(day, new Date());

          return (
            <Card
              key={key}
              className={`min-h-[200px] p-3 ${isCurrentDay ? "ring-2 ring-primary/30" : ""}`}
              data-testid={`day-column-${key}`}
            >
              <div className="flex items-center justify-between gap-1 mb-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">
                    {format(day, "EEE")}
                  </p>
                  <p
                    className={`text-lg font-bold ${isCurrentDay ? "text-primary" : ""}`}
                  >
                    {format(day, "d")}
                  </p>
                </div>
                {isManager && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-7 h-7"
                    onClick={() => openCreateDialog(day)}
                    data-testid={`button-add-shift-${key}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
              <div className="space-y-1.5">
                {dayShifts.map((shift) => (
                  <ShiftCard
                    key={shift.id}
                    shift={shift}
                    employees={employees}
                    onClick={() => isManager && openEditDialog(shift)}
                  />
                ))}
                {dayShifts.length === 0 && (
                  <p className="text-xs text-muted-foreground/50 text-center py-4">
                    No shifts
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingShift ? "Edit Shift" : "Create Shift"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDate && (
              <p className="text-sm text-muted-foreground">
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </p>
            )}
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select
                value={formData.userId}
                onValueChange={(v) =>
                  setFormData((f) => ({ ...f, userId: v }))
                }
              >
                <SelectTrigger data-testid="select-employee">
                  <SelectValue placeholder="Select employee (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {employees
                    .filter((e) => e.isActive)
                    .map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.firstName} {e.lastName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Select
                value={formData.locationId}
                onValueChange={(v) =>
                  setFormData((f) => ({ ...f, locationId: v }))
                }
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
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, startTime: e.target.value }))
                  }
                  data-testid="input-start-time"
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, endTime: e.target.value }))
                  }
                  data-testid="input-end-time"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <Input
                placeholder="e.g. Front Desk, Kitchen"
                value={formData.position}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, position: e.target.value }))
                }
                data-testid="input-position"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) =>
                  setFormData((f) => ({ ...f, status: v }))
                }
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
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Optional notes..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, notes: e.target.value }))
                }
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
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              data-testid="button-cancel"
            >
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
              {editingShift ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
