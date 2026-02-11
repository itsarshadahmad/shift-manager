import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Pencil, Lock, Mail, Phone, Briefcase, User } from "lucide-react";

export default function ProfilePage() {
  const { user, refetchUser } = useAuth();
  const { toast } = useToast();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    position: user?.position || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const updateProfile = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/users/${user!.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      if (refetchUser) refetchUser();
      toast({ title: "Profile updated" });
      setShowEditDialog(false);
    },
    onError: (err: Error) => {
      toast({ title: "Could not update profile", description: err.message, variant: "destructive" });
    },
  });

  const changePassword = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/auth/change-password", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password changed successfully" });
      setShowPasswordDialog(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError: (err: Error) => {
      toast({ title: "Could not change password", description: err.message, variant: "destructive" });
    },
  });

  const openEditDialog = () => {
    setProfileData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      position: user?.position || "",
    });
    setShowEditDialog(true);
  };

  const handleSaveProfile = () => {
    if (!profileData.firstName || !profileData.lastName) {
      toast({ title: "Please enter your name", variant: "destructive" });
      return;
    }
    if (!profileData.email) {
      toast({ title: "Please enter your email", variant: "destructive" });
      return;
    }
    updateProfile.mutate({
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      email: profileData.email,
      phone: profileData.phone || null,
      position: profileData.position || null,
    });
  };

  const handleChangePassword = () => {
    if (!passwordData.currentPassword) {
      toast({ title: "Please enter your current password", variant: "destructive" });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast({ title: "New password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "New passwords do not match", variant: "destructive" });
      return;
    }
    changePassword.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  if (!user) return null;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-profile-title">Profile</h1>
        <p className="text-muted-foreground text-sm">Manage your account details</p>
      </div>

      <Card className="p-6">
        <div className="flex items-start gap-5">
          <Avatar className="w-16 h-16">
            <AvatarFallback className="text-lg bg-primary/10 text-primary">
              {user.firstName[0]}{user.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-semibold">{user.firstName} {user.lastName}</h2>
              <Badge variant="default" className="capitalize">{user.role}</Badge>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span data-testid="text-profile-email">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span data-testid="text-profile-phone">{user.phone}</span>
                </div>
              )}
              {user.position && (
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <span data-testid="text-profile-position">{user.position}</span>
                </div>
              )}
              {user.hourlyRate && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="w-4 h-4 flex items-center justify-center">$</span>
                  <span>{user.hourlyRate}/hr</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6 flex-wrap">
          <Button onClick={openEditDialog} variant="outline" data-testid="button-edit-profile">
            <Pencil className="w-4 h-4 mr-2" />
            Edit Profile
          </Button>
          <Button onClick={() => setShowPasswordDialog(true)} variant="outline" data-testid="button-change-password">
            <Lock className="w-4 h-4 mr-2" />
            Change Password
          </Button>
        </div>
      </Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your personal details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={profileData.firstName} onChange={(e) => setProfileData((f) => ({ ...f, firstName: e.target.value }))} data-testid="input-profile-first-name" />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={profileData.lastName} onChange={(e) => setProfileData((f) => ({ ...f, lastName: e.target.value }))} data-testid="input-profile-last-name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={profileData.email} onChange={(e) => setProfileData((f) => ({ ...f, email: e.target.value }))} data-testid="input-profile-email" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="Optional" value={profileData.phone} onChange={(e) => setProfileData((f) => ({ ...f, phone: e.target.value }))} data-testid="input-profile-phone" />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Input placeholder="Optional" value={profileData.position} onChange={(e) => setProfileData((f) => ({ ...f, position: e.target.value }))} data-testid="input-profile-position" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveProfile} disabled={updateProfile.isPending} data-testid="button-save-profile">
              {updateProfile.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your current password and choose a new one</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData((f) => ({ ...f, currentPassword: e.target.value }))} data-testid="input-current-password" />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" placeholder="At least 6 characters" value={passwordData.newPassword} onChange={(e) => setPasswordData((f) => ({ ...f, newPassword: e.target.value }))} data-testid="input-new-password" />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData((f) => ({ ...f, confirmPassword: e.target.value }))} data-testid="input-confirm-password" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
            <Button onClick={handleChangePassword} disabled={changePassword.isPending} data-testid="button-save-password">
              {changePassword.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
