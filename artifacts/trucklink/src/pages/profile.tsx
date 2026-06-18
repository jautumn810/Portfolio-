import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Building, Star, Package, Calendar, Edit, Check, Inbox } from "lucide-react";
import { useGetMe, useUpdateUser, getGetMeQueryKey, useListBids } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-primary/10 text-primary border-primary/30",
  dispatcher: "bg-blue-400/10 text-blue-400 border-blue-400/30",
  driver: "bg-green-400/10 text-green-400 border-green-400/30",
  carrier: "bg-amber-400/10 text-amber-400 border-amber-400/30",
  shipper: "bg-purple-400/10 text-purple-400 border-purple-400/30",
};

export default function ProfilePage() {
  const { user: authUser, login } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", company: "" });

  const { data: user, isLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: myBids, isLoading: bidsLoading } = useListBids(
    { bidderId: authUser?.id },
    { query: { queryKey: ["bids", authUser?.id], enabled: !!authUser?.id } }
  );
  const { mutate: updateUser, isPending: updating } = useUpdateUser();

  const startEdit = () => {
    if (!user) return;
    setFormData({
      name: user.name,
      phone: user.phone ?? "",
      company: user.company ?? "",
    });
    setEditing(true);
  };

  const handleSave = () => {
    if (!user) return;
    updateUser(
      { id: user.id, data: { name: formData.name, phone: formData.phone || null, company: formData.company || null } },
      {
        onSuccess: (updated) => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          toast({ title: "Profile updated!" });
          setEditing(false);
          if (authUser) login({ token: localStorage.getItem("trucklink_token") || "", user: updated as typeof authUser });
        },
        onError: () => toast({ title: "Update failed", variant: "destructive" }),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!user) return null;

  const recentBids = myBids?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">My Profile</h1>
        {!editing ? (
          <Button variant="outline" className="gap-2 border-border" onClick={startEdit}>
            <Edit size={16} /> Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90 text-white gap-2" onClick={handleSave} disabled={updating}>
              <Check size={16} /> Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <div className="flex items-start gap-5">
          <div className="relative">
            <Avatar className="w-20 h-20 border-2 border-primary/30">
              <AvatarImage src={user.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {user.isActive && (
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-card" />
            )}
          </div>

          <div className="flex-1">
            {editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1 block">Full Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-muted/30 h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-muted/30 h-8 text-sm"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Company</Label>
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="bg-muted/30 h-8 text-sm"
                    placeholder="Company name"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-2xl font-black">{user.name}</h2>
                  <Badge className={cn("capitalize border text-xs", ROLE_COLORS[user.role] || "")}>{user.role}</Badge>
                </div>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail size={14} />
                    <span>{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Phone size={14} />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.company && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building size={14} />
                      <span>{user.company}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
          <div className="text-center">
            <Package size={18} className="text-muted-foreground mx-auto mb-1" />
            <p className="text-xl font-bold">{user.totalLoads}</p>
            <p className="text-xs text-muted-foreground">Total Loads</p>
          </div>
          <div className="text-center">
            <Star size={18} className="text-amber-400 mx-auto mb-1" />
            <p className="text-xl font-bold">{user.rating?.toFixed(1) ?? "—"}</p>
            <p className="text-xs text-muted-foreground">Rating</p>
          </div>
          <div className="text-center">
            <Calendar size={18} className="text-muted-foreground mx-auto mb-1" />
            <p className="text-xl font-bold">{format(new Date(user.createdAt), "yyyy")}</p>
            <p className="text-xs text-muted-foreground">Member Since</p>
          </div>
        </div>
      </motion.div>

      {/* Recent bids — always rendered */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold">Recent Bids</h3>
          {!bidsLoading && (
            <span className="text-xs text-muted-foreground">{recentBids.length} bid{recentBids.length !== 1 ? "s" : ""}</span>
          )}
        </div>

        {bidsLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
          </div>
        ) : recentBids.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Inbox size={36} className="mb-3 opacity-20" />
            <p className="text-sm font-medium">No bids placed yet</p>
            <p className="text-xs mt-1">Your bid history will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentBids.map((bid) => (
              <div key={bid.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-sm">{bid.load?.title ?? `Load #${bid.loadId}`}</p>
                  <p className="text-xs text-muted-foreground">
                    {bid.load?.originCity} → {bid.load?.destCity}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-primary">${bid.amount.toLocaleString()}</span>
                  <Badge
                    variant="outline"
                    className={cn("text-xs capitalize border", {
                      "text-green-400 border-green-400/30": bid.status === "accepted",
                      "text-red-400 border-red-400/30": bid.status === "rejected",
                      "text-amber-400 border-amber-400/30": bid.status === "pending",
                    })}
                  >
                    {bid.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
