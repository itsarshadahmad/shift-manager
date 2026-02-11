import { useState } from "react";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Users,
  Search,
  Loader2,
  Mail,
  Phone,
  Briefcase,
  DollarSign,
} from "lucide-react";
import type { User as UserType } from "@shared/schema";

export default function EmployeesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isManager = user?.role === "owner" || user?.role === "manager";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "employee",
    position: "",
    hourlyRate: "",
  });

  const { data: employees = [], isLoading } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const createUser = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/users", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Employee added" });
      setShowDialog(false);
    },
    onError: (err: Error) => {
      toast({
        title: "Could not add employee",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!formData.firstName || !formData.lastName) {
      toast({ title: "Please enter the employee's first and last name", variant: "destructive" });
      return;
    }
    if (!formData.email) {
      toast({ title: "Please enter the employee's email address", variant: "destructive" });
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    createUser.mutate({
      organizationId: user!.organizationId,
      email: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone || null,
      role: formData.role,
      position: formData.position || null,
      hourlyRate: formData.hourlyRate || null,
    });
  };

  const filtered = employees.filter((e) => {
    const q = searchQuery.toLowerCase();
    return (
      e.firstName.toLowerCase().includes(q) ||
      e.lastName.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      (e.position || "").toLowerCase().includes(q)
    );
  });

  const roleColors: Record<string, string> = {
    owner: "default",
    manager: "secondary",
    employee: "secondary",
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-bold"
            data-testid="text-employees-title"
          >
            Employees
          </h1>
          <p className="text-muted-foreground text-sm">
            {employees.length} team member{employees.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isManager && (
          <Button
            onClick={() => {
              setFormData({
                email: "",
                password: "",
                firstName: "",
                lastName: "",
                phone: "",
                role: "employee",
                position: "",
                hourlyRate: "",
              });
              setShowDialog(true);
            }}
            data-testid="button-add-employee"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search employees..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search-employees"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-medium mb-1">No employees found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "Try a different search term."
                : "Add your first employee to get started."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((emp) => (
            <Card
              key={emp.id}
              className="p-5"
              data-testid={`employee-card-${emp.id}`}
            >
              <div className="flex items-start gap-4">
                <Avatar className="w-11 h-11">
                  <AvatarFallback className="text-sm bg-primary/10 text-primary">
                    {emp.firstName[0]}
                    {emp.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">
                      {emp.firstName} {emp.lastName}
                    </p>
                    <Badge
                      variant={
                        emp.role === "owner" ? "default" : "secondary"
                      }
                      className="text-xs capitalize"
                    >
                      {emp.role}
                    </Badge>
                    {!emp.isActive && (
                      <Badge variant="destructive" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                    {emp.phone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span>{emp.phone}</span>
                      </div>
                    )}
                    {emp.position && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Briefcase className="w-3 h-3 flex-shrink-0" />
                        <span>{emp.position}</span>
                      </div>
                    )}
                    {emp.hourlyRate && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <DollarSign className="w-3 h-3 flex-shrink-0" />
                        <span>${emp.hourlyRate}/hr</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      firstName: e.target.value,
                    }))
                  }
                  data-testid="input-emp-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      lastName: e.target.value,
                    }))
                  }
                  data-testid="input-emp-last-name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, email: e.target.value }))
                }
                data-testid="input-emp-email"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Min 6 characters"
                value={formData.password}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, password: e.target.value }))
                }
                data-testid="input-emp-password"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) =>
                    setFormData((f) => ({ ...f, role: v }))
                  }
                >
                  <SelectTrigger data-testid="select-emp-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hourly Rate</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.hourlyRate}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      hourlyRate: e.target.value,
                    }))
                  }
                  data-testid="input-emp-rate"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Position</Label>
                <Input
                  placeholder="e.g. Server, Cook"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      position: e.target.value,
                    }))
                  }
                  data-testid="input-emp-position"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  placeholder="Optional"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, phone: e.target.value }))
                  }
                  data-testid="input-emp-phone"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                createUser.isPending ||
                !formData.email ||
                !formData.firstName ||
                !formData.lastName ||
                !formData.password
              }
              data-testid="button-save-employee"
            >
              {createUser.isPending && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Add Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
