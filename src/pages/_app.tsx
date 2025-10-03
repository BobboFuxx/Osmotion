import "../styles/globals.css";
import type { AppProps } from "next/app";
import { RewardsProjectionProvider } from "../hooks/useRewardsProjection";
import { WalletProvider } from "../hooks/useWallet"; // Provides wallet context

export default function App({ Component, pageProps }: AppProps) {
  return (
    // WalletProvider should wrap everything to provide wallet/account info
    <WalletProvider>
      {/* RewardsProjectionProvider allows modals and tracker to sync projected rewards */}
      <RewardsProjectionProvider>
        <Component {...pageProps} />
      </RewardsProjectionProvider>
    </WalletProvider>
  );
}
