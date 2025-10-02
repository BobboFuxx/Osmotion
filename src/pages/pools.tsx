import { useState } from "react";
import PoolList from "../components/PoolList";
import AddLiquidityModal from "../components/AddLiquidityModal";
import RemoveLiquidityModal from "../components/RemoveLiquidityModal";
import { usePools, PoolInfo } from "../hooks/usePools";

export default function PoolsPage() {
  const { pools, loading } = usePools();
  const [selectedPool, setSelectedPool] = useState<PoolInfo | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showRemove, setShowRemove] = useState(false);

  if (loading) return <p className="text-white text-center mt-8">Loading pools...</p>;
  if (!pools.length) return <p className="text-white text-center mt-8">No pools found.</p>;

  return (
    <div className="p-6 bg-black min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-6">Liquidity Pools</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pools.map((pool) => (
          <div key={pool.id} className="bg-gray-800 p-4 rounded text-white">
            <h3 className="font-bold mb-2">
              Pool {pool.id}: {pool.tokenA}/{pool.tokenB}
            </h3>
            <p className="mb-2">Current APR: {pool.apr.toFixed(2)}%</p>
            <p className="mb-4">Swap Fees Next Epoch: {pool.swapFeesNextEpoch.toFixed(4)}</p>

            <div className="flex gap-2">
              <button
                className="bg-purple-700 px-4 py-2 rounded hover:bg-purple-600 transition"
                onClick={() => {
                  setSelectedPool(pool);
                  setShowAdd(true);
                }}
              >
                Add
              </button>
              <button
                className="bg-orange-600 px-4 py-2 rounded hover:bg-orange-500 transition"
                onClick={() => {
                  setSelectedPool(pool);
                  setShowRemove(true);
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && selectedPool && (
        <AddLiquidityModal
          poolId={selectedPool.id}
          onClose={() => setShowAdd(false)}
        />
      )}

      {showRemove && selectedPool && (
        <RemoveLiquidityModal
          poolId={selectedPool.id}
          onClose={() => setShowRemove(false)}
        />
      )}
    </div>
  );
}
