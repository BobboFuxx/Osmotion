import WalletConnect from "../components/WalletConnect";
import EndpointSelector from "../components/EndpointSelector";
import PoolList from "../components/PoolList";
import SwapModal from "../components/SwapModal";
import RewardsTracker from "../components/RewardsTracker";

export default function Dashboard() {
  return (
    <div className="min-h-screen p-8 bg-background text-white">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-primary">Osmotion</h1>
        <WalletConnect />
        <EndpointSelector />
      </header>
      <main>
        <PoolList />
        <SwapModal />
        <RewardsTracker />
      </main>
    </div>
  );
}
