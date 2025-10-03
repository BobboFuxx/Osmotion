// src/contexts/LimitOrdersContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { BlockchainClient, orderbookPlaceOrder, orderbookCancelOrder, orderbookQueryOrders } from "../utils/blockchain";

export interface LimitOrder {
  id: string;
  side: "buy" | "sell";
  price: string;
  quantity: string;
  baseDenom: string;
  quoteDenom: string;
  status: "open" | "filled" | "cancelled";
}

interface LimitOrdersContextType {
  orders: LimitOrder[];
  loading: boolean;
  placeOrder: (order: Omit<LimitOrder, "id" | "status">) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  refreshOrders: () => Promise<void>;
}

const LimitOrdersContext = createContext<LimitOrdersContextType | undefined>(undefined);

export const LimitOrdersProvider: React.FC<{
  client: BlockchainClient | null;
  orderbookAddress: string;
  children: React.ReactNode;
}> = ({ client, orderbookAddress, children }) => {
  const [orders, setOrders] = useState<LimitOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshOrders = useCallback(async () => {
    if (!client) return;
    try {
      setLoading(true);
      const result = await orderbookQueryOrders(client.client, orderbookAddress, client.signerAddress);
      setOrders(result.orders || []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  }, [client, orderbookAddress]);

  const placeOrder = useCallback(
    async (order: Omit<LimitOrder, "id" | "status">) => {
      if (!client) return;
      await orderbookPlaceOrder(client.client, client.signerAddress, orderbookAddress, order);
      await refreshOrders();
    },
    [client, orderbookAddress, refreshOrders]
  );

  const cancelOrder = useCallback(
    async (orderId: string) => {
      if (!client) return;
      await orderbookCancelOrder(client.client, client.signerAddress, orderbookAddress, orderId);
      await refreshOrders();
    },
    [client, orderbookAddress, refreshOrders]
  );

  useEffect(() => {
    if (client) {
      refreshOrders();
    }
  }, [client, refreshOrders]);

  return (
    <LimitOrdersContext.Provider
      value={{
        orders,
        loading,
        placeOrder,
        cancelOrder,
        refreshOrders,
      }}
    >
      {children}
    </LimitOrdersContext.Provider>
  );
};

export const useLimitOrdersContext = () => {
  const context = useContext(LimitOrdersContext);
  if (!context) throw new Error("useLimitOrdersContext must be used within a LimitOrdersProvider");
  return context;
};
