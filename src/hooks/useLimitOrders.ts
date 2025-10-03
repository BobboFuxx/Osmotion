// src/hooks/useLimitOrders.ts
import { useLimitOrders } from "../contexts/LimitOrdersContext";

export const usePlaceLimitOrder = () => {
  const { addOrder } = useLimitOrders();

  const placeOrder = (
    sender: string,
    poolId: number,
    tokenIn: { denom: string; amount: string },
    tokenOutDenom: string,
    targetPrice: number,
    side: "buy" | "sell"
  ) => {
    addOrder({ sender, poolId, tokenIn, tokenOutDenom, targetPrice, side });
  };

  return { placeOrder };
};
