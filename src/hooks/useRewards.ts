import { useState, useEffect } from "react";
import { useWallet } from "./useWallet";

export interface RewardInfo {
  poolId: number;
  token: string;
  nextEpoch: number;      // reward for next epoch
  feesNextEpoch: number;  // swap fees for next epoch
  apr: number;
}

export interface MultiRewardInfo {
  poolId: number;
  rewards: RewardInfo[];
}

export const useRewards = () => {
  const { account } = useWallet();
  const [rewards, setRewards] = useState<MultiRewardInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account) return;

    const fetchRewards = async () => {
      setLoading(true);
      try {
        // Fetch claimable rewards for all LPs
        const lpRes = await fetch(`https://api-osmosis.imperator.co/claimable/${account}`);
        const lpData = await lpRes.json();

        const poolRes = await fetch("https://api-osmosis.imperator.co/pools/v2");
        const poolData = await poolRes.json();

        const multiRewards: MultiRewardInfo[] = lpData.map((lp: any) => {
          const pool = poolData.find((p: any) => p.id === lp.pool_id);
          const apr = pool?.apr?.total ?? 0;
          const feesNextEpoch = pool?.swap_fees_estimate_next_epoch ?? 0;

          const rewards: RewardInfo[] = lp.claimable_rewards.map((r: any) => ({
            poolId: lp.pool_id,
            token: r.denom,
            nextEpoch: r.amount,
            feesNextEpoch,
            apr,
          }));

          return { poolId: lp.pool_id, rewards };
        });

        setRewards(multiRewards);
      } catch (err) {
        console.error("Failed to fetch rewards:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, [account]);

  return { rewards, loading };
};
