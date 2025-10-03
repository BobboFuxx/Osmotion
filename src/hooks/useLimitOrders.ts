// src/hooks/useLimitOrders.ts
import { useState, useCallback, useEffect } from "react";
import { BlockchainClient, orderbookPlaceOrder, orderbookCancelOrder, orderbookQueryOrders } from "../utils/blockchain";

interface LimitOrder {
  id: string;
  side: "buy" | "sell";
  price: string;
  quantity: string;
  baseDenom: string;
  quoteDenom: string;
  status: "open" | "filled" | "cancelled";
}

export function useLimitOrders(client: BlockchainClient | null, orderbookAddress: string) {
  const [orders, setOrders] = useState<LimitOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshOrders = useCallback(async () => {
    if (!client) return;
    try {
      setLoading(true);
      const data = await orderbookQueryOrders(client.client, orderbookAddress, client.signerAddress);
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Error fetching limit orders:", err);
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

  return {
    orders,
    loading,
    placeOrder,
    cancelOrder,
    refreshOrders,
  };
}
