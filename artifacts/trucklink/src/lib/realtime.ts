import { io, type Socket } from "socket.io-client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      path: "/api/socket.io",
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }
  return socket;
}

export type TruckPosition = {
  id: number;
  lat: number;
  lng: number;
  speed: number;
};

const positionListeners = new Set<(positions: TruckPosition[]) => void>();
let positionListenerAttached = false;

export function subscribeTruckPositions(
  fn: (positions: TruckPosition[]) => void,
): () => void {
  positionListeners.add(fn);
  if (!positionListenerAttached) {
    const s = getSocket();
    s.on("trucks:positions", (positions: TruckPosition[]) => {
      positionListeners.forEach((listener) => listener(positions));
    });
    positionListenerAttached = true;
  }
  return () => {
    positionListeners.delete(fn);
  };
}

export function useRealtimeSync(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const s = getSocket();

    const onBidCreated = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loads"] });
    };
    const onBidUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loads"] });
    };
    const onLoadUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loads"] });
    };

    s.on("bid:created", onBidCreated);
    s.on("bid:updated", onBidUpdated);
    s.on("load:updated", onLoadUpdated);

    return () => {
      s.off("bid:created", onBidCreated);
      s.off("bid:updated", onBidUpdated);
      s.off("load:updated", onLoadUpdated);
    };
  }, [queryClient]);
}
