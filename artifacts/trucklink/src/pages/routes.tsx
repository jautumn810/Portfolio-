import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Fuel, DollarSign, Clock, ArrowRight, CheckCircle } from "lucide-react";
import { useOptimizeRoute } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Common US city coordinates for easy lookup
const US_CITIES: Record<string, { lat: number; lng: number; state: string }> = {
  "Chicago": { lat: 41.8827, lng: -87.6233, state: "IL" },
  "Los Angeles": { lat: 34.0522, lng: -118.2437, state: "CA" },
  "New York": { lat: 40.7128, lng: -74.006, state: "NY" },
  "Houston": { lat: 29.7604, lng: -95.3698, state: "TX" },
  "Phoenix": { lat: 33.4484, lng: -112.074, state: "AZ" },
  "Dallas": { lat: 32.7767, lng: -96.797, state: "TX" },
  "Atlanta": { lat: 33.749, lng: -84.388, state: "GA" },
  "Miami": { lat: 25.7617, lng: -80.1918, state: "FL" },
  "Seattle": { lat: 47.6062, lng: -122.3321, state: "WA" },
  "Denver": { lat: 39.7392, lng: -104.9903, state: "CO" },
  "Nashville": { lat: 36.1627, lng: -86.7816, state: "TN" },
  "Kansas City": { lat: 39.0997, lng: -94.5786, state: "MO" },
};

const WAYPOINT_COLORS: Record<string, string> = {
  origin: "bg-primary",
  destination: "bg-green-500",
  rest_stop: "bg-amber-500",
  fuel_stop: "bg-blue-500",
  waypoint: "bg-muted-foreground",
};

export default function RoutesPage() {
  const { toast } = useToast();
  const [origin, setOrigin] = useState("Chicago");
  const [dest, setDest] = useState("Los Angeles");
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [avoidHighways, setAvoidHighways] = useState(false);

  const { mutate: optimize, isPending, data: route } = useOptimizeRoute();

  const handleOptimize = () => {
    const originCity = US_CITIES[origin] ?? { lat: 41.8827, lng: -87.6233, state: "IL" };
    const destCity = US_CITIES[dest] ?? { lat: 34.0522, lng: -118.2437, state: "CA" };

    optimize({
      data: {
        originCity: origin,
        originState: originCity.state,
        originLat: originCity.lat,
        originLng: originCity.lng,
        destCity: dest,
        destState: destCity.state,
        destLat: destCity.lat,
        destLng: destCity.lng,
        avoidTolls,
        avoidHighways,
      },
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-black">Route Optimizer</h1>
        <p className="text-muted-foreground text-sm mt-1">AI-powered route planning with fuel and cost analysis</p>
      </div>

      {/* Input form */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <Label>Origin City</Label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="Chicago"
                className="bg-muted/30 pl-9"
                list="cities-list"
              />
              <datalist id="cities-list">
                {Object.keys(US_CITIES).map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Destination City</Label>
            <div className="relative">
              <Navigation size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={dest}
                onChange={(e) => setDest(e.target.value)}
                placeholder="Los Angeles"
                className="bg-muted/30 pl-9"
                list="cities-list"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <Switch checked={avoidTolls} onCheckedChange={setAvoidTolls} id="avoid-tolls" />
            <Label htmlFor="avoid-tolls" className="cursor-pointer">Avoid Tolls</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={avoidHighways} onCheckedChange={setAvoidHighways} id="avoid-highways" />
            <Label htmlFor="avoid-highways" className="cursor-pointer">Avoid Highways</Label>
          </div>
        </div>

        <Button
          onClick={handleOptimize}
          disabled={isPending}
          className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto px-8"
        >
          {isPending ? "Calculating..." : "Optimize Route"}
          <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>

      {/* Results */}
      {route && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Primary route stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Distance", value: `${route.distance.toLocaleString()} mi`, icon: Navigation, color: "text-blue-400" },
              { label: "Est. Drive Time", value: `${Math.floor(route.duration)}h ${Math.round((route.duration % 1) * 60)}m`, icon: Clock, color: "text-amber-400" },
              { label: "Fuel Cost", value: `$${route.fuelCost.toLocaleString()}`, icon: Fuel, color: "text-green-400" },
              { label: "Toll Cost", value: `$${route.tollCost.toLocaleString()}`, icon: DollarSign, color: "text-primary" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card border border-border rounded-xl p-4 text-center">
                <stat.icon size={20} className={cn("mx-auto mb-2", stat.color)} />
                <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Waypoints */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-bold mb-4">Route Waypoints</h3>
            <div className="space-y-3">
              {route.waypoints.map((wp, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className={cn("w-3 h-3 rounded-full shrink-0", WAYPOINT_COLORS[wp.type])} />
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{wp.city}, {wp.state}</p>
                      <p className="text-xs text-muted-foreground capitalize">{wp.type.replace("_", " ")}</p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize border-border">
                      {wp.type.replace("_", " ")}
                    </Badge>
                  </div>
                  {i < route.waypoints.length - 1 && (
                    <div className="hidden" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Alternative routes */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-bold">Alternative Routes</h3>
            </div>
            <div className="divide-y divide-border">
              {route.alternativeRoutes.map((alt, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-between p-4 hover:bg-muted/20 transition-colors",
                    i === 0 && "bg-primary/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {i === 0 && <CheckCircle size={16} className="text-primary shrink-0" />}
                    <div>
                      <p className="font-medium text-sm">{alt.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {alt.distance.toLocaleString()} mi · {Math.floor(alt.duration)}h {Math.round((alt.duration % 1) * 60)}m
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      ${(alt.fuelCost + alt.tollCost).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">total cost</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
