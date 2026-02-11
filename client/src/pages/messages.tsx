import { useState, useEffect, useRef } from "react";
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
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  MessageSquare,
  Loader2,
  Send,
  Megaphone,
  Mail,
  ArrowLeft,
  Reply,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Message, User as UserType } from "@shared/schema";

function getInitials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "??";
}

interface ConversationThread {
  partnerId: string | null;
  partner: UserType | undefined;
  isBroadcast: boolean;
  lastMessage: Message;
  messages: Message[];
  unreadCount: number;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showComposeDialog, setShowComposeDialog] = useState(false);
  const [selectedThread, setSelectedThread] = useState<ConversationThread | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    recipientId: "",
    subject: "",
    body: "",
    isBroadcast: false,
  });

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    refetchInterval: 10000,
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
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: "Message sent" });
      setShowComposeDialog(false);
      setReplyBody("");
    },
    onError: (err: Error) => {
      toast({
        title: "Could not send message",
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

  const threads = buildThreads(messages, employees, user);

  const filteredThreads = searchQuery
    ? threads.filter((t) => {
        const name = t.isBroadcast
          ? "Broadcast"
          : t.partner
            ? `${t.partner.firstName} ${t.partner.lastName}`
            : "";
        return (
          name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.lastMessage.subject.toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
    : threads;

  useEffect(() => {
    if (selectedThread) {
      const updated = threads.find((t) =>
        t.isBroadcast
          ? selectedThread.isBroadcast
          : t.partnerId === selectedThread.partnerId
      );
      if (updated) {
        setSelectedThread(updated);
        updated.messages.forEach((msg) => {
          if (!msg.isRead && msg.recipientId === user?.id) {
            markRead.mutate(msg.id);
          }
        });
      }
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedThread?.messages.length]);

  const handleSend = () => {
    if (!formData.subject || !formData.body) {
      toast({ title: "Please fill in subject and message", variant: "destructive" });
      return;
    }
    if (!formData.isBroadcast && !formData.recipientId) {
      toast({ title: "Please select a recipient", variant: "destructive" });
      return;
    }
    sendMessage.mutate({
      recipientId: formData.isBroadcast ? null : formData.recipientId,
      subject: formData.subject,
      body: formData.body,
      isBroadcast: formData.isBroadcast,
    });
  };

  const handleReply = () => {
    if (!replyBody.trim() || !selectedThread) return;
    sendMessage.mutate({
      recipientId: selectedThread.isBroadcast ? null : selectedThread.partnerId,
      subject: `Re: ${selectedThread.lastMessage.subject.replace(/^Re: /i, "")}`,
      body: replyBody,
      isBroadcast: selectedThread.isBroadcast,
    });
  };

  const openThread = (thread: ConversationThread) => {
    setSelectedThread(thread);
    thread.messages.forEach((msg) => {
      if (!msg.isRead && msg.recipientId === user?.id) {
        markRead.mutate(msg.id);
      }
    });
  };

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

  if (selectedThread) {
    const partner = selectedThread.partner;
    const threadSubject = selectedThread.lastMessage.subject.replace(/^Re: /i, "");

    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border flex items-center gap-3 sticky top-0 bg-background z-10">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setSelectedThread(null)}
            data-testid="button-back-to-messages"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Avatar className="w-9 h-9 flex-shrink-0">
            <AvatarFallback className="text-xs">
              {selectedThread.isBroadcast
                ? "BC"
                : getInitials(partner?.firstName, partner?.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">
              {selectedThread.isBroadcast
                ? "Team Broadcast"
                : partner
                  ? `${partner.firstName} ${partner.lastName}`
                  : "Unknown"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {threadSubject}
            </p>
          </div>
          {selectedThread.isBroadcast && (
            <Badge variant="secondary" className="text-xs flex-shrink-0">
              <Megaphone className="w-3 h-3 mr-1" />
              Broadcast
            </Badge>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {selectedThread.messages
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map((msg) => {
              const isMine = msg.senderId === user?.id;
              const sender = employees.find((e) => e.id === msg.senderId);
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    isMine ? "flex-row-reverse" : "flex-row"
                  )}
                  data-testid={`message-bubble-${msg.id}`}
                >
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {getInitials(sender?.firstName, sender?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "max-w-[70%] rounded-md p-3",
                      isMine
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-medium">
                        {isMine ? "You" : sender ? `${sender.firstName} ${sender.lastName}` : "Unknown"}
                      </span>
                      <span className={cn("text-xs", isMine ? "text-primary-foreground/60" : "text-muted-foreground")}>
                        {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                  </div>
                </div>
              );
            })}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Type your reply..."
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleReply();
                }
              }}
              className="flex-1"
              data-testid="input-reply"
            />
            <Button
              onClick={handleReply}
              disabled={sendMessage.isPending || !replyBody.trim()}
              data-testid="button-send-reply"
            >
              {sendMessage.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
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
            setShowComposeDialog(true);
          }}
          data-testid="button-compose"
        >
          <Plus className="w-4 h-4 mr-2" />
          Compose
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search-messages"
        />
      </div>

      {filteredThreads.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-medium mb-1">
              {searchQuery ? "No messages match your search" : "No conversations yet"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "Try a different search term."
                : "Start a conversation by clicking Compose."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredThreads.map((thread, idx) => {
            const sender = employees.find(
              (e) => e.id === thread.lastMessage.senderId
            );
            const hasUnread = thread.unreadCount > 0;

            return (
              <Card
                key={idx}
                className={cn(
                  "p-4 cursor-pointer hover-elevate",
                  hasUnread && "border-primary/30"
                )}
                onClick={() => openThread(thread)}
                data-testid={`thread-card-${idx}`}
              >
                <div className="flex items-start gap-4">
                  <Avatar className="w-9 h-9 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {thread.isBroadcast
                        ? "BC"
                        : getInitials(
                            thread.partner?.firstName,
                            thread.partner?.lastName
                          )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "text-sm",
                          hasUnread ? "font-bold" : "font-medium"
                        )}
                      >
                        {thread.isBroadcast
                          ? "Team Broadcast"
                          : thread.partner
                            ? `${thread.partner.firstName} ${thread.partner.lastName}`
                            : "Unknown"}
                      </span>
                      {thread.isBroadcast && (
                        <Badge variant="secondary" className="text-xs">
                          <Megaphone className="w-3 h-3 mr-1" />
                          Broadcast
                        </Badge>
                      )}
                      {hasUnread && (
                        <Badge variant="default" className="text-xs">
                          {thread.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p
                      className={cn(
                        "text-sm truncate",
                        hasUnread ? "font-medium" : ""
                      )}
                    >
                      {thread.lastMessage.subject}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {thread.lastMessage.senderId === user?.id ? "You: " : ""}
                      {thread.lastMessage.body}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {format(
                        new Date(thread.lastMessage.createdAt),
                        "MMM d"
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {thread.messages.length} msg{thread.messages.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showComposeDialog} onOpenChange={setShowComposeDialog}>
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
            <Button variant="outline" onClick={() => setShowComposeDialog(false)}>
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

function buildThreads(
  messages: Message[],
  employees: UserType[],
  user: UserType | null
): ConversationThread[] {
  if (!user) return [];

  const broadcastMessages = messages.filter((m) => m.isBroadcast);
  const directMessages = messages.filter(
    (m) => !m.isBroadcast && (m.senderId === user.id || m.recipientId === user.id)
  );

  const threads: ConversationThread[] = [];

  if (broadcastMessages.length > 0) {
    const sorted = broadcastMessages.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    threads.push({
      partnerId: null,
      partner: undefined,
      isBroadcast: true,
      lastMessage: sorted[0],
      messages: broadcastMessages,
      unreadCount: broadcastMessages.filter(
        (m) => !m.isRead && m.senderId !== user.id
      ).length,
    });
  }

  const partnerMap = new Map<string, Message[]>();
  directMessages.forEach((msg) => {
    const partnerId =
      msg.senderId === user.id ? msg.recipientId! : msg.senderId;
    const existing = partnerMap.get(partnerId) || [];
    existing.push(msg);
    partnerMap.set(partnerId, existing);
  });

  partnerMap.forEach((msgs, partnerId) => {
    const sorted = msgs.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const partner = employees.find((e) => e.id === partnerId);
    threads.push({
      partnerId,
      partner,
      isBroadcast: false,
      lastMessage: sorted[0],
      messages: msgs,
      unreadCount: msgs.filter(
        (m) => !m.isRead && m.recipientId === user.id
      ).length,
    });
  });

  threads.sort(
    (a, b) =>
      new Date(b.lastMessage.createdAt).getTime() -
      new Date(a.lastMessage.createdAt).getTime()
  );

  return threads;
}
