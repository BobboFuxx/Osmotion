// src/components/WalletConnect.tsx
import React, { useState } from "react";
import { useWallet } from "../hooks/useWallet";

const WalletConnect: React.FC = () => {
  const { account, connect, disconnect } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connect();
    } catch (err) {
      console.error("⚠️ Wallet connection failed:", err);
      alert("Failed to connect wallet. Please try again or check Keplr.");
    } finally {
      setIsConnecting(false);
    }
  };

  const shortAddress = (addr: string) =>
    addr ? `${addr.slice(0, 8)}...${addr.slice(-4)}` : "";

  return (
    <div className="flex items-center space-x-3 text-white">
      {account ? (
        <>
          <span className="font-mono text-sm bg-gray-700 px-3 py-1 rounded">
            {shortAddress(account)}
          </span>
          <button
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-500 transition"
            onClick={disconnect}
          >
            Disconnect
          </button>
        </>
      ) : (
        <button
          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-500 transition disabled:opacity-50"
          onClick={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </button>
      )}
    </div>
  );
};

export default WalletConnect;
