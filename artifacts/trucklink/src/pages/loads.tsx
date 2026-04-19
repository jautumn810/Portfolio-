import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Package, MapPin, Weight, DollarSign, Clock, ChevronRight, Filter, Plus, Gavel } from "lucide-react";
import { useListLoads, getListLoadsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";

const STATUS_CONFIG: Record<string, { label: string; color: string; borderColor: string }> = {
  posted: { label: "Posted", color: "text-slate-400", borderColor: "border-slate-400/30" },
  bidding: { label: "Bidding", color: "text-amber-400", borderColor: "border-amber-400/30" },
  assigned: { label: "Assigned", color: "text-blue-400", borderColor: "border-blue-400/30" },
  in_transit: { label: "In Transit", color: "text-cyan-400", borderColor: "border-cyan-400/30" },
  delivered: { label: "Delivered", color: "text-green-400", borderColor: "border-green-400/30" },
  cancelled: { label: "Cancelled", color: "text-red-400", borderColor: "border-red-400/30" },
};

const FREIGHT_LABELS: Record<string, string> = {
  general: "General",
  refrigerated: "Refrigerated",
  hazmat: "Hazmat",
  oversized: "Oversized",
  automotive: "Automotive",
  livestock: "Livestock",
  electronics: "Electronics",
  furniture: "Furniture",
};

export default function LoadsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: loads, isLoading } = useListLoads(
    statusFilter !== "all" ? { status: statusFilter as "posted" | "bidding" | "assigned" | "in_transit" | "delivered" | "cancelled" } : undefined,
    { query: { queryKey: getListLoadsQueryKey(statusFilter !== "all" ? { status: statusFilter as "posted" | "bidding" | "assigned" | "in_transit" | "delivered" | "cancelled" } : undefined) } }
  );

  const canBid = user?.role === "driver" || user?.role === "carrier";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Load Board</h1>
          <p className="text-muted-foreground text-sm mt-1">{loads?.length ?? 0} loads available</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 bg-muted/30 border-border">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Loads</SelectItem>
              <SelectItem value="posted">Posted</SelectItem>
              <SelectItem value="bidding">Bidding</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
          {(user?.role === "shipper" || user?.role === "dispatcher" || user?.role === "admin") && (
            <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
              <Plus size={16} /> Post Load
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : loads?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Package size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-medium">No loads found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {loads?.map((load, i) => {
            const statusCfg = STATUS_CONFIG[load.status] || STATUS_CONFIG.posted;
            return (
              <motion.div
                key={load.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 hover:shadow-md transition-all duration-200 cursor-pointer group"
                onClick={() => setLocation(`/loads/${load.id}`)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center shrink-0">
                    <Package size={20} className="text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <h3 className="font-bold text-sm">{load.title}</h3>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs mt-1 flex-wrap">
                          <MapPin size={12} />
                          <span>{load.originCity}, {load.originState}</span>
                          <ChevronRight size={12} />
                          <span>{load.destCity}, {load.destState}</span>
                          {load.distance && <span className="text-muted-foreground/60">({load.distance.toFixed(0)} mi)</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={cn("border text-xs", statusCfg.borderColor, statusCfg.color)}>
                          {statusCfg.label}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      <div className="flex items-center gap-1.5 text-sm">
                        <DollarSign size={14} className="text-primary" />
                        <span className="font-bold text-primary">${load.budget.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Weight size={12} />
                        <span>{load.weight.toLocaleString()} lbs</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock size={12} />
                        <span>Pickup {format(new Date(load.pickupDate), "MMM d")}</span>
                      </div>
                      <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                        {FREIGHT_LABELS[load.freightType]}
                      </Badge>
                      {load.bidCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-amber-400">
                          <Gavel size={12} />
                          <span>{load.bidCount} bid{load.bidCount !== 1 ? "s" : ""}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0 ml-2">
                    {canBid && (load.status === "posted" || load.status === "bidding") && (
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-white text-xs h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/loads/${load.id}`);
                        }}
                      >
                        <Gavel size={12} className="mr-1" /> Bid
                      </Button>
                    )}
                    <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
