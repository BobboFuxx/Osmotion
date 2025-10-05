// src/components/WalletStatus.tsx
import React, { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useEndpoint } from "../hooks/useEndpoint";
import KeplrLogo from "../assets/keplr.svg";
import LeapLogo from "../assets/leap.svg";
import MetaMaskLogo from "../assets/metamask.svg";

const walletLogos: Record<string, string> = {
  keplr: KeplrLogo,
  leap: LeapLogo,
  metamask: MetaMaskLogo,
  mnemonic: "",
};

export const WalletStatus: React.FC = () => {
  const { account, walletType, connect, disconnect } = useWallet();
  const { currentEndpoint, endpoints, online, switchEndpoint, endpointType } = useEndpoint();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connect();
    } catch (err) {
      console.error("⚠️ Wallet connection failed:", err);
      alert("Failed to connect wallet. Check Keplr, Leap, or MetaMask.");
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

  const toggleModal = () => setShowModal(!showModal);

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      alert("Address copied to clipboard!");
    }
  };

  return (
    <div className="relative flex items-center space-x-2 text-white">
      {/* Wallet icon */}
      {walletType && walletLogos[walletType] && (
        <img src={walletLogos[walletType]} alt={walletType} className="w-5 h-5 cursor-pointer" onClick={toggleModal} />
      )}

      {/* Wallet address */}
      {account && (
        <span
          className="font-mono text-sm bg-gray-900 px-3 py-1 rounded border border-purple-500 cursor-pointer"
          onClick={toggleModal}
        >
          {shortAddress(account)}
        </span>
      )}

      {/* Endpoint status */}
      <div
        className={`w-3 h-3 rounded-full ${online ? "bg-green-500" : "bg-red-500"} border-2 border-orange-500 cursor-pointer`}
        title={`Endpoint ${currentEndpoint} (${endpointType}) is ${online ? "online" : "offline"}`}
        onClick={toggleModal}
      ></div>

      {/* Connect / Disconnect buttons */}
      {account ? (
        <button
          className="px-3 py-1 bg-purple-700 text-white rounded hover:bg-purple-600 transition"
          onClick={disconnect}
        >
          Disconnect
        </button>
      ) : (
        <button
          className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-500 transition disabled:opacity-50"
          onClick={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </button>
      )}

      {/* Modal for wallet + endpoint management */}
      {showModal && (
        <div className="absolute top-full right-0 mt-2 w-80 p-4 bg-gray-900 rounded shadow-lg z-50 border border-purple-500">
          <h4 className="font-bold mb-2 text-orange-400">Wallet Info</h4>
          <p>
            Type: {walletLabel()}
          </p>
          <p className="flex items-center justify-between">
            Address: {account}
            <button
              className="ml-2 px-2 py-0.5 bg-gray-800 rounded hover:bg-gray-700"
              onClick={copyAddress}
            >
              Copy
            </button>
          </p>

          <h4 className="font-bold mt-4 mb-2 text-orange-400">Endpoints</h4>
          <ul>
            {endpoints.map((ep) => (
              <li
                key={ep}
                className={`cursor-pointer p-1 rounded flex justify-between items-center ${
                  ep === currentEndpoint ? "bg-gray-800 border border-purple-500" : "hover:bg-gray-800"
                }`}
                onClick={() => switchEndpoint(ep)}
              >
                <span>{ep}</span>
                {ep === currentEndpoint && online && <span className="text-green-400 font-bold">✔️</span>}
              </li>
            ))}
          </ul>

          <button
            className="mt-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-500 transition"
            onClick={disconnect}
          >
            Disconnect Wallet
          </button>
        </div>
      )}
    </div>
  );
};
