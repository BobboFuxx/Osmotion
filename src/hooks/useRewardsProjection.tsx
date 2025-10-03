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
}

const RewardsProjectionContext = createContext<RewardsProjectionContextType | undefined>(undefined);

export const RewardsProjectionProvider = ({ children }: { children: ReactNode }) => {
  const [projections, setProjections] = useState<Projection[]>([]);

  const setProjection = (proj: Projection) => {
    setProjections((prev) => {
      const other = prev.filter((p) => !(p.poolId === proj.poolId && p.token === proj.token));
      return [...other, proj];
    });
  };

  const clearProjections = () => setProjections([]);

  return (
    <RewardsProjectionContext.Provider value={{ projections, setProjection, clearProjections }}>
      {children}
    </RewardsProjectionContext.Provider>
  );
};

export const useRewardsProjection = () => {
  const context = useContext(RewardsProjectionContext);
  if (!context) throw new Error("useRewardsProjection must be used within RewardsProjectionProvider");
  return context;
};
