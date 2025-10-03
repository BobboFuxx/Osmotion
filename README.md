# Osmotion
Liquidity management and alternative UI for Osmosis blockchain


'''src/
├── components/
│   ├── WalletConnect.tsx
│   ├── EndpointSelector.tsx
│   ├── PoolList.tsx
│   ├── PoolModal.tsx          // Can be kept or merged with Add/Remove Modals if needed
│   ├── AddLiquidityModal.tsx  // NEW
│   ├── RemoveLiquidityModal.tsx  // NEW
│   ├── SwapModal.tsx
│   ├── OrderBook.tsx
│   ├── MarginTrading.tsx
│   ├── RewardsTracker.tsx
│   └── Dashboard.tsx
├── hooks/
│   ├── useWallet.ts
│   ├── usePools.ts
│   ├── useSwap.ts
│   ├── useRewards.ts
│   ├── useOrderBook.ts
│   └── useEndpoint.ts
├── pages/
│   ├── index.tsx          // Dashboard
│   ├── pools.tsx          // Pools & LP management, opens Add/Remove Modals
│   ├── swap.tsx           // Trading interface
│   ├── margin.tsx         // Margin/perp interface
│   └── settings.tsx       // Endpoint, privacy, etc.
├── utils/
│   ├── blockchain.ts      // Handles add/remove liquidity on-chain
│   ├── endpoints.ts
│   └── analytics.ts
└── styles/
    └── tailwind.config.js'''
