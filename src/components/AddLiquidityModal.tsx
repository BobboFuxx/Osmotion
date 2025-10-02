import { useState, useMemo } from "react";
import { useWallet } from "../hooks/useWallet";
import { addLiquidity } from "../utils/blockchain";
import { usePools, PoolInfo } from "../hooks/usePools";

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

  // Projected APR after adding liquidity
  const projectedAPR = useMemo(() => {
    if (!pool) return 0;
    const newLiquidityA = pool.liquidityA + amountA;
    const newLiquidityB = pool.liquidityB + amountB;
    const totalLiquidity = newLiquidityA + newLiquidityB;
    return pool.swapFeesNextEpoch / totalLiquidity * 365 * 100;
  }, [amountA, amountB, pool]);

  // Projected rewards per token
  const projectedRewards = useMemo(() => {
    if (!pool) return { [pool?.tokenA || ""]: 0, [pool?.tokenB || ""]: 0 };
    const totalShares = pool.totalShares + amountA + amountB;
    const shareFraction = (amountA + amountB) / totalShares;

    return {
      [pool.tokenA]: pool.swapFeesNextEpoch * shareFraction * (pool.liquidityA / (pool.liquidityA + pool.liquidityB)),
      [pool.tokenB]: pool.swapFeesNextEpoch * shareFraction * (pool.liquidityB / (pool.liquidityA + pool.liquidityB)),
    };
  }, [amountA, amountB, pool]);

  const handleAdd = async () => {
    if (!client || !account || !pool) return alert("Wallet not connected or pool not found");
    setLoading(true);
    try {
      const res = await addLiquidity(client, account, poolId, amountA, pool.tokenA, amountB, pool.tokenB);
      console.log("Transaction result:", res);
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
      <div className="bg-purple-700 p-6 rounded w-96 text-white">
        <h2 className="text-xl font-bold mb-4">Add Liquidity - Pool {pool.id}</h2>

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
          className="w-full mb-4 text-black rounded px-2 py-1"
          value={amountB}
          onChange={(e) => setAmountB(Number(e.target.value))}
        />

        <div className="mb-4">
          <p>Current APR: {pool.apr.toFixed(2)}%</p>
          <p>Projected APR: {projectedAPR.toFixed(2)}%</p>
          <p>Projected Rewards:</p>
          <ul className="ml-4">
            <li>{pool.tokenA}: {projectedRewards[pool.tokenA]?.toFixed(4)}</li>
            <li>{pool.tokenB}: {projectedRewards[pool.tokenB]?.toFixed(4)}</li>
          </ul>
        </div>

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
