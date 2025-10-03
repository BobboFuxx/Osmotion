// src/pages/_app.tsx
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { RewardsProjectionProvider } from "../hooks/useRewardsProjection";
import { WalletProvider, useWallet } from "../hooks/useWallet";
import { LimitOrdersProvider } from "../contexts/LimitOrdersContext";

// Get orderbook contract address from env
const ORDERBOOK_CONTRACT = process.env.NEXT_PUBLIC_ORDERBOOK_CONTRACT as string;

function ProvidersWrapper({ children }: { children: React.ReactNode }) {
  const { client } = useWallet(); // from WalletProvider

  return (
    <LimitOrdersProvider client={client} orderbookAddress={ORDERBOOK_CONTRACT}>
      <RewardsProjectionProvider>{children}</RewardsProjectionProvider>
    </LimitOrdersProvider>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WalletProvider>
      <ProvidersWrapper>
        <Component {...pageProps} />
      </ProvidersWrapper>
    </WalletProvider>
  );
}
