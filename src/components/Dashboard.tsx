// src/components/Dashboard.tsx
import React from "react";
import OrderBook from "./OrderBook";
import RewardsTracker from "./RewardsTracker";
import { usePools } from "../hooks/usePools";

interface DashboardProps {
  baseDenom: string;
  quoteDenom: string;
}

const Dashboard: React.FC<DashboardProps> = ({ baseDenom, quoteDenom }) => {
  const { pools } = usePools();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      {/* Order Book */}
      <OrderBook baseDenom={baseDenom} quoteDenom={quoteDenom} />

      {/* Rewards Tracker */}
      <RewardsTracker />

      {/* Pools Overview */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Pools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pools.map((pool) => (
            <div key={pool.id} className="border rounded p-4 bg-white dark:bg-gray-800">
              <h3 className="font-bold mb-2">Pool {pool.id}</h3>
              <p>{pool.tokenA} / {pool.tokenB}</p>
              <p>Total Liquidity: {pool.liquidityA + pool.liquidityB}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
