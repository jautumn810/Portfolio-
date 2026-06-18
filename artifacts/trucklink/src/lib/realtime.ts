import { io, type Socket } from "socket.io-client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
    socket = io(apiUrl ?? "", {
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

export type NotificationPermission = "default" | "granted" | "denied" | "unsupported";

export function getNotificationPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as NotificationPermission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission as NotificationPermission;
  }
  const result = await Notification.requestPermission();
  return result as NotificationPermission;
}

function isSafeInternalPath(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
}

function showDesktopNotification(
  title: string,
  options: NotificationOptions & { url?: string },
) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const { url, ...rest } = options;
  const n = new Notification(title, {
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    ...rest,
  });
  n.onclick = () => {
    window.focus();
    if (url && isSafeInternalPath(url)) {
      window.location.href = url;
    }
    n.close();
  };
}

export function useRealtimeSync(): void {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => {
    const s = getSocket();

    type EnrichedBid = {
      id: number;
      loadId: number;
      bidderId: number;
      amount: number;
      status: string;
      bidder?: { id: number; name: string };
      load?: {
        id: number;
        title: string;
        shipperId: number;
        shipper?: { id: number; name: string };
      } | null;
    };

    const isTabHidden = () =>
      typeof document !== "undefined" && (document.hidden || !document.hasFocus());

    const onBidCreated = (bid: EnrichedBid) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loads"] });

      if (!user || !bid.load) return;

      const isMyLoad = bid.load.shipperId === user.id;
      const isAdminOrDispatcher = user.role === "admin" || user.role === "dispatcher";

      if (!isMyLoad && !isAdminOrDispatcher) return;

      const title = `New bid on ${bid.load.title}`;
      const body = `${bid.bidder?.name ?? "A carrier"} bid $${bid.amount.toLocaleString()}`;
      const url = `${basePath}/loads/${bid.loadId}`;

      if (isTabHidden()) {
        showDesktopNotification(title, { body, tag: `bid-${bid.id}`, url });
      } else {
        toast({
          title,
          description: body,
        });
      }
    };

    const onBidUpdated = (bid: EnrichedBid) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loads"] });

      if (!user) return;

      // Notify the bidder when their bid is accepted/rejected
      if (bid.bidderId !== user.id) return;
      if (bid.status !== "accepted" && bid.status !== "rejected") return;

      const isAccepted = bid.status === "accepted";
      const title = isAccepted ? "Bid accepted!" : "Bid rejected";
      const body = isAccepted
        ? `Your $${bid.amount.toLocaleString()} bid on "${bid.load?.title ?? "the load"}" was accepted.`
        : `Your bid on "${bid.load?.title ?? "the load"}" was not selected.`;
      const url = `${basePath}/loads/${bid.loadId}`;

      if (isTabHidden()) {
        showDesktopNotification(title, { body, tag: `bid-status-${bid.id}`, url });
      } else {
        toast({
          title,
          description: body,
          variant: isAccepted ? "default" : "destructive",
        });
      }
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
  }, [queryClient, user, basePath]);
}
