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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  CalendarOff,
  Check,
  X,
  Loader2,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import type { TimeOffRequest, User as UserType } from "@shared/schema";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Pending", variant: "secondary" },
  approved: { label: "Approved", variant: "default" },
  denied: { label: "Denied", variant: "destructive" },
};

const typeLabels: Record<string, string> = {
  vacation: "Vacation",
  sick: "Sick Leave",
  personal: "Personal",
  unpaid: "Unpaid Leave",
};

export default function TimeOffPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [tab, setTab] = useState("all");
  const isManager = user?.role === "owner" || user?.role === "manager";

  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    type: "vacation",
    reason: "",
  });

  const { data: requests = [], isLoading } = useQuery<TimeOffRequest[]>({
    queryKey: ["/api/time-off"],
  });

  const { data: employees = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const createRequest = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/time-off", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-off"] });
      toast({ title: "Time-off request submitted" });
      setShowDialog(false);
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: string;
    }) => {
      const res = await apiRequest("PATCH", `/api/time-off/${id}`, {
        status,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-off"] });
      toast({ title: "Request updated" });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    createRequest.mutate({
      organizationId: user!.organizationId,
      userId: user!.id,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      type: formData.type,
      reason: formData.reason || null,
      status: "pending",
    });
  };

  const filteredRequests =
    tab === "all"
      ? requests
      : tab === "mine"
        ? requests.filter((r) => r.userId === user?.id)
        : requests.filter((r) => r.status === tab);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-time-off-title">
            Time Off
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage time-off requests
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData({
              startDate: "",
              endDate: "",
              type: "vacation",
              reason: "",
            });
            setShowDialog(true);
          }}
          data-testid="button-request-time-off"
        >
          <Plus className="w-4 h-4 mr-2" />
          Request Time Off
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">
            All
          </TabsTrigger>
          <TabsTrigger value="mine" data-testid="tab-mine">
            My Requests
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            Approved
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredRequests.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <CalendarOff className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-medium mb-1">No requests found</h3>
            <p className="text-sm text-muted-foreground">
              {tab === "mine"
                ? "You haven't submitted any time-off requests yet."
                : "No time-off requests match this filter."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const emp = employees.find((e) => e.id === req.userId);
            const cfg = statusConfig[req.status] || statusConfig.pending;

            return (
              <Card
                key={req.id}
                className="p-4"
                data-testid={`time-off-card-${req.id}`}
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-md bg-accent flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">
                        {emp
                          ? `${emp.firstName} ${emp.lastName}`
                          : "Unknown"}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(req.startDate), "MMM d, yyyy")} -{" "}
                          {format(new Date(req.endDate), "MMM d, yyyy")}
                        </span>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {typeLabels[req.type] || req.type}
                        </Badge>
                      </div>
                      {req.reason && (
                        <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">
                          {req.reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={cfg.variant} className="text-xs">
                      {cfg.label}
                    </Badge>
                    {isManager && req.status === "pending" && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            updateStatus.mutate({
                              id: req.id,
                              status: "approved",
                            })
                          }
                          disabled={updateStatus.isPending}
                          data-testid={`button-approve-${req.id}`}
                        >
                          <Check className="w-4 h-4 text-emerald-600" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            updateStatus.mutate({
                              id: req.id,
                              status: "denied",
                            })
                          }
                          disabled={updateStatus.isPending}
                          data-testid={`button-deny-${req.id}`}
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
            <DialogTitle>Request Time Off</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.type}
                onValueChange={(v) =>
                  setFormData((f) => ({ ...f, type: v }))
                }
              >
                <SelectTrigger data-testid="select-time-off-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      startDate: e.target.value,
                    }))
                  }
                  data-testid="input-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      endDate: e.target.value,
                    }))
                  }
                  data-testid="input-end-date"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                placeholder="Briefly describe your reason..."
                value={formData.reason}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, reason: e.target.value }))
                }
                className="resize-none"
                data-testid="input-reason"
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
                createRequest.isPending ||
                !formData.startDate ||
                !formData.endDate
              }
              data-testid="button-submit-request"
            >
              {createRequest.isPending && (
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
