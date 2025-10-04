import { useState, useEffect } from "react";

export interface Order {
  price: number;
  amount: number;
}

export function useOrderbook(symbol: string, refreshIntervalMs: number = 5000) {
  const [orders, setOrders] = useState<{ bids: Order[]; asks: Order[] }>({
    bids: [],
    asks: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchOrderbook = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://api-osmosis.imperator.co/orderbook/v1/${symbol}`
      );
      const data = await res.json();

      const mapped = {
        bids: data.bids?.map((o: any) => ({
          price: Number(o.price),
          amount: Number(o.amount),
        })) ?? [],
        asks: data.asks?.map((o: any) => ({
          price: Number(o.price),
          amount: Number(o.amount),
        })) ?? [],
      };

      setOrders(mapped);
    } catch (err) {
      console.error("Failed to fetch orderbook:", err);
      setOrders({ bids: [], asks: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderbook();
    const interval = setInterval(fetchOrderbook, refreshIntervalMs);
    return () => clearInterval(interval);
  }, [symbol, refreshIntervalMs]);

  return { orders, loading, fetchOrderbook };
}
