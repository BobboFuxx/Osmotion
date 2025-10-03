import { useState, useMemo, useEffect } from "react";
import { useWallet } from "../hooks/useWallet";
import { removeLiquidity } from "../utils/blockchain";
import { usePools } from "../hooks/usePools";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useRewardsProjection } from "../hooks/useRewardsProjection";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface RemoveLiquidityModalProps {
  poolId: number;
  onClose: () => void;
}

export default function RemoveLiquidityModal({ poolId, onClose }: RemoveLiquidityModalProps) {
  const { account, client } = useWallet();
  const { pools } = usePools();
  const pool = pools.find((p) => p.id === poolId);

  const [lpAmount, setLpAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  const { setProjection, clearProjections } = useRewardsProjection();

  // Update projected rewards in context whenever lpAmount changes
  useEffect(() => {
    if (!pool) return;

    const fraction = lpAmount / pool.totalShares;

    setProjection({
      poolId: pool.id,
      token: pool.tokenA,
      deltaLiquidity: -fraction * pool.liquidityA,
    });

    setProjection({
      poolId: pool.id,
      token: pool.tokenB,
      deltaLiquidity: -fraction * pool.liquidityB,
    });

    // Clear projections when modal closes
    return () => clearProjections();
  }, [lpAmount, pool, setProjection, clearProjections]);

  // Projected rewards after removing LP
  const projectedRewards = useMemo(() => {
    if (!pool) return { [pool?.tokenA || ""]: 0, [pool?.tokenB || ""]: 0 };
    const remainingShares = pool.totalShares - lpAmount;
    const shareFraction = remainingShares / pool.totalShares;
    return {
      [pool.tokenA]: pool.swapFeesNextEpoch * shareFraction * (pool.liquidityA / (pool.liquidityA + pool.liquidityB)),
      [pool.tokenB]: pool.swapFeesNextEpoch * shareFraction * (pool.liquidityB / (pool.liquidityA + pool.liquidityB)),
    };
  }, [lpAmount, pool]);

  const projectionDays = [15, 180, 365];
  const chartData = useMemo(() => {
    if (!pool) return null;
    const projectedA = projectionDays.map((d) => projectedRewards[pool.tokenA] * d);
    const projectedB = projectionDays.map((d) => projectedRewards[pool.tokenB] * d);

    return {
      labels: ["Next Epoch", "15d", "180d", "1yr"],
      datasets: [
        { label: `${pool.tokenA} Rewards`, data: [projectedRewards[pool.tokenA], ...projectedA], backgroundColor: "rgba(155,89,182,0.7)" },
        { label: `${pool.tokenB} Rewards`, data: [projectedRewards[pool.tokenB], ...projectedB], backgroundColor: "rgba(255,111,60,0.7)" },
      ],
    };
  }, [projectedRewards, pool]);

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: `Projected Rewards for Pool ${pool?.id}` },
      tooltip: { callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${ctx.raw.toFixed(4)}` } },
    },
  };

  const handleRemove = async () => {
    if (!client || !account || !pool) return alert("Wallet not connected or pool not found");
    setLoading(true);
    try {
      await removeLiquidity(client, account, poolId, lpAmount);
      alert("Liquidity removed successfully!");
      onClose();
      clearProjections(); // Reset projections after successful remove
    } catch (err) {
      console.error(err);
      alert("Transaction failed!");
    } finally {
      setLoading(false);
    }
  };

  if (!pool) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
      <div className="bg-orange-600 p-6 rounded w-96 text-white overflow-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-4">Remove Liquidity - Pool {pool.id}</h2>

        <input
          type="number"
          placeholder="LP Tokens to Remove"
          className="w-full mb-4 text-black rounded px-2 py-1"
          value={lpAmount}
          onChange={(e) => setLpAmount(Number(e.target.value))}
        />

        {chartData && <Bar data={chartData} options={options} className="mb-4" />}

        <div className="flex justify-between">
          <button className="bg-gray-800 px-4 py-2 rounded" onClick={onClose}>Cancel</button>
          <button className="bg-white text-orange-600 px-4 py-2 rounded" onClick={handleRemove} disabled={loading}>
            {loading ? "Processing..." : "Remove Liquidity"}
          </button>
        </div>
      </div>
    </div>
  );
}
