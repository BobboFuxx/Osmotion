import { useRewards } from "../hooks/useRewards";
import { useWallet } from "../hooks/useWallet";
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

export default function RewardsTracker() {
  const { account } = useWallet();
  const { rewards, loading } = useRewards(account);

  if (!account) return <div className="text-white">Connect wallet to view rewards</div>;
  if (loading) return <div className="text-white">Loading rewards...</div>;
  if (!rewards.length) return <div className="text-white">No rewards found for your account.</div>;

  const projectionDays = [15, 180, 365]; // days for projection

  return (
    <div className="p-4 bg-black rounded border border-primary mt-4">
      <h2 className="text-xl font-bold text-primary mb-4">Your Rewards</h2>

      {rewards.map((pool) => (
        <div key={pool.poolId} className="mb-6">
          {pool.rewards.map((r) => {
            // Projected rewards
            const projectedRewards = projectionDays.map((days) => r.nextEpoch * days);
            const projectedFees = projectionDays.map((days) => r.feesNextEpoch * days);

            const chartData = {
              labels: ["Next Epoch", "15d", "180d", "1yr"],
              datasets: [
                {
                  label: `${r.token} Rewards`,
                  data: [r.nextEpoch, ...projectedRewards],
                  backgroundColor: "rgba(155, 89, 182, 0.7)", // Purple
                },
                {
                  label: `${r.token} Swap Fees`,
                  data: [r.feesNextEpoch, ...projectedFees],
                  backgroundColor: "rgba(255, 111, 60, 0.7)", // Orange
                },
              ],
            };

            const options = {
              responsive: true,
              plugins: {
                legend: { position: "top" },
                title: {
                  display: true,
                  text: `Pool ${pool.poolId} - ${r.token} Rewards Projection`,
                },
                tooltip: {
                  callbacks: {
                    label: function (context: any) {
                      return `${context.dataset.label}: ${context.raw.toFixed(4)}`;
                    },
                  },
                },
              },
            };

            return (
              <div key={r.token} className="mb-4">
                <Bar data={chartData} options={options} />
                <div className="mt-2 text-white">
                  APR: {r.apr.toFixed(2)}%
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
