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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  MessageSquare,
  Loader2,
  Send,
  Megaphone,
  Mail,
} from "lucide-react";
import { format } from "date-fns";
import type { Message, User as UserType } from "@shared/schema";

export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [tab, setTab] = useState("inbox");

  const [formData, setFormData] = useState({
    recipientId: "",
    subject: "",
    body: "",
    isBroadcast: false,
  });

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  const { data: employees = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const sendMessage = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/messages", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      toast({ title: "Message sent" });
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

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/messages/${id}`, { isRead: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
  });

  const handleSend = () => {
    sendMessage.mutate({
      organizationId: user!.organizationId,
      senderId: user!.id,
      recipientId: formData.isBroadcast ? null : formData.recipientId,
      subject: formData.subject,
      body: formData.body,
      isBroadcast: formData.isBroadcast,
    });
  };

  const inbox = messages.filter(
    (m) => m.recipientId === user?.id || m.isBroadcast
  );
  const sent = messages.filter((m) => m.senderId === user?.id);
  const displayMessages = tab === "inbox" ? inbox : sent;

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-2xl font-bold"
            data-testid="text-messages-title"
          >
            Messages
          </h1>
          <p className="text-muted-foreground text-sm">
            Team communication
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData({
              recipientId: "",
              subject: "",
              body: "",
              isBroadcast: false,
            });
            setShowDialog(true);
          }}
          data-testid="button-compose"
        >
          <Plus className="w-4 h-4 mr-2" />
          Compose
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="inbox" data-testid="tab-inbox">
            <Mail className="w-4 h-4 mr-2" />
            Inbox ({inbox.filter((m) => !m.isRead).length})
          </TabsTrigger>
          <TabsTrigger value="sent" data-testid="tab-sent">
            <Send className="w-4 h-4 mr-2" />
            Sent
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {displayMessages.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-medium mb-1">
              {tab === "inbox" ? "No messages" : "No sent messages"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {tab === "inbox"
                ? "Your inbox is empty."
                : "You haven't sent any messages yet."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {displayMessages.map((msg) => {
            const sender = employees.find((e) => e.id === msg.senderId);
            const recipient = employees.find(
              (e) => e.id === msg.recipientId
            );
            const isUnread = !msg.isRead && tab === "inbox";

            return (
              <Card
                key={msg.id}
                className={`p-4 cursor-pointer hover-elevate ${isUnread ? "border-primary/30" : ""}`}
                onClick={() => {
                  if (isUnread) markRead.mutate(msg.id);
                }}
                data-testid={`message-card-${msg.id}`}
              >
                <div className="flex items-start gap-4">
                  <Avatar className="w-9 h-9 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {sender
                        ? `${sender.firstName[0]}${sender.lastName[0]}`
                        : "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm ${isUnread ? "font-bold" : "font-medium"}`}
                      >
                        {tab === "inbox"
                          ? sender
                            ? `${sender.firstName} ${sender.lastName}`
                            : "Unknown"
                          : recipient
                            ? `To: ${recipient.firstName} ${recipient.lastName}`
                            : "Broadcast"}
                      </span>
                      {msg.isBroadcast && (
                        <Badge variant="secondary" className="text-xs">
                          <Megaphone className="w-3 h-3 mr-1" />
                          Broadcast
                        </Badge>
                      )}
                      {isUnread && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p
                      className={`text-sm truncate ${isUnread ? "font-medium" : ""}`}
                    >
                      {msg.subject}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {msg.body}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Compose Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="broadcast"
                checked={formData.isBroadcast}
                onCheckedChange={(checked) =>
                  setFormData((f) => ({
                    ...f,
                    isBroadcast: !!checked,
                    recipientId: "",
                  }))
                }
                data-testid="checkbox-broadcast"
              />
              <Label htmlFor="broadcast" className="text-sm">
                Send as broadcast to all team members
              </Label>
            </div>
            {!formData.isBroadcast && (
              <div className="space-y-2">
                <Label>To</Label>
                <Select
                  value={formData.recipientId}
                  onValueChange={(v) =>
                    setFormData((f) => ({ ...f, recipientId: v }))
                  }
                >
                  <SelectTrigger data-testid="select-recipient">
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees
                      .filter((e) => e.id !== user?.id)
                      .map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.firstName} {e.lastName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                placeholder="Message subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, subject: e.target.value }))
                }
                data-testid="input-msg-subject"
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Write your message..."
                value={formData.body}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, body: e.target.value }))
                }
                className="resize-none min-h-[120px]"
                data-testid="input-msg-body"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={
                sendMessage.isPending ||
                !formData.subject ||
                !formData.body ||
                (!formData.isBroadcast && !formData.recipientId)
              }
              data-testid="button-send-message"
            >
              {sendMessage.isPending && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
