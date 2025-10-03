import { useState, useMemo } from "react";
import { useWallet } from "../hooks/useWallet";
import { addLiquidity } from "../utils/blockchain";
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface AddLiquidityModalProps {
  poolId: number;
  onClose: () => void;
}

export default function AddLiquidityModal({ poolId, onClose }: AddLiquidityModalProps) {
  const { account, client } = useWallet();
  const { pools } = usePools();
  const pool = pools.find((p) => p.id === poolId);

  const [amountA, setAmountA] = useState(0);
  const [amountB, setAmountB] = useState(0);
  const [loading, setLoading] = useState(false);

  // Projected rewards
  const projectedRewards = useMemo(() => {
    if (!pool) return { [pool?.tokenA || ""]: 0, [pool?.tokenB || ""]: 0 };
    const totalShares = pool.totalShares + amountA + amountB;
    const shareFraction = (amountA + amountB) / totalShares;
    return {
      [pool.tokenA]: pool.swapFeesNextEpoch * shareFraction * (pool.liquidityA / (pool.liquidityA + pool.liquidityB)),
      [pool.tokenB]: pool.swapFeesNextEpoch * shareFraction * (pool.liquidityB / (pool.liquidityA + pool.liquidityB)),
    };
  }, [amountA, amountB, pool]);

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
      tooltip: {
        callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${ctx.raw.toFixed(4)}` },
      },
    },
  };

  const handleAdd = async () => {
    if (!client || !account || !pool) return alert("Wallet not connected or pool not found");
    setLoading(true);
    try {
      await addLiquidity(client, account, poolId, amountA, pool.tokenA, amountB, pool.tokenB);
      alert("Liquidity added successfully!");
      onClose();
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
      <div className="bg-purple-700 p-6 rounded w-96 text-white overflow-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-4">Add Liquidity - Pool {pool.id}</h2>

        <input type="number" placeholder={pool.tokenA} className="w-full mb-2 text-black rounded px-2 py-1" value={amountA} onChange={(e) => setAmountA(Number(e.target.value))} />
        <input type="number" placeholder={pool.tokenB} className="w-full mb-4 text-black rounded px-2 py-1" value={amountB} onChange={(e) => setAmountB(Number(e.target.value))} />

        {chartData && <Bar data={chartData} options={options} className="mb-4" />}

        <div className="flex justify-between">
          <button className="bg-gray-800 px-4 py-2 rounded" onClick={onClose}>Cancel</button>
          <button className="bg-white text-purple-700 px-4 py-2 rounded" onClick={handleAdd} disabled={loading}>
            {loading ? "Processing..." : "Add Liquidity"}
          </button>
        </div>
      </div>
    </div>
  );
}
