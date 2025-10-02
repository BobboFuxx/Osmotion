import { useState, useMemo } from "react";
import { useWallet } from "../hooks/useWallet";
import { removeLiquidity } from "../utils/blockchain";
import { usePools, PoolInfo } from "../hooks/usePools";

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

  const projectedAPR = useMemo(() => {
    if (!pool) return 0;
    const shareFraction = lpAmount / pool.totalShares;
    const newLiquidityA = pool.liquidityA - pool.liquidityA * shareFraction;
    const newLiquidityB = pool.liquidityB - pool.liquidityB * shareFraction;
    const totalLiquidity = newLiquidityA + newLiquidityB;
    return pool.swapFeesNextEpoch / totalLiquidity * 365 * 100; // simple APR estimate
  }, [lpAmount, pool]);

  const handleRemove = async () => {
    if (!client || !account || !pool) return alert("Wallet not connected or pool not found");
    setLoading(true);
    try {
      const res = await removeLiquidity(client, account, poolId, lpAmount);
      console.log("Transaction result:", res);
      alert("Liquidity removed successfully!");
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
      <div className="bg-orange-600 p-6 rounded w-96 text-white">
        <h2 className="text-xl font-bold mb-4">Remove Liquidity - Pool {pool.id}</h2>

        <input
          type="number"
          placeholder="LP Tokens"
          className="w-full mb-4 text-black rounded px-2 py-1"
          value={lpAmount}
          onChange={(e) => setLpAmount(Number(e.target.value))}
        />

        <div className="mb-4">
          <p>Current APR: {pool.apr.toFixed(2)}%</p>
          <p>Projected APR after removing: {projectedAPR.toFixed(2)}%</p>
        </div>

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
