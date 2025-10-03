// src/components/WalletConnect.tsx
import React from "react";
import { useWallet } from "../hooks/useWallet";

const WalletConnect: React.FC = () => {
  const { account, connectWallet, disconnectWallet } = useWallet();

  return (
    <div>
      {account ? (
        <div className="flex items-center space-x-2">
          <span>Connected: {account}</span>
          <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={disconnectWallet}>
            Disconnect
          </button>
        </div>
      ) : (
        <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={connectWallet}>
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default WalletConnect;
