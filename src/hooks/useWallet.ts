// hooks/useWallet.ts
import { useState } from "react";
import { SigningStargateClient } from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";

export function useWallet() {
  const [client, setClient] = useState<SigningStargateClient | null>(null);
  const [account, setAccount] = useState<string | null>(null);

  const connect = async () => {
    try {
      let signer;
      let address;

      // ✅ Try Keplr first if available
      if (window.keplr) {
        await window.keplr.enable("osmosis-1"); // replace with your chain ID
        const offlineSigner = window.getOfflineSigner("osmosis-1");
        const accounts = await offlineSigner.getAccounts();
        signer = offlineSigner;
        address = accounts[0].address;
      } else {
        // 🔑 Fallback to mnemonic (for dev/testing)
        const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
          process.env.NEXT_PUBLIC_MNEMONIC!,
          { prefix: "osmo" }
        );
        const [firstAccount] = await wallet.getAccounts();
        signer = wallet;
        address = firstAccount.address;
      }

      const rpcEndpoint = "https://rpc.osmosis.zone"; // ✅ better main RPC endpoint
      const signingClient = await SigningStargateClient.connectWithSigner(
        rpcEndpoint,
        signer
      );

      setClient(signingClient);
      setAccount(address);
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
