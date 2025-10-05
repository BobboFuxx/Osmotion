// src/hooks/useEndpoint.ts
import { useState, useEffect } from "react";

export type EndpointType = "rpc" | "rest" | "grpc";

export interface Endpoint {
  url: string;
  type: EndpointType;
  online: boolean;
}

export function useEndpoint(initialEndpoints: Endpoint[]) {
  const [endpoints, setEndpoints] = useState<Endpoint[]>(initialEndpoints);
  const [currentEndpoint, setCurrentEndpoint] = useState<Endpoint>(initialEndpoints[0]);

  // Check if the given endpoint is online
  const checkStatus = async (ep: Endpoint): Promise<boolean> => {
    try {
      if (ep.type === "rpc") {
        const res = await fetch(ep.url, { method: "HEAD" });
        return res.ok;
      } else if (ep.type === "rest") {
        const res = await fetch(ep.url + "/node_info");
        return res.ok;
      } else if (ep.type === "grpc") {
        // Placeholder gRPC health check
        // We can replace with actual gRPC client ping if available
        // For now, assume online
        return true;
      }
      return false;
    } catch (err) {
      console.warn(`Endpoint check failed for ${ep.url}:`, err);
      return false;
    }
  };

  // Refresh status for all endpoints
  const refreshStatus = async () => {
    const updated = await Promise.all(
      endpoints.map(async (ep) => ({ ...ep, online: await checkStatus(ep) }))
    );
    setEndpoints(updated);

    // Update current endpoint status
    const current = updated.find((e) => e.url === currentEndpoint.url);
    if (current) setCurrentEndpoint(current);
  };

  // Switch to a new endpoint by URL
  const switchEndpoint = (url: string) => {
    const ep = endpoints.find((e) => e.url === url);
    if (ep) setCurrentEndpoint(ep);
  };

  // Periodically refresh endpoint status every 15 seconds
  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  return {
    endpoints,
    currentEndpoint: currentEndpoint.url,
    endpointType: currentEndpoint.type,
    switchEndpoint,
    refreshStatus,
    online: currentEndpoint.online,
  };
}
