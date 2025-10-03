// src/components/OrderBook.tsx
import React, { useEffect } from "react";
import { useLimitOrdersContext } from "../contexts/LimitOrdersContext";
import PlaceOrderForm from "./PlaceOrderForm";

interface OrderBookProps {
  baseDenom: string;
  quoteDenom: string;
}

const OrderBook: React.FC<OrderBookProps> = ({ baseDenom, quoteDenom }) => {
  const { orders, loading, cancelOrder, refreshOrders } = useLimitOrdersContext();

  // Filter orders for this trading pair
  const buyOrders = orders
    .filter(o => o.side === "buy" && o.baseDenom === baseDenom && o.quoteDenom === quoteDenom)
    .sort((a, b) => parseFloat(b.price) - parseFloat(a.price)); // highest bid first

  const sellOrders = orders
    .filter(o => o.side === "sell" && o.baseDenom === baseDenom && o.quoteDenom === quoteDenom)
    .sort((a, b) => parseFloat(a.price) - parseFloat(b.price)); // lowest ask first

  useEffect(() => {
    const interval = setInterval(refreshOrders, 10_000); // auto-refresh every 10s
    return () => clearInterval(interval);
  }, [refreshOrders]);

  return (
    <div className="p-4 border rounded shadow-lg bg-white dark:bg-gray-800">
      <h2 className="text-xl font-bold mb-4">
        Order Book: {baseDenom}/{quoteDenom}
      </h2>

      {/* Place Order Form */}
      <PlaceOrderForm baseDenom={baseDenom} quoteDenom={quoteDenom} />

      {/* Orders Table */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        {/* Buy Orders */}
        <div>
          <h3 className="font-semibold mb-2">Buy Orders</h3>
          {loading && <p>Loading buy orders...</p>}
          <ul>
            {buyOrders.length === 0 && !loading && <li>No buy orders</li>}
            {buyOrders.map((order, idx) => (
              <li
                key={order.id}
                className={`flex justify-between ${
                  idx === 0 ? "font-bold" : ""
                } text-green-600`}
              >
                <span>{order.quantity} {baseDenom}</span>
                <span>@ {order.price} {quoteDenom}</span>
                <button
                  className="ml-2 text-red-500 hover:underline"
                  onClick={() => cancelOrder(order.id)}
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Sell Orders */}
        <div>
          <h3 className="font-semibold mb-2">Sell Orders</h3>
          {loading && <p>Loading sell orders...</p>}
          <ul>
            {sellOrders.length === 0 && !loading && <li>No sell orders</li>}
            {sellOrders.map((order, idx) => (
              <li
                key={order.id}
                className={`flex justify-between ${
                  idx === 0 ? "font-bold" : ""
                } text-red-600`}
              >
                <span>{order.quantity} {baseDenom}</span>
                <span>@ {order.price} {quoteDenom}</span>
                <button
                  className="ml-2 text-red-500 hover:underline"
                  onClick={() => cancelOrder(order.id)}
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
