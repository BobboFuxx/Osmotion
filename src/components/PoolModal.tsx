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
  initialMode?: "add" | "remove";
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
  const [errors, setErrors] = useState<{ amountA?: string; amountB?: string; lpAmount?: string }>({});

  const projectionDays = [1, 15, 180, 365]; // Epoch, 15d, 180d, 1yr

  // Update reward projections
  useEffect(() => {
    if (!pool) return;

    clearProjections();

    if (mode === "add") {
      const totalLiquidity = pool.liquidityA + pool.liquidityB;
      const estimatedLP = totalLiquidity > 0 ? ((amountA + amountB) / totalLiquidity) * pool.totalShares : 0;

      setProjection({ poolId: pool.id, token: pool.tokenA, deltaLiquidity: amountA });
      setProjection({ poolId: pool.id, token: pool.tokenB, deltaLiquidity: amountB });
      setLpAmount(estimatedLP);
    } else if (mode === "remove" && lpAmount > 0) {
      const fraction = lpAmount / pool.totalShares;
      setProjection({ poolId: pool.id, token: pool.tokenA, deltaLiquidity: -fraction * pool.liquidityA });
      setProjection({ poolId: pool.id, token: pool.tokenB, deltaLiquidity: -fraction * pool.liquidityB });
    }
  }, [amountA, amountB, lpAmount, pool, mode, setProjection, clearProjections]);

  // Clear projections when modal unmounts
  useEffect(() => () => clearProjections(), [clearProjections]);

  // Projected rewards
  const projectedRewards = useMemo(() => {
    if (!pool) return { [pool?.tokenA || ""]: 0, [pool?.tokenB || ""]: 0 };

    if (mode === "add") {
      const totalSharesAfter = pool.totalShares + lpAmount;
      const shareFraction = totalSharesAfter > 0 ? lpAmount / totalSharesAfter : 0;
      return {
        [pool.tokenA]: pool.swapFeesNextEpoch * shareFraction * (pool.liquidityA / (pool.liquidityA + pool.liquidityB)),
        [pool.tokenB]: pool.swapFeesNextEpoch * shareFraction * (pool.liquidityB / (pool.liquidityA + pool.liquidityB)),
      };
    } else {
      const fraction = lpAmount / pool.totalShares;
      return {
        [pool.tokenA]: pool.swapFeesNextEpoch * (1 - fraction) * (pool.liquidityA / (pool.liquidityA + pool.liquidityB)),
        [pool.tokenB]: pool.swapFeesNextEpoch * (1 - fraction) * (pool.liquidityB / (pool.liquidityA + pool.liquidityB)),
      };
    }
  }, [lpAmount, pool, mode]);

  // Chart data
  const chartData = useMemo(() => {
    if (!pool) return null;

    const projectedA = projectionDays.map((d) => projectedRewards[pool.tokenA] * d);
    const projectedB = projectionDays.map((d) => projectedRewards[pool.tokenB] * d);

    return {
      labels: ["Next Epoch", "15d", "180d", "1yr"],
      datasets: [
        { label: `${pool.tokenA} Rewards`, data: projectedA, backgroundColor: "rgba(155,89,182,0.7)" },
        { label: `${pool.tokenB} Rewards`, data: projectedB, backgroundColor: "rgba(255,111,60,0.7)" },
      ],
    };
  }, [projectedRewards, pool]);

  // Input validation
  const validateInputs = () => {
    const errs: typeof errors = {};
    if (mode === "add") {
      if (amountA <= 0) errs.amountA = "Enter a valid amount for token A";
      if (amountB <= 0) errs.amountB = "Enter a valid amount for token B";
    } else {
      if (lpAmount <= 0) errs.lpAmount = "Enter a valid LP token amount";
      else if (pool && lpAmount > pool.totalShares) errs.lpAmount = "Cannot remove more than total LP tokens";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAdd = async () => {
    if (!validateInputs()) return;
    if (!client || !account || !pool) return alert("⚠️ Wallet not connected or pool not found");

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
    if (!validateInputs()) return;
    if (!client || !account || !pool) return alert("⚠️ Wallet not connected or pool not found");

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
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-purple-700 p-6 rounded w-96 text-white overflow-auto max-h-[90vh]">
        <h2 className="text-xl font-bold mb-4">Pool {pool.id}</h2>

        {/* Mode Selector */}
        <div className="flex mb-4">
          <button className={`flex-1 py-2 rounded-l font-bold ${mode === "add" ? "bg-green-600" : "bg-gray-600"}`} onClick={() => setMode("add")}>
            Add Liquidity
          </button>
          <button className={`flex-1 py-2 rounded-r font-bold ${mode === "remove" ? "bg-red-600" : "bg-gray-600"}`} onClick={() => setMode("remove")}>
            Remove Liquidity
          </button>
        </div>

        {/* Inputs */}
        {mode === "add" ? (
          <>
            <input type="number" placeholder={pool.tokenA} className={`w-full mb-2 px-2 py-1 rounded text-black ${errors.amountA ? "border-2 border-red-500" : ""}`} value={amountA} onChange={(e) => setAmountA(Number(e.target.value))} />
            {errors.amountA && <p className="text-red-400 text-sm mb-2">{errors.amountA}</p>}

            <input type="number" placeholder={pool.tokenB} className={`w-full mb-2 px-2 py-1 rounded text-black ${errors.amountB ? "border-2 border-red-500" : ""}`} value={amountB} onChange={(e) => setAmountB(Number(e.target.value))} />
            {errors.amountB && <p className="text-red-400 text-sm mb-2">{errors.amountB}</p>}

            <input type="number" placeholder="Slippage %" className="w-full mb-4 px-2 py-1 rounded text-black" value={slippage} onChange={(e) => setSlippage(Number(e.target.value))} />

            {/* Real-time min LP display */}
            <p className="mb-4 text-sm">
              Minimum LP tokens you will receive:{" "}
              <span className="font-bold">{Math.floor(calcAmountWithSlippage(lpAmount, -slippage / 100))}</span>
            </p>
          </>
        ) : (
          <div className="flex gap-2 mb-4">
            <input type="number" placeholder="LP Tokens to Remove" className={`flex-1 px-2 py-1 rounded text-black ${errors.lpAmount ? "border-2 border-red-500" : ""}`} value={lpAmount} onChange={(e) => setLpAmount(Number(e.target.value))} />
            <button className="bg-red-500 px-2 rounded text-white" onClick={() => setLpAmount(pool.totalShares)}>Use Max</button>
            {errors.lpAmount && <p className="text-red-400 text-sm">{errors.lpAmount}</p>}
          </div>
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
          <button className="bg-gray-800 px-4 py-2 rounded" onClick={onClose}>Cancel</button>
          <button className={`px-4 py-2 rounded font-bold ${mode === "add" ? "bg-white text-purple-700" : "bg-white text-orange-600"}`} onClick={mode === "add" ? handleAdd : handleRemove} disabled={loading}>
            {loading ? "Processing..." : mode === "add" ? "Add Liquidity" : "Remove Liquidity"}
          </button>
        </div>
      </div>
    </div>
  );
}
