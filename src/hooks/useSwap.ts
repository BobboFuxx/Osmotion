import { useState } from "react";

interface SwapResult {
  txHash: string;
  error?: string;
}

export function useSwap() {
  const [loading, setLoading] = useState(false);

  const swap = async (
    fromDenom: string,
    toDenom: string,
    amount: number
  ): Promise<SwapResult> => {
    setLoading(true);
    try {
      // Example API call using Osmosis Imperator aggregator endpoint
      const res = await fetch(
        `https://api-osmosis.imperator.co/swap/v1/estimate/${fromDenom}/${toDenom}?amount=${amount}`
      );

      if (!res.ok) throw new Error("Failed to fetch swap route");

      const data = await res.json();

      // Normally we would broadcast this tx with CosmJS or Keplr here
      return { txHash: data.tx_hash ?? "mock-tx-hash" };
    } catch (err: any) {
      console.error("Swap failed:", err);
      return { txHash: "", error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { swap, loading };
}
