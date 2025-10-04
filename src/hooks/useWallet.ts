// hooks/useWallet.ts
import { useState } from "react";
import { SigningStargateClient } from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";

export function useWallet() {
  const [client, setClient] = useState<SigningStargateClient | null>(null);
  const [account, setAccount] = useState<string | null>(null);

  const connect = async () => {
    try {
      const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
        process.env.NEXT_PUBLIC_MNEMONIC!,
        { prefix: "osmo" } 
      );

      const [firstAccount] = await wallet.getAccounts();
      setAccount(firstAccount.address);

      const rpcEndpoint = "https://rpc.osmosis-gRPC.com"; // replace
      const signingClient = await SigningStargateClient.connectWithSigner(
        rpcEndpoint,
        wallet
      );

      setClient(signingClient);
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  };

  const disconnect = () => {
    setClient(null);
    setAccount(null);
  };

  return { client, account, connect, disconnect };
}
