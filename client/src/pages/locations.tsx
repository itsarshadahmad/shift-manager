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
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, MapPin, Loader2, Globe, Building2, Pencil } from "lucide-react";
import type { Location } from "@shared/schema";

export default function LocationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const isManager = user?.role === "owner" || user?.role === "manager";

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    timezone: "America/New_York",
  });

  const { data: locations = [], isLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const createLocation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/locations", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({ title: "Location added" });
      setShowDialog(false);
    },
    onError: (err: Error) => {
      toast({ title: "Could not add location", description: err.message, variant: "destructive" });
    },
  });

  const updateLocation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiRequest("PATCH", `/api/locations/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({ title: "Location updated" });
      setShowDialog(false);
    },
    onError: (err: Error) => {
      toast({ title: "Could not update location", description: err.message, variant: "destructive" });
    },
  });

  const openCreateDialog = () => {
    setEditingLocation(null);
    setFormData({ name: "", address: "", timezone: "America/New_York" });
    setShowDialog(true);
  };

  const openEditDialog = (loc: Location) => {
    setEditingLocation(loc);
    setFormData({
      name: loc.name,
      address: loc.address || "",
      timezone: loc.timezone,
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      toast({ title: "Please enter a location name", variant: "destructive" });
      return;
    }
    if (editingLocation) {
      updateLocation.mutate({
        id: editingLocation.id,
        name: formData.name,
        address: formData.address || null,
        timezone: formData.timezone,
      });
    } else {
      createLocation.mutate({
        organizationId: user!.organizationId,
        name: formData.name,
        address: formData.address || null,
        timezone: formData.timezone,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-locations-title">
            Locations
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage your work locations
          </p>
        </div>
        {isManager && (
          <Button onClick={openCreateDialog} data-testid="button-add-location">
            <Plus className="w-4 h-4 mr-2" />
            Add Location
          </Button>
        )}
      </div>

      {locations.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <MapPin className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-medium mb-1">No locations yet</h3>
            <p className="text-sm text-muted-foreground">
              Add your first location to start scheduling shifts.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc) => (
            <Card key={loc.id} className="p-5" data-testid={`location-card-${loc.id}`}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm">{loc.name}</h3>
                    <Badge variant={loc.isActive ? "default" : "secondary"} className="text-xs">
                      {loc.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {loc.address && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span>{loc.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Globe className="w-3 h-3 flex-shrink-0" />
                    <span>{loc.timezone}</span>
                  </div>
                </div>
                {isManager && (
                  <Button size="icon" variant="ghost" onClick={() => openEditDialog(loc)} data-testid={`button-edit-location-${loc.id}`}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLocation ? "Edit Location" : "Add Location"}</DialogTitle>
            <DialogDescription>
              {editingLocation ? `Update details for ${editingLocation.name}` : "Add a new work location"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="e.g. Main Office, Downtown Branch" value={formData.name} onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))} data-testid="input-location-name" />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input placeholder="123 Main St, City, State" value={formData.address} onChange={(e) => setFormData((f) => ({ ...f, address: e.target.value }))} data-testid="input-location-address" />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Input placeholder="America/New_York" value={formData.timezone} onChange={(e) => setFormData((f) => ({ ...f, timezone: e.target.value }))} data-testid="input-location-timezone" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={createLocation.isPending || updateLocation.isPending || !formData.name}
              data-testid="button-save-location"
            >
              {(createLocation.isPending || updateLocation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingLocation ? "Save Changes" : "Add Location"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
