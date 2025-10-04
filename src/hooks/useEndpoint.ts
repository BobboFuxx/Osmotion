import { useState } from "react";

export function useEndpoint(initialRpc: string, initialRest: string) {
  const [rpcEndpoint, setRpcEndpoint] = useState(initialRpc);
  const [restEndpoint, setRestEndpoint] = useState(initialRest);

  const switchRpc = (rpc: string) => setRpcEndpoint(rpc);
  const switchRest = (rest: string) => setRestEndpoint(rest);

  return { rpcEndpoint, restEndpoint, switchRpc, switchRest };
}
