import { useState } from "react";
import { motion } from "framer-motion";
import { Truck, Plus, MapPin, Gauge, Weight, X, Fuel, Navigation } from "lucide-react";
import { useListTrucks, getListTrucksQueryKey, type Truck as TruckType } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: "Available", color: "text-green-400", bg: "bg-green-400/10 border-green-400/30" },
  in_transit: { label: "In Transit", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30" },
  maintenance: { label: "Maintenance", color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/30" },
  inactive: { label: "Inactive", color: "text-muted-foreground", bg: "bg-muted border-border" },
};

const TYPE_LABELS: Record<string, string> = {
  flatbed: "Flatbed",
  dry_van: "Dry Van",
  reefer: "Reefer",
  tanker: "Tanker",
  step_deck: "Step Deck",
  lowboy: "Lowboy",
  conestoga: "Conestoga",
  auto_carrier: "Auto Carrier",
};

type TruckWithOwner = TruckType & { owner?: { name?: string; [k: string]: unknown } | null };

function TruckDetailModal({ truck, onClose }: { truck: TruckWithOwner; onClose: () => void }) {
  const statusCfg = STATUS_CONFIG[truck.status] || STATUS_CONFIG.inactive;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-6">
            <span>{truck.year} {truck.make} {truck.model}</span>
            <Badge className={cn("border text-xs font-medium ml-3", statusCfg.bg, statusCfg.color)}>
              <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: "currentColor" }} />
              {statusCfg.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">License Plate</p>
              <p className="font-bold text-sm">{truck.licensePlate}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Truck Type</p>
              <p className="font-bold text-sm">{TYPE_LABELS[truck.truckType] ?? truck.truckType}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Max Weight</p>
              <p className="font-bold text-sm flex items-center gap-1.5">
                <Weight size={13} className="text-muted-foreground" />
                {(truck.maxWeight / 1000).toFixed(0)}K lbs
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Max Length</p>
              <p className="font-bold text-sm">{truck.maxLength} ft</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Mileage</p>
              <p className="font-bold text-sm flex items-center gap-1.5">
                <Gauge size={13} className="text-muted-foreground" />
                {truck.mileage.toLocaleString()} mi
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Fuel Level</p>
              <div className="flex items-center gap-2">
                <Fuel size={13} className="text-muted-foreground" />
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      (truck.fuelLevel ?? 0) > 0.5 ? "bg-green-400" :
                      (truck.fuelLevel ?? 0) > 0.25 ? "bg-amber-400" : "bg-primary"
                    )}
                    style={{ width: `${(truck.fuelLevel ?? 0) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-semibold">{Math.round((truck.fuelLevel ?? 0) * 100)}%</span>
              </div>
            </div>
          </div>

          {truck.currentCity && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/20 rounded-lg p-3">
              <Navigation size={14} className="text-primary" />
              <span>Currently in <strong className="text-foreground">{truck.currentCity}, {truck.currentState}</strong></span>
            </div>
          )}

          {truck.owner?.name && (
            <div className="flex items-center gap-3 pt-3 border-t border-border">
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary text-sm flex items-center justify-center font-bold">
                {(truck.owner.name as string).charAt(0)}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Assigned Owner</p>
                <p className="font-semibold text-sm">{truck.owner.name as string}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TruckCard({ truck, onClick }: { truck: TruckWithOwner; onClick: () => void }) {
  const statusCfg = STATUS_CONFIG[truck.status] || STATUS_CONFIG.inactive;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group cursor-pointer"
    >
      {/* Truck header/image area */}
      <div className="h-44 bg-gradient-to-br from-muted/50 to-muted/20 relative flex items-center justify-center overflow-hidden">
        {truck.imageUrl ? (
          <img src={truck.imageUrl} alt={`${truck.make} ${truck.model}`} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-3 z-10">
            <Truck size={48} className="text-muted-foreground/30" />
            <span className="text-xs text-muted-foreground/50">{TYPE_LABELS[truck.truckType]}</span>
          </div>
        )}
        {/* Status badge overlay */}
        <div className="absolute top-3 right-3 z-10">
          <Badge className={cn("border text-xs font-medium", statusCfg.bg, statusCfg.color)}>
            <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: "currentColor" }} />
            {statusCfg.label}
          </Badge>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent pointer-events-none" />
      </div>

      {/* Truck info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-lg leading-tight">
              {truck.year} {truck.make} {truck.model}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{truck.licensePlate} · {TYPE_LABELS[truck.truckType]}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="flex flex-col items-center bg-muted/30 rounded-lg p-2">
            <Weight size={14} className="text-muted-foreground mb-1" />
            <span className="text-xs font-semibold">{(truck.maxWeight / 1000).toFixed(0)}K lbs</span>
            <span className="text-xs text-muted-foreground">Max Weight</span>
          </div>
          <div className="flex flex-col items-center bg-muted/30 rounded-lg p-2">
            <Gauge size={14} className="text-muted-foreground mb-1" />
            <span className="text-xs font-semibold">{truck.mileage.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">Miles</span>
          </div>
          <div className="flex flex-col items-center bg-muted/30 rounded-lg p-2">
            <Truck size={14} className="text-muted-foreground mb-1" />
            <span className="text-xs font-semibold">{truck.maxLength}'</span>
            <span className="text-xs text-muted-foreground">Length</span>
          </div>
        </div>

        {truck.currentCity && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin size={12} />
            <span>{truck.currentCity}, {truck.currentState}</span>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
              {truck.owner?.name?.charAt(0) ?? "?"}
            </div>
            <span className="text-xs text-muted-foreground">{truck.owner?.name}</span>
          </div>
          {truck.fuelLevel != null && (
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full", truck.fuelLevel > 0.5 ? "bg-green-400" : truck.fuelLevel > 0.25 ? "bg-amber-400" : "bg-primary")}
                  style={{ width: `${truck.fuelLevel * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{Math.round(truck.fuelLevel * 100)}%</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function TrucksPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedTruck, setSelectedTruck] = useState<TruckWithOwner | null>(null);

  const { data: trucks, isLoading } = useListTrucks(
    statusFilter !== "all" ? { status: statusFilter as "available" | "in_transit" | "maintenance" | "inactive" } : undefined,
    { query: { queryKey: getListTrucksQueryKey(statusFilter !== "all" ? { status: statusFilter as "available" | "in_transit" | "maintenance" | "inactive" } : undefined) } }
  );

  const filtered = typeFilter === "all" ? trucks : trucks?.filter((t) => t.truckType === typeFilter);

  return (
    <div className="space-y-6">
      {selectedTruck && (
        <TruckDetailModal truck={selectedTruck} onClose={() => setSelectedTruck(null)} />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">Fleet Trucks</h1>
          <p className="text-muted-foreground text-sm mt-1">{trucks?.length ?? 0} vehicles in system</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-muted/30 border-border">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40 bg-muted/30 border-border">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(TYPE_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
            <Plus size={16} /> Add Truck
          </Button>
        </div>
      </div>

      {/* Status summary */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const count = trucks?.filter((t) => t.status === key).length ?? 0;
          return (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors",
                statusFilter === key ? cn(cfg.bg, cfg.color) : "border-border text-muted-foreground hover:border-border/80"
              )}
            >
              <span>{count}</span>
              <span>{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
        </div>
      ) : filtered?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Truck size={48} className="mb-4 opacity-20" />
          <p className="text-lg font-medium">No trucks found</p>
          <p className="text-sm">Try changing your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered?.map((truck) => (
            <TruckCard
              key={truck.id}
              truck={truck as TruckWithOwner}
              onClick={() => setSelectedTruck(truck as TruckWithOwner)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
