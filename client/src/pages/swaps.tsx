import { useState } from "react";
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
  ArrowLeftRight,
  Plus,
  Check,
  X,
  Loader2,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import type {
  ShiftSwapRequest,
  Shift,
  User as UserType,
} from "@shared/schema";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Pending", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  denied: { label: "Denied", variant: "destructive" },
};

export default function SwapsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const isManager = user?.role === "owner" || user?.role === "manager";

  const [formData, setFormData] = useState({
    shiftId: "",
    targetUserId: "",
    reason: "",
  });

  const { data: swaps = [], isLoading } = useQuery<ShiftSwapRequest[]>({
    queryKey: ["/api/swaps"],
  });

  const { data: shifts = [] } = useQuery<Shift[]>({
    queryKey: ["/api/shifts"],
  });

  const { data: employees = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const createSwap = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/swaps", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/swaps"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "Swap request submitted" });
      setShowDialog(false);
    },
    onError: (err: Error) => {
      toast({
        title: "Could not submit swap request",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const updateSwap = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: string;
    }) => {
      const res = await apiRequest("PATCH", `/api/swaps/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/swaps"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "Swap request updated" });
    },
    onError: (err: Error) => {
      toast({
        title: "Could not update swap request",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!formData.shiftId) {
      toast({ title: "Please select a shift to swap", variant: "destructive" });
      return;
    }
    if (!formData.targetUserId) {
      toast({ title: "Please select an employee to swap with", variant: "destructive" });
      return;
    }
    createSwap.mutate({
      organizationId: user!.organizationId,
      shiftId: formData.shiftId,
      requesterId: user!.id,
      targetUserId: formData.targetUserId,
      reason: formData.reason || null,
      status: "pending",
    });
  };

  const myShifts = shifts.filter((s) => s.userId === user?.id);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-swaps-title">
            Shift Swaps
          </h1>
          <p className="text-muted-foreground text-sm">
            Request and manage shift swaps
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData({ shiftId: "", targetUserId: "", reason: "" });
            setShowDialog(true);
          }}
          data-testid="button-request-swap"
        >
          <Plus className="w-4 h-4 mr-2" />
          Request Swap
        </Button>
      </div>

      {swaps.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <ArrowLeftRight className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-medium mb-1">No swap requests</h3>
            <p className="text-sm text-muted-foreground">
              Swap requests will appear here when employees request to
              exchange shifts.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {swaps.map((swap) => {
            const shift = shifts.find((s) => s.id === swap.shiftId);
            const requester = employees.find(
              (e) => e.id === swap.requesterId
            );
            const target = employees.find(
              (e) => e.id === swap.targetUserId
            );
            const cfg =
              statusConfig[swap.status] || statusConfig.pending;

            return (
              <Card
                key={swap.id}
                className="p-4"
                data-testid={`swap-card-${swap.id}`}
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-md bg-accent flex items-center justify-center flex-shrink-0">
                      <ArrowLeftRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">
                        {requester
                          ? `${requester.firstName} ${requester.lastName}`
                          : "Unknown"}{" "}
                        wants to swap with{" "}
                        {target
                          ? `${target.firstName} ${target.lastName}`
                          : "Unknown"}
                      </p>
                      {shift && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {format(
                              new Date(shift.startTime),
                              "MMM d, h:mm a"
                            )}{" "}
                            -{" "}
                            {format(
                              new Date(shift.endTime),
                              "h:mm a"
                            )}
                          </span>
                        </div>
                      )}
                      {swap.reason && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {swap.reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={cfg.variant}
                      className="text-xs"
                    >
                      {cfg.label}
                    </Badge>
                    {isManager && swap.status === "pending" && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            updateSwap.mutate({
                              id: swap.id,
                              status: "approved",
                            })
                          }
                          disabled={updateSwap.isPending}
                          data-testid={`button-approve-swap-${swap.id}`}
                        >
                          <Check className="w-4 h-4 text-emerald-600" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            updateSwap.mutate({
                              id: swap.id,
                              status: "denied",
                            })
                          }
                          disabled={updateSwap.isPending}
                          data-testid={`button-deny-swap-${swap.id}`}
                        >
                          <X className="w-4 h-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Shift Swap</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Your Shift</Label>
              <Select
                value={formData.shiftId}
                onValueChange={(v) =>
                  setFormData((f) => ({ ...f, shiftId: v }))
                }
              >
                <SelectTrigger data-testid="select-swap-shift">
                  <SelectValue placeholder="Select a shift" />
                </SelectTrigger>
                <SelectContent>
                  {myShifts.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {format(new Date(s.startTime), "MMM d, h:mm a")} -{" "}
                      {format(new Date(s.endTime), "h:mm a")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Swap With</Label>
              <Select
                value={formData.targetUserId}
                onValueChange={(v) =>
                  setFormData((f) => ({ ...f, targetUserId: v }))
                }
              >
                <SelectTrigger data-testid="select-swap-target">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter(
                      (e) => e.id !== user?.id && e.isActive
                    )
                    .map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.firstName} {e.lastName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                placeholder="Why do you need to swap?"
                value={formData.reason}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, reason: e.target.value }))
                }
                className="resize-none"
                data-testid="input-swap-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                createSwap.isPending ||
                !formData.shiftId ||
                !formData.targetUserId
              }
              data-testid="button-submit-swap"
            >
              {createSwap.isPending && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
