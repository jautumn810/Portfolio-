import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Truck, MapPin, Activity } from "lucide-react";
import { useGetTruckTelematics, useListTrucks, useListLoads } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamic import for leaflet to avoid SSR issues
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function createTruckIcon(status: string) {
  const color = status === "in_transit" ? "#3b82f6" : status === "available" ? "#22c55e" : "#f59e0b";
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;">
      <svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M18 18.5a1.5 1.5 0 010 3 1.5 1.5 0 010-3M1.5 18.5a1.5 1.5 0 010 3 1.5 1.5 0 010-3M19.5 9.5l1.5 3-1.5 3H18V9.5h1.5M6 9.5V16H3.5C2.1 16 1 14.9 1 13.5V12l2.5-2.5H6M18 3H7C5.3 3 4 4.3 4 6v2H8l2-4h6.5c1.1 0 2 .9 2 2v10h-2"/></svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function createLoadIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="background:#dc2626;width:24px;height:24px;border-radius:4px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;">
      <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

export default function MapPage() {
  const { data: telematics, isLoading: telematicsLoading } = useGetTruckTelematics();
  const { data: trucks } = useListTrucks();
  const { data: loads } = useListLoads({ status: "in_transit" });

  const activeTrucks = trucks?.filter((t) => t.currentLat && t.currentLng) ?? [];
  const activeLoads = loads?.filter((l) => l.originLat && l.destLat) ?? [];

  // Fallback truck positions using telematics
  const truckPositions = telematics ?? activeTrucks.map((t) => ({
    truckId: t.id,
    lat: t.currentLat ?? 39.5 + Math.random() * 10,
    lng: t.currentLng ?? -98 + Math.random() * 20,
    speed: 0,
    heading: 0,
    fuelLevel: t.fuelLevel ?? 0.75,
    engineTemp: 195,
    status: t.status,
    lastUpdated: new Date().toISOString(),
  }));

  return (
    <div className="space-y-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Live Fleet Map</h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time truck positions and load routes</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 border border-green-400/30 px-3 py-1.5 rounded-full">
            <Activity size={12} className="animate-pulse" />
            Live
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-blue-500" />
          In Transit ({truckPositions.filter(t => t.status === "in_transit").length})
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-green-500" />
          Available ({truckPositions.filter(t => t.status === "available").length})
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-amber-500" />
          Maintenance ({truckPositions.filter(t => t.status === "maintenance").length})
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-primary" />
          Active Loads ({activeLoads.length})
        </div>
      </div>

      {/* Map */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl overflow-hidden border border-border"
        style={{ height: "calc(100vh - 280px)", minHeight: "400px" }}
      >
        <MapContainer
          center={[39.5, -98.35]}
          zoom={4}
          style={{ height: "100%", width: "100%", background: "hsl(220, 18%, 10%)" }}
          className="z-0"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {/* Truck markers */}
          {truckPositions.map((t) => (
            <Marker
              key={t.truckId}
              position={[t.lat, t.lng]}
              icon={createTruckIcon(t.status)}
            >
              <Popup className="dark-popup">
                <div className="p-1">
                  <p className="font-bold text-sm">Truck #{t.truckId}</p>
                  <p className="text-xs capitalize">{t.status.replace("_", " ")}</p>
                  {t.speed > 0 && <p className="text-xs">{t.speed.toFixed(0)} mph</p>}
                  <p className="text-xs">Fuel: {(t.fuelLevel * 100).toFixed(0)}%</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Load route lines */}
          {activeLoads.map((load) => (
            <Polyline
              key={load.id}
              positions={[
                [load.originLat, load.originLng],
                [load.destLat, load.destLng],
              ]}
              color="#dc2626"
              weight={2}
              opacity={0.6}
              dashArray="8,8"
            />
          ))}

          {/* Load origin/dest markers */}
          {activeLoads.map((load) => (
            <Marker key={`load-${load.id}`} position={[load.originLat, load.originLng]} icon={createLoadIcon()}>
              <Popup>
                <div className="p-1">
                  <p className="font-bold text-sm">{load.title}</p>
                  <p className="text-xs">{load.originCity}, {load.originState}</p>
                  <p className="text-xs">→ {load.destCity}, {load.destState}</p>
                  <p className="text-xs font-semibold">${load.budget.toLocaleString()}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </motion.div>
    </div>
  );
}
