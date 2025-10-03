// src/components/MarginTrading.tsx
import React, { useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useLimitOrdersContext } from "../contexts/LimitOrdersContext";
import PlaceOrderForm from "./PlaceOrderForm";

const MarginTrading: React.FC = () => {
  const { walletAddress, connectWallet } = useWallet();
  const { orders, placeOrder, cancelOrder } = useLimitOrdersContext();
  const [selectedPair, setSelectedPair] = useState<{ base: string; quote: string }>({
    base: "ATOM",
    quote: "OSMO",
  });

  if (!walletAddress) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Margin Trading</h2>
        <button
          onClick={connectWallet}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded shadow-lg bg-white dark:bg-gray-800">
      <h2 className="text-xl font-bold mb-4">Margin Trading</h2>

      {/* Pair Selector */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={selectedPair.base}
          onChange={(e) => setSelectedPair({ ...selectedPair, base: e.target.value.toUpperCase() })}
          className="border p-1 rounded w-20"
        />
        <span>/</span>
        <input
          type="text"
          value={selectedPair.quote}
          onChange={(e) => setSelectedPair({ ...selectedPair, quote: e.target.value.toUpperCase() })}
          className="border p-1 rounded w-20"
        />
      </div>

      {/* Place Order Form */}
      <PlaceOrderForm baseDenom={selectedPair.base} quoteDenom={selectedPair.quote} />

      {/* Existing Orders */}
      <div className="mt-6">
        <h3 className="font-semibold mb-2">Open Orders</h3>
        {orders
          .filter(
            (o) =>
              o.baseDenom === selectedPair.base &&
              o.quoteDenom === selectedPair.quote
          )
          .map((order) => (
            <div key={order.id} className="flex justify-between items-center mb-1">
              <span>
                {order.side.toUpperCase()}: {order.quantity} {order.baseDenom} @ {order.price} {order.quoteDenom}
              </span>
              <button
                onClick={() => cancelOrder(order.id)}
                className="text-red-500 hover:underline"
              >
                Cancel
              </button>
            </div>
          ))}
      </div>
    </div>
  );
};

export default MarginTrading;
