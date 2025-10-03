import { useState, useEffect } from "react";

export interface PoolInfo {
  id: number;
  tokenA: string;
  tokenB: string;
  totalShares: number;
  liquidityA: number;
  liquidityB: number;
  apr: number;
  swapFeesNextEpoch: number;
}

export const usePools = () => {
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPools = async () => {
      setLoading(true);
      try {
        const res = await fetch("https://api-osmosis.imperator.co/pools/v2");
        const data = await res.json();

        const mapped: PoolInfo[] = data
          .filter((p: any) => p.pool_assets.length === 2) // only 2-asset pools
          .map((p: any) => ({
            id: Number(p.id),
            tokenA: p.pool_assets[0]?.denom || "UNKNOWN",
            tokenB: p.pool_assets[1]?.denom || "UNKNOWN",
            totalShares: Number(p.total_shares) || 0,
            liquidityA: Number(p.pool_assets[0]?.amount) || 0,
            liquidityB: Number(p.pool_assets[1]?.amount) || 0,
            apr: Number(p.apr?.total) || 0,
            swapFeesNextEpoch: Number(p.swap_fees_estimate_next_epoch) || 0,
          }));

        setPools(mapped);
      } catch (err) {
        console.error("Failed to fetch pools:", err);
        setPools([]); // fail gracefully
      } finally {
        setLoading(false);
      }
    };

    fetchPools();
  }, []);

  return { pools, loading };
};
