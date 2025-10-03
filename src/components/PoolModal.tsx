// src/components/PoolModal.tsx
import { useState, useMemo, useEffect } from "react";
import { useWallet } from "../hooks/useWallet";
import { addLiquidity, removeLiquidity } from "../utils/blockchain";
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
import { calcAmountWithSlippage } from "@osmonauts/math";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface PoolModalProps {
  poolId: number;
  initialMode?: "add" | "remove"; // optional, defaults to "add"
  onClose: () => void;
}

export default function PoolModal({ poolId, initialMode = "add", onClose }: PoolModalProps) {
  const { account, client } = useWallet();
  const { pools } = usePools();
  const pool = pools.find((p) => p.id === poolId);
  const { setProjection, clearProjections } = useRewardsProjection();

  const [mode, setMode] = useState<"add" | "remove">(initialMode);
  const [amountA, setAmountA] = useState(0);
  const [amountB, setAmountB] = useState(0);
  const [lpAmount, setLpAmount] = useState(0);
  const [slippage, setSlippage] = useState(0.5);
  const [loading, setLoading] = useState(false);

  // Update reward projections
  useEffect(() => {
    if (!pool) return;
    clearProjections();

    if (mode === "add") {
      const totalLiquidityValue = pool.liquidityA + pool.liquidityB;
      const deltaValue = amountA + amountB;
      const estimatedLP = totalLiquidityValue > 0 ? (deltaValue / totalLiquidityValue) * pool.totalShares : 0;

      setProjection({ poolId: pool.id, token: pool.tokenA, deltaLiquidity: amountA });
      setProjection({ poolId: pool.id, token: pool.tokenB, deltaLiquidity: amountB });
      setLpAmount(estimatedLP);
    } else if (mode === "remove" && lpAmount > 0) {
      const fraction = lpAmount / pool.totalShares;
      setProjection({ poolId: pool.id, token: pool.tokenA, deltaLiquidity: -fraction * pool.liquidityA });
      setProjection({ poolId: pool.id, token: pool.tokenB, deltaLiquidity: -fraction * pool.liquidityB });
    }
  }, [amountA, amountB, lpAmount, pool, mode, setProjection, clearProjections]);

  useEffect(() => () => clearProjections(), [clearProjections]);

  const projectionDays = [15, 180, 365];

  // Accurate projected rewards based on LP share fraction
  const projectedRewards = useMemo(() => {
    if (!pool) return { [pool?.tokenA || ""]: 0, [pool?.tokenB || ""]: 0 };

    if (mode === "add") {
      const totalSharesAfter = pool.totalShares + lpAmount;
      const shareFraction = totalSharesAfter > 0 ? lpAmount / totalSharesAfter : 0;

      return {
        [pool.tokenA]:
          pool.swapFeesNextEpoch * shareFraction * (pool.liquidityA / (pool.liquidityA + pool.liquidityB)),
        [pool.tokenB]:
          pool.swapFeesNextEpoch * shareFraction * (pool.liquidityB / (pool.liquidityA + pool.liquidityB)),
      };
    } else {
      const fraction = lpAmount / pool.totalShares;
      return {
        [pool.tokenA]:
          pool.swapFeesNextEpoch * (1 - fraction) * (pool.liquidityA / (pool.liquidityA + pool.liquidityB)),
        [pool.tokenB]:
          pool.swapFeesNextEpoch * (1 - fraction) * (pool.liquidityB / (pool.liquidityA + pool.liquidityB)),
      };
    }
  }, [lpAmount, pool, mode]);

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

  const handleAdd = async () => {
    if (!client || !account || !pool) return alert("⚠️ Wallet not connected or pool not found");
    if (amountA <= 0 || amountB <= 0) return alert("⚠️ Enter valid amounts");

    setLoading(true);
    try {
      const tokenA = { denom: pool.tokenA, amount: amountA.toString() };
      const tokenB = { denom: pool.tokenB, amount: amountB.toString() };
      const shareOutMin = Math.floor(calcAmountWithSlippage(lpAmount, -slippage / 100)).toString();

      const txHash = await addLiquidity(client.client, account, pool.id, tokenA, tokenB, shareOutMin);
      alert(`✅ Liquidity added! Tx Hash: ${txHash}`);
      clearProjections();
      onClose();
    } catch (err) {
      console.error(err);
      alert("❌ Transaction failed - check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!client || !account || !pool) return alert("⚠️ Wallet not connected or pool not found");
    if (lpAmount <= 0) return alert("⚠️ Enter a valid LP token amount");

    setLoading(true);
    try {
      const txHash = await removeLiquidity(client.client, account, pool.id, lpAmount.toString(), [
        { denom: pool.tokenA, amount: "0" },
        { denom: pool.tokenB, amount: "0" },
      ]);
      alert(`✅ Liquidity removed! Tx Hash: ${txHash}`);
      clearProjections();
      onClose();
    } catch (err) {
      console.error(err);
      alert("❌ Transaction failed - check console for details.");
    } finally {
      setLoading(false);
    }
  };

  if (!pool) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
      <div className="bg-purple-700 p-6 rounded w-96 text-white overflow-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-4">Pool {pool.id}</h2>

        {/* Mode Selector */}
        <div className="flex mb-4">
          <button
            className={`flex-1 py-2 rounded-l font-bold ${mode === "add" ? "bg-green-600" : "bg-gray-600"}`}
            onClick={() => setMode("add")}
          >
            Add Liquidity
          </button>
          <button
            className={`flex-1 py-2 rounded-r font-bold ${mode === "remove" ? "bg-red-600" : "bg-gray-600"}`}
            onClick={() => setMode("remove")}
          >
            Remove Liquidity
          </button>
        </div>

        {/* Inputs */}
        {mode === "add" ? (
          <>
            <input
              type="number"
              placeholder={pool.tokenA}
              className="w-full mb-2 text-black rounded px-2 py-1"
              value={amountA}
              onChange={(e) => setAmountA(Number(e.target.value))}
            />
            <input
              type="number"
              placeholder={pool.tokenB}
              className="w-full mb-2 text-black rounded px-2 py-1"
              value={amountB}
              onChange={(e) => setAmountB(Number(e.target.value))}
            />
            <input
              type="number"
              placeholder="Slippage %"
              className="w-full mb-4 text-black rounded px-2 py-1"
              value={slippage}
              onChange={(e) => setSlippage(Number(e.target.value))}
            />
          </>
        ) : (
          <input
            type="number"
            placeholder="LP Tokens to Remove"
            className="w-full mb-4 text-black rounded px-2 py-1"
            value={lpAmount}
            onChange={(e) => setLpAmount(Number(e.target.value))}
          />
        )}

        {/* Chart */}
        {chartData && (
          <Bar
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "top" },
                title: { display: true, text: `Projected Rewards for Pool ${pool.id}` },
                tooltip: { callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${ctx.raw.toFixed(4)}` } },
              },
            }}
            className="mb-4"
          />
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <button className="bg-gray-800 px-4 py-2 rounded" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`px-4 py-2 rounded font-bold ${mode === "add" ? "bg-white text-purple-700" : "bg-white text-orange-600"}`}
            onClick={mode === "add" ? handleAdd : handleRemove}
            disabled={loading}
          >
            {loading ? "Processing..." : mode === "add" ? "Add Liquidity" : "Remove Liquidity"}
          </button>
        </div>
      </div>
    </div>
  );
}
