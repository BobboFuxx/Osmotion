import "../styles/globals.css";
import type { AppProps } from "next/app";
import { RewardsProjectionProvider } from "../hooks/useRewardsProjection";
import { WalletProvider } from "../hooks/useWallet"; // assuming you have a WalletProvider

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WalletProvider>
      <RewardsProjectionProvider>
        <Component {...pageProps} />
      </RewardsProjectionProvider>
    </WalletProvider>
  );
}
