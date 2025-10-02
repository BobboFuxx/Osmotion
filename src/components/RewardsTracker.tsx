import { useRewards } from "../hooks/useRewards";

export default function RewardsTracker() {
  const { rewards, loading } = useRewards();

  if (loading) return <div>Loading rewards...</div>;
  if (!rewards.length) return <div>No rewards found for your account.</div>;

  return (
    <div className="p-4 bg-black rounded border border-primary mt-4">
      <h2 className="text-xl font-bold text-primary mb-4">Your Rewards</h2>
      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="px-2 py-1">Pool ID</th>
            <th className="px-2 py-1">Token</th>
            <th className="px-2 py-1">Next Epoch</th>
            <th className="px-2 py-1">15d / 180d / 1yr</th>
            <th className="px-2 py-1">Swap Fees Next Epoch</th>
            <th className="px-2 py-1">APR %</th>
          </tr>
        </thead>
        <tbody>
          {rewards.map((r) => (
            <tr key={r.poolId} className="border-t border-gray-700">
              <td className="px-2 py-1">{r.poolId}</td>
              <td className="px-2 py-1">{r.token}</td>
              <td className="px-2 py-1">{r.nextEpoch.toFixed(4)}</td>
              <td className="px-2 py-1">
                {(r.nextEpoch * 15).toFixed(4)} / {(r.nextEpoch * 180).toFixed(4)} /{" "}
                {(r.nextEpoch * 365).toFixed(4)}
              </td>
              <td className="px-2 py-1">{r.feesNextEpoch.toFixed(4)}</td>
              <td className="px-2 py-1">{r.apr.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
