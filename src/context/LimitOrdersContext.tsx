// src/contexts/LimitOrdersContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { BlockchainClient, placeLimitOrder } from "../utils/blockchain";

export interface LimitOrder {
  id: string;
  sender: string;
  poolId: number;
  tokenIn: { denom: string; amount: string };
  tokenOutDenom: string;
  targetPrice: number;
  side: "buy" | "sell";
}

interface LimitOrdersContextType {
  orders: LimitOrder[];
  addOrder: (order: Omit<LimitOrder, "id">) => void;
  removeOrder: (id: string) => void;
  processOrders: () => Promise<void>;
}

const LimitOrdersContext = createContext<LimitOrdersContextType | undefined>(undefined);

export const LimitOrdersProvider: React.FC<{ client: BlockchainClient }> = ({ client, children }) => {
  const [orders, setOrders] = useState<LimitOrder[]>([]);

  const addOrder = (order: Omit<LimitOrder, "id">) => {
    const id = `${Date.now()}-${Math.random()}`;
    setOrders(prev => [...prev, { ...order, id }]);
  };

  const removeOrder = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  const processOrders = async () => {
    for (const order of orders) {
      const txHash = await placeLimitOrder(
        client.client,
        order.sender,
        order.poolId,
        order.tokenIn,
        order.tokenOutDenom,
        order.targetPrice,
        order.side
      );

      if (txHash) {
        console.log(`Limit order executed! TxHash: ${txHash}`);
        removeOrder(order.id);
      }
    }
  };

  // Optional: auto-process every N seconds
  useEffect(() => {
    const interval = setInterval(processOrders, 10_000); // every 10 seconds
    return () => clearInterval(interval);
  }, [orders]);

  return (
    <LimitOrdersContext.Provider value={{ orders, addOrder, removeOrder, processOrders }}>
      {children}
    </LimitOrdersContext.Provider>
  );
};

export const useLimitOrders = () => {
  const context = useContext(LimitOrdersContext);
  if (!context) throw new Error("useLimitOrders must be used within a LimitOrdersProvider");
  return context;
};
