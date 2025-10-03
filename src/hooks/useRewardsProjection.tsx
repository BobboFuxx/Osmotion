import { createContext, useContext, useState, ReactNode } from "react";

interface Projection {
  poolId: number;
  token: string;
  deltaLiquidity: number; // + for add, - for remove
}

interface RewardsProjectionContextType {
  projections: Projection[];
  setProjection: (proj: Projection) => void;
  clearProjections: () => void;
  getProjectionForPool: (poolId: number, token: string) => number;
}

const RewardsProjectionContext = createContext<RewardsProjectionContextType | undefined>(undefined);

export const RewardsProjectionProvider = ({ children }: { children: ReactNode }) => {
  const [projections, setProjections] = useState<Projection[]>([]);

  // Add or update a projection
  const setProjection = (proj: Projection) => {
    setProjections((prev) => {
      const filtered = prev.filter((p) => !(p.poolId === proj.poolId && p.token === proj.token));
      return [...filtered, proj];
    });
  };

  // Clear all projections
  const clearProjections = () => setProjections([]);

  // Get projection for a specific pool/token
  const getProjectionForPool = (poolId: number, token: string) => {
    const proj = projections.find((p) => p.poolId === poolId && p.token === token);
    return proj?.deltaLiquidity || 0;
  };

  return (
    <RewardsProjectionContext.Provider
      value={{
        projections,
        setProjection,
        clearProjections,
        getProjectionForPool,
      }}
    >
      {children}
    </RewardsProjectionContext.Provider>
  );
};

export const useRewardsProjection = () => {
  const context = useContext(RewardsProjectionContext);
  if (!context) throw new Error("useRewardsProjection must be used within RewardsProjectionProvider");
  return context;
};
