// src/contexts/LimitOrdersContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { BlockchainClient, placeOrder, cancelOrder, queryOrders } from "../utils/blockchain";

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
      // Query all orders for this user
      const result = await queryOrders(client.client, orderbookAddress, {
        orders_by_user: { user: client.signerAddress },
      });

      // Map contract response -> our LimitOrder type
      const mapped: LimitOrder[] = (result.orders || []).map((o: any) => ({
        id: o.id,
        side: o.side,
        price: o.price,
        quantity: o.quantity,
        baseDenom: o.base_denom,
        quoteDenom: o.quote_denom,
        status: o.status,
      }));

      setOrders(mapped);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  }, [client, orderbookAddress]);

  const place = useCallback(
    async (order: Omit<LimitOrder, "id" | "status">) => {
      if (!client) return;

      await placeOrder(client.client, client.signerAddress, orderbookAddress, {
        pool_id: 1, // TODO: pick correct pool
        token_in: { denom: order.baseDenom, amount: order.quantity },
        token_out: order.quoteDenom,
        target_price: parseFloat(order.price),
        side: order.side,
      });

      await refreshOrders();
    },
    [client, orderbookAddress, refreshOrders]
  );

  const cancel = useCallback(
    async (orderId: string) => {
      if (!client) return;
      await cancelOrder(client.client, client.signerAddress, orderbookAddress, orderId);
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
        placeOrder: place,
        cancelOrder: cancel,
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
