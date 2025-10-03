// src/components/PlaceOrderForm.tsx
import React, { useState } from "react";
import { useLimitOrdersContext } from "../contexts/LimitOrdersContext";

interface PlaceOrderFormProps {
  baseDenom: string;
  quoteDenom: string;
}

const PlaceOrderForm: React.FC<PlaceOrderFormProps> = ({ baseDenom, quoteDenom }) => {
  const { placeOrder } = useLimitOrdersContext();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPrice = price.trim();
    const trimmedQuantity = quantity.trim();
    if (!trimmedPrice || !trimmedQuantity) return;
    if (parseFloat(trimmedPrice) <= 0 || parseFloat(trimmedQuantity) <= 0) return;

    setLoading(true);
    try {
      await placeOrder({
        side,
        price: trimmedPrice,
        quantity: trimmedQuantity,
        baseDenom,
        quoteDenom,
      });
      setPrice("");
      setQuantity("");
    } catch (err) {
      console.error("Failed to place order:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border p-4 rounded mb-4 bg-gray-50 dark:bg-gray-700"
    >
      <div className="flex flex-col md:flex-row gap-4 mb-2">
        <label className="flex-1">
          Side:
          <select
            value={side}
            onChange={(e) => setSide(e.target.value as "buy" | "sell")}
            className="ml-2 p-1 rounded w-full"
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </label>
        <label className="flex-1">
          Price ({quoteDenom}):
          <input
            type="number"
            step="any"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="ml-2 p-1 rounded w-full"
            min="0"
          />
        </label>
        <label className="flex-1">
          Quantity ({baseDenom}):
          <input
            type="number"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="ml-2 p-1 rounded w-full"
            min="0"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2 mt-2 rounded font-bold text-white ${
          side === "buy" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
        }`}
      >
        {loading
          ? "Placing..."
          : side === "buy"
          ? "Place Buy Order"
          : "Place Sell Order"}
      </button>
    </form>
  );
};

export default PlaceOrderForm;
