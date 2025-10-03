// src/components/SwapModal.tsx
import React, { useState } from "react";
import { useSwap } from "../hooks/useSwap";

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseDenom: string;
  quoteDenom: string;
}

const SwapModal: React.FC<SwapModalProps> = ({ isOpen, onClose, baseDenom, quoteDenom }) => {
  const { swapTokens } = useSwap();
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSwap = async () => {
    if (amount <= 0) return;
    setLoading(true);
    try {
      await swapTokens(baseDenom, quoteDenom, amount);
      setAmount(0);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Swap failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded w-96">
        <h2 className="text-xl font-bold mb-4">Swap {baseDenom} → {quoteDenom}</h2>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder={`Amount of ${baseDenom}`}
          className="w-full mb-4 p-2 rounded border"
        />
        <div className="flex justify-between">
          <button className="px-4 py-2 bg-gray-600 text-white rounded" onClick={onClose}>Cancel</button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={handleSwap}
            disabled={loading}
          >
            {loading ? "Swapping..." : "Swap"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SwapModal;
