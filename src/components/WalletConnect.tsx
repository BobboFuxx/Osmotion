// src/components/WalletConnect.tsx
import React from "react";
import { useWallet } from "../hooks";

const WalletConnect: React.FC = () => {
  const { account, connect, client } = useWallet();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  };

  const handleDisconnect = () => {
    // For now, just clear client/account locally
    // (we can later extend useWallet to add a proper disconnect() method)
    window.location.reload();
  };

  return (
    <div>
      {account ? (
        <div className="flex items-center space-x-2 text-white">
          <span>Connected: {account}</span>
          <button
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-500 transition"
            onClick={handleDisconnect}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-500 transition"
          onClick={handleConnect}
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default WalletConnect;
