import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Weight, DollarSign, Clock, Package, Gavel, CheckCircle, XCircle, Loader2 } from "lucide-react";
import {
  useGetLoad, getGetLoadQueryKey,
  useGetLoadBids, getGetLoadBidsQueryKey,
  useCreateBid, useUpdateBid,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  posted: { label: "Posted", color: "text-slate-400", bg: "bg-slate-400/10 border-slate-400/30" },
  bidding: { label: "Bidding", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/30" },
  assigned: { label: "Assigned", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30" },
  in_transit: { label: "In Transit", color: "text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/30" },
  delivered: { label: "Delivered", color: "text-green-400", bg: "bg-green-400/10 border-green-400/30" },
  cancelled: { label: "Cancelled", color: "text-red-400", bg: "bg-red-400/10 border-red-400/30" },
  pending: { label: "Pending", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/30" },
  accepted: { label: "Accepted", color: "text-green-400", bg: "bg-green-400/10 border-green-400/30" },
  rejected: { label: "Rejected", color: "text-red-400", bg: "bg-red-400/10 border-red-400/30" },
};

export default function LoadDetailPage() {
  const [, params] = useRoute("/loads/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const loadId = parseInt(params?.id ?? "0", 10);

  const [bidAmount, setBidAmount] = useState("");
  const [bidNote, setBidNote] = useState("");
  const [showBidForm, setShowBidForm] = useState(false);

  const { data: load, isLoading } = useGetLoad(loadId, { query: { queryKey: getGetLoadQueryKey(loadId), enabled: !!loadId } });
  const { data: bids, isLoading: bidsLoading } = useGetLoadBids(loadId, { query: { queryKey: getGetLoadBidsQueryKey(loadId), enabled: !!loadId } });
  const { mutate: createBid, isPending: bidding } = useCreateBid();
  const { mutate: updateBid, isPending: updatingBid } = useUpdateBid();

  const canBid = user?.role === "driver" || user?.role === "carrier";
  const canManage = user?.role === "dispatcher" || user?.role === "shipper" || user?.role === "admin";

  const handleBid = () => {
    if (!bidAmount) return;
    createBid(
      { data: { loadId, amount: parseFloat(bidAmount), note: bidNote || null } },
      {
        onSuccess: () => {
          toast({ title: "Bid placed!", description: `Your bid of $${parseFloat(bidAmount).toLocaleString()} has been submitted.` });
          queryClient.invalidateQueries({ queryKey: getGetLoadBidsQueryKey(loadId) });
          setShowBidForm(false);
          setBidAmount("");
          setBidNote("");
        },
        onError: () => toast({ title: "Failed to place bid", variant: "destructive" }),
      }
    );
  };

  const handleBidStatus = (bidId: number, status: "accepted" | "rejected") => {
    updateBid(
      { id: bidId, data: { status } },
      {
        onSuccess: () => {
          toast({ title: `Bid ${status}!` });
          queryClient.invalidateQueries({ queryKey: getGetLoadBidsQueryKey(loadId) });
          queryClient.invalidateQueries({ queryKey: getGetLoadQueryKey(loadId) });
        },
        onError: () => toast({ title: "Failed to update bid", variant: "destructive" }),
      }
    );
  };

  if (isLoading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );

  if (!load) return (
    <div className="flex flex-col items-center justify-center py-24">
      <p className="text-muted-foreground">Load not found</p>
      <Button variant="ghost" onClick={() => setLocation("/loads")} className="mt-4">Back to Loads</Button>
    </div>
  );

  const statusCfg = STATUS_CONFIG[load.status] || STATUS_CONFIG.posted;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/loads")} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-black">{load.title}</h1>
          <p className="text-muted-foreground text-sm">Load #{load.id}</p>
        </div>
        <Badge className={cn("border text-sm px-3 py-1", statusCfg.bg, statusCfg.color)}>
          {statusCfg.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Route */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-bold mb-4">Route</h3>
            <div className="relative">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <div className="w-3 h-3 bg-primary rounded-full" />
                </div>
                <div>
                  <p className="font-semibold">{load.originCity}, {load.originState}</p>
                  <p className="text-sm text-muted-foreground">Pickup: {format(new Date(load.pickupDate), "MMM d, yyyy")}</p>
                </div>
              </div>
              <div className="absolute left-5 top-10 bottom-4 w-0.5 bg-border" />
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-green-400/10 rounded-full flex items-center justify-center shrink-0">
                  <MapPin size={16} className="text-green-400" />
                </div>
                <div>
                  <p className="font-semibold">{load.destCity}, {load.destState}</p>
                  <p className="text-sm text-muted-foreground">Delivery: {format(new Date(load.deliveryDate), "MMM d, yyyy")}</p>
                </div>
              </div>
            </div>
            {load.distance && (
              <div className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
                Estimated distance: <span className="text-foreground font-medium">{load.distance.toFixed(0)} miles</span>
              </div>
            )}
          </div>

          {/* Details grid */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-bold mb-4">Load Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Budget</p>
                <p className="text-xl font-bold text-primary">${load.budget.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Weight</p>
                <p className="text-xl font-bold">{load.weight.toLocaleString()} lbs</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Freight Type</p>
                <p className="font-medium capitalize">{load.freightType.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Bid Count</p>
                <p className="font-medium">{load.bidCount} bids</p>
              </div>
              {load.length && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Length</p>
                  <p className="font-medium">{load.length} ft</p>
                </div>
              )}
              {load.finalPrice && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Final Price</p>
                  <p className="font-medium text-green-400">${load.finalPrice.toLocaleString()}</p>
                </div>
              )}
            </div>
            {load.specialInstructions && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Special Instructions</p>
                <p className="text-sm">{load.specialInstructions}</p>
              </div>
            )}
          </div>

          {/* Bids */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-bold">Bids ({bids?.length ?? 0})</h3>
              {canBid && (load.status === "posted" || load.status === "bidding") && !showBidForm && (
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white gap-1" onClick={() => setShowBidForm(true)}>
                  <Gavel size={14} /> Place Bid
                </Button>
              )}
            </div>

            {/* Bid form */}
            {showBidForm && (
              <div className="p-5 border-b border-border bg-muted/10">
                <h4 className="font-semibold mb-3 text-sm">Your Bid</h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <Label className="text-xs mb-1 block">Amount ($)</Label>
                    <Input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={load.budget.toString()}
                      className="bg-muted/30"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <Label className="text-xs mb-1 block">Note (optional)</Label>
                  <Textarea
                    value={bidNote}
                    onChange={(e) => setBidNote(e.target.value)}
                    placeholder="Add any notes about your bid..."
                    className="bg-muted/30 h-20 resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={handleBid} disabled={bidding || !bidAmount}>
                    {bidding ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                    Submit Bid
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowBidForm(false)}>Cancel</Button>
                </div>
              </div>
            )}

            <div className="divide-y divide-border">
              {bidsLoading ? (
                Array(3).fill(0).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-16" /></div>)
              ) : bids?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No bids yet</div>
              ) : (
                bids?.map((bid) => {
                  const bidStatusCfg = STATUS_CONFIG[bid.status] || STATUS_CONFIG.pending;
                  return (
                    <div key={bid.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                          {bid.bidder?.name?.charAt(0) ?? "?"}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{bid.bidder?.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{bid.bidder?.role}</p>
                          {bid.note && <p className="text-xs text-muted-foreground mt-1 italic">{bid.note}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-primary">${bid.amount.toLocaleString()}</span>
                        <Badge className={cn("border text-xs", bidStatusCfg.bg, bidStatusCfg.color)}>
                          {bidStatusCfg.label}
                        </Badge>
                        {canManage && bid.status === "pending" && (
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-400/10"
                              onClick={() => handleBidStatus(bid.id, "accepted")}
                              disabled={updatingBid}
                            >
                              <CheckCircle size={16} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                              onClick={() => handleBidStatus(bid.id, "rejected")}
                              disabled={updatingBid}
                            >
                              <XCircle size={16} />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-bold mb-3">Shipper</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                {load.shipper?.name?.charAt(0) ?? "?"}
              </div>
              <div>
                <p className="font-medium">{load.shipper?.name}</p>
                <p className="text-xs text-muted-foreground">{load.shipper?.company ?? "Independent"}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-bold mb-3 text-sm">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Posted</span>
                <span>{format(new Date(load.createdAt), "MMM d")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pickup</span>
                <span>{format(new Date(load.pickupDate), "MMM d")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span>{format(new Date(load.deliveryDate), "MMM d")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
