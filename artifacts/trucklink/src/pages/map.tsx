import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Truck, MapPin, Activity, Navigation, Package } from "lucide-react";
import { useGetTruckTelematics, useListTrucks, useListLoads, useListDrivers, useUpdateUser } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { subscribeTruckPositions, subscribeDriverLocations, type TruckPosition, type DriverLocation } from "@/lib/realtime";
import { useAuth } from "@/lib/auth";

import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const TRUCK_STATUS_COLORS: Record<string, string> = {
  in_transit: "#3b82f6",
  available: "#22c55e",
  maintenance: "#f59e0b",
  inactive: "#6b7280",
};

const NEARBY_RADIUS_KM = 500;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function createTruckIcon(status: string) {
  const color = TRUCK_STATUS_COLORS[status] ?? TRUCK_STATUS_COLORS["inactive"];
  const div = document.createElement("div");
  div.style.cssText = [
    `background:${color}`,
    "width:32px", "height:32px", "border-radius:50%",
    "border:3px solid white", "box-shadow:0 2px 8px rgba(0,0,0,0.5)",
    "display:flex", "align-items:center", "justify-content:center",
  ].join(";");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "16"); svg.setAttribute("height", "16");
  svg.setAttribute("fill", "white"); svg.setAttribute("viewBox", "0 0 24 24");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M18 18.5a1.5 1.5 0 010 3 1.5 1.5 0 010-3M1.5 18.5a1.5 1.5 0 010 3 1.5 1.5 0 010-3M19.5 9.5l1.5 3-1.5 3H18V9.5h1.5M6 9.5V16H3.5C2.1 16 1 14.9 1 13.5V12l2.5-2.5H6M18 3H7C5.3 3 4 4.3 4 6v2H8l2-4h6.5c1.1 0 2 .9 2 2v10h-2");
  svg.appendChild(path); div.appendChild(svg);
  return L.divIcon({ className: "", html: div, iconSize: [32, 32], iconAnchor: [16, 16] });
}

function createDriverIcon(isMe: boolean) {
  const color = isMe ? "#a855f7" : "#c084fc";
  const div = document.createElement("div");
  div.style.cssText = [
    `background:${color}`,
    "width:36px", "height:36px", "border-radius:50%",
    `border:3px solid ${isMe ? "white" : "rgba(255,255,255,0.6)"}`,
    "box-shadow:0 2px 12px rgba(168,85,247,0.6)",
    "display:flex", "align-items:center", "justify-content:center",
  ].join(";");
  div.innerHTML = `<svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>`;
  return L.divIcon({ className: "", html: div, iconSize: [36, 36], iconAnchor: [18, 18] });
}

function createLoadIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="background:#dc2626;width:24px;height:24px;border-radius:4px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;">
      <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
    </div>`,
    iconSize: [24, 24], iconAnchor: [12, 12],
  });
}

export default function MapPage() {
  const { user } = useAuth();
  const isDriver = user?.role === "driver";

  const { data: telematics } = useGetTruckTelematics();
  const { data: trucks } = useListTrucks();
  const { data: allLoads } = useListLoads({ status: "in_transit" });
  const { data: biddableLoads } = useListLoads({ status: "bidding" });
  const { data: postedLoads } = useListLoads({ status: "posted" });
  const { data: drivers, refetch: refetchDrivers } = useListDrivers();
  const { mutate: updateUser } = useUpdateUser();

  const [liveOverrides, setLiveOverrides] = useState<Record<number, TruckPosition>>({});
  const [liveDrivers, setLiveDrivers] = useState<Record<number, DriverLocation>>({});
  const [myLat, setMyLat] = useState<number | null>(user?.currentLat ?? null);
  const [myLng, setMyLng] = useState<number | null>(user?.currentLng ?? null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const unsub = subscribeTruckPositions((positions) => {
      setLiveOverrides((prev) => {
        const next = { ...prev };
        for (const p of positions) next[p.id] = p;
        return next;
      });
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeDriverLocations((loc) => {
      setLiveDrivers((prev) => ({ ...prev, [loc.id]: loc }));
    });
    return unsub;
  }, []);

  const activeTrucks = trucks?.filter((t) => t.currentLat && t.currentLng) ?? [];
  const activeLoads = allLoads?.filter((l) => l.originLat && l.destLat) ?? [];

  const basePositions = telematics ?? activeTrucks.map((t) => ({
    truckId: t.id, lat: t.currentLat ?? 39.5, lng: t.currentLng ?? -98.0,
    speed: 0, heading: 0, fuelLevel: t.fuelLevel ?? 0.75,
    engineTemp: 195, status: t.status, lastUpdated: new Date().toISOString(),
  }));

  const truckPositions = basePositions.map((t) => {
    const live = liveOverrides[t.truckId];
    return live ? { ...t, lat: live.lat, lng: live.lng, speed: live.speed } : t;
  });

  // Merge DB drivers with live socket overrides
  const driverMarkers = (drivers ?? []).map((d) => {
    const live = liveDrivers[d.id];
    return {
      id: d.id,
      name: d.name,
      lat: live?.lat ?? d.currentLat,
      lng: live?.lng ?? d.currentLng,
    };
  }).filter((d) => d.lat != null && d.lng != null) as { id: number; name: string; lat: number; lng: number }[];

  // Nearby loads for drivers (within NEARBY_RADIUS_KM of their position)
  const nearbyLoads = isDriver && myLat != null && myLng != null
    ? [...(biddableLoads ?? []), ...(postedLoads ?? [])].filter(
        (l) => haversineKm(myLat!, myLng!, l.originLat, l.originLng) <= NEARBY_RADIUS_KM
      ).sort(
        (a, b) =>
          haversineKm(myLat!, myLng!, a.originLat, a.originLng) -
          haversineKm(myLat!, myLng!, b.originLat, b.originLng)
      ).slice(0, 8)
    : [];

  const shareLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMyLat(lat);
        setMyLng(lng);
        setLocating(false);
        if (user) {
          updateUser(
            { id: user.id, data: { currentLat: lat, currentLng: lng } },
            { onSuccess: () => refetchDrivers() }
          );
        }
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Live Fleet Map</h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time truck & driver positions</p>
        </div>
        <div className="flex items-center gap-2">
          {isDriver && (
            <Button
              size="sm"
              variant="outline"
              onClick={shareLocation}
              disabled={locating}
              className="border-purple-500/40 text-purple-400 hover:bg-purple-500/10"
            >
              <Navigation size={14} className={`mr-1.5 ${locating ? "animate-spin" : ""}`} />
              {myLat ? "Update Location" : "Share Location"}
            </Button>
          )}
          <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 border border-green-400/30 px-3 py-1.5 rounded-full">
            <Activity size={12} className="animate-pulse" />
            Live
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded-full bg-blue-500" />In Transit ({truckPositions.filter(t => t.status === "in_transit").length})</div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded-full bg-green-500" />Available ({truckPositions.filter(t => t.status === "available").length})</div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded-full bg-amber-500" />Maintenance ({truckPositions.filter(t => t.status === "maintenance").length})</div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded-full bg-purple-500" />Drivers ({driverMarkers.length})</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-primary" />Active Loads ({activeLoads.length})</div>
      </div>

      <div className="flex gap-4" style={{ height: "calc(100vh - 280px)", minHeight: "400px" }}>
        {/* Map */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 rounded-xl overflow-hidden border border-border"
        >
          <MapContainer
            center={[39.5, -98.35]}
            zoom={4}
            style={{ height: "100%", width: "100%", background: "hsl(220, 18%, 10%)" }}
            className="z-0"
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            />

            {/* Truck markers */}
            {truckPositions.map((t) => (
              <Marker key={t.truckId} position={[t.lat, t.lng]} icon={createTruckIcon(t.status)}>
                <Popup>
                  <div className="p-1">
                    <p className="font-bold text-sm">Truck #{t.truckId}</p>
                    <p className="text-xs capitalize">{t.status.replace("_", " ")}</p>
                    {t.speed > 0 && <p className="text-xs">{t.speed.toFixed(0)} mph</p>}
                    <p className="text-xs">Fuel: {(t.fuelLevel * 100).toFixed(0)}%</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Driver markers */}
            {driverMarkers.map((d) => (
              <Marker key={`driver-${d.id}`} position={[d.lat, d.lng]} icon={createDriverIcon(d.id === user?.id)}>
                <Popup>
                  <div className="p-1">
                    <p className="font-bold text-sm">{d.name}</p>
                    <p className="text-xs text-purple-600">Driver{d.id === user?.id ? " (You)" : ""}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* My location radius ring */}
            {isDriver && myLat != null && myLng != null && (
              <Circle
                center={[myLat, myLng]}
                radius={NEARBY_RADIUS_KM * 1000}
                pathOptions={{ color: "#a855f7", fillColor: "#a855f7", fillOpacity: 0.04, weight: 1, dashArray: "6,6" }}
              />
            )}

            {/* Active load routes */}
            {activeLoads.map((load) => (
              <Polyline
                key={load.id}
                positions={[[load.originLat, load.originLng], [load.destLat, load.destLng]]}
                color="#dc2626" weight={2} opacity={0.6} dashArray="8,8"
              />
            ))}

            {/* Load markers */}
            {activeLoads.map((load) => (
              <Marker key={`load-${load.id}`} position={[load.originLat, load.originLng]} icon={createLoadIcon()}>
                <Popup>
                  <div className="p-1">
                    <p className="font-bold text-sm">{load.title}</p>
                    <p className="text-xs">{load.originCity}, {load.originState} → {load.destCity}, {load.destState}</p>
                    <p className="text-xs font-semibold">${load.budget.toLocaleString()}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </motion.div>

        {/* Nearby loads panel — drivers only */}
        {isDriver && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-72 flex flex-col gap-3 overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <Package size={16} className="text-primary" />
              <h3 className="font-bold text-sm">Nearby Loads</h3>
              <span className="text-xs text-muted-foreground ml-auto">within {NEARBY_RADIUS_KM} km</span>
            </div>

            {myLat == null ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border rounded-xl">
                <Navigation size={28} className="text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Share your location to see nearby loads</p>
                <Button size="sm" onClick={shareLocation} className="mt-3 bg-purple-600 hover:bg-purple-700 text-white">
                  Share Location
                </Button>
              </div>
            ) : nearbyLoads.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border rounded-xl">
                <MapPin size={28} className="text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No open loads within {NEARBY_RADIUS_KM} km of your position</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {nearbyLoads.map((load) => {
                  const dist = Math.round(haversineKm(myLat!, myLng!, load.originLat, load.originLng));
                  return (
                    <motion.a
                      key={load.id}
                      href={`/loads/${load.id}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="block bg-card border border-border rounded-lg p-3 hover:border-primary/40 hover:bg-card/80 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-xs leading-tight line-clamp-2">{load.title}</p>
                        <Badge variant="outline" className="text-xs shrink-0 border-primary/40 text-primary">${(load.budget / 1000).toFixed(1)}k</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{load.originCity} → {load.destCity}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-purple-400 flex items-center gap-1">
                          <Navigation size={10} />{dist} km away
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">{load.status}</span>
                      </div>
                    </motion.a>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
