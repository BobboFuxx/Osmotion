import { useState, useEffect } from "react";

export interface Endpoint {
  url: string;
  type: "rpc" | "rest" | "grpc";
  online: boolean;
}

export function useEndpoint(initialEndpoints: Endpoint[]) {
  const [endpoints, setEndpoints] = useState<Endpoint[]>(initialEndpoints);
  const [currentEndpoint, setCurrentEndpoint] = useState<Endpoint>(initialEndpoints[0]);

  // Check if the current endpoint is online
  const checkStatus = async (ep: Endpoint): Promise<boolean> => {
    try {
      if (ep.type === "rpc") {
        const res = await fetch(ep.url, { method: "HEAD" });
        return res.ok;
      } else if (ep.type === "rest") {
        const res = await fetch(ep.url + "/node_info");
        return res.ok;
      } else if (ep.type === "grpc") {
        // Simple gRPC health check placeholder
        // Replace with actual gRPC client ping if available
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const refreshStatus = async () => {
    const updated = await Promise.all(
      endpoints.map(async (ep) => ({ ...ep, online: await checkStatus(ep) }))
    );
    setEndpoints(updated);

    // Update current endpoint status
    const current = updated.find((e) => e.url === currentEndpoint.url);
    if (current) setCurrentEndpoint(current);
  };

  const switchEndpoint = (url: string) => {
    const ep = endpoints.find((e) => e.url === url);
    if (ep) setCurrentEndpoint(ep);
  };

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 15000); // every 15s
    return () => clearInterval(interval);
  }, []);

  return { endpoints, currentEndpoint, switchEndpoint, refreshStatus, online: currentEndpoint.online };
}
