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

        const mapped = data.map((p: any) => ({
          id: p.id,
          tokenA: p.pool_assets[0].denom,
          tokenB: p.pool_assets[1].denom,
          totalShares: Number(p.total_shares),
          liquidityA: Number(p.pool_assets[0].amount),
          liquidityB: Number(p.pool_assets[1].amount),
          apr: p.apr.total,
          swapFeesNextEpoch: p.swap_fees_estimate_next_epoch,
        }));

        setPools(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPools();
  }, []);

  return { pools, loading };
};
