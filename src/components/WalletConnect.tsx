// src/components/WalletConnect.tsx
import React, { useState } from "react";
import { useWallet } from "../hooks/useWallet";

const WalletConnect: React.FC = () => {
  const { account, walletType, connect, disconnect } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connect();
    } catch (err) {
      console.error("⚠️ Wallet connection failed:", err);
      alert("Failed to connect wallet. Please check Keplr, Leap, or MetaMask.");
    } finally {
      setIsConnecting(false);
    }
  };

  const shortAddress = (addr: string) =>
    addr ? `${addr.slice(0, 8)}...${addr.slice(-4)}` : "";

  const walletLabel = () => {
    switch (walletType) {
      case "keplr":
        return "Keplr";
      case "leap":
        return "Leap";
      case "metamask":
        return "MetaMask (via Leap)";
      case "mnemonic":
        return "Mnemonic";
      default:
        return "";
    }
  };

  return (
    <div className="flex items-center space-x-3 text-white">
      {account ? (
        <>
          <span className="font-mono text-sm bg-gray-700 px-3 py-1 rounded">
            {shortAddress(account)}
          </span>
          {walletType && (
            <span className="text-xs text-gray-300 italic">{walletLabel()}</span>
          )}
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
