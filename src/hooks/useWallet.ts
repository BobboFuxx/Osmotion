// hooks/useWallet.ts
import { useState } from "react";
import { SigningStargateClient } from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";

// @ts-ignore – Leap injects a global provider
declare global {
  interface Window {
    keplr?: any;
    leap?: any;
    getOfflineSigner?: any;
  }
}

export function useWallet() {
  const [client, setClient] = useState<SigningStargateClient | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<"keplr" | "leap" | "metamask" | "mnemonic" | null>(null);

  const connect = async () => {
    try {
      let signer;
      let address: string;
      const chainId = "osmosis-1";
      const rpcEndpoint = "https://rpc.osmosis.zone";

      // ✅ 1️⃣ Try Keplr
      if (window.keplr) {
        await window.keplr.enable(chainId);
        const offlineSigner = window.getOfflineSigner(chainId);
        const accounts = await offlineSigner.getAccounts();
        signer = offlineSigner;
        address = accounts[0].address;
        setWalletType("keplr");
      }

      // ✅ 2️⃣ Try Leap (native or MetaMask bridge mode)
      else if (window.leap) {
        await window.leap.enable(chainId);
        const offlineSigner = window.leap.getOfflineSigner(chainId);
        const accounts = await offlineSigner.getAccounts();
        signer = offlineSigner;
        address = accounts[0].address;
        setWalletType(window.leap.isMetaMask ? "metamask" : "leap");
      }

      // ✅ 3️⃣ Fallback (Mnemonic for dev/testing)
      else {
        console.warn("⚠️ No Keplr or Leap wallet detected — using mnemonic fallback");
        const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
          process.env.NEXT_PUBLIC_MNEMONIC!,
          { prefix: "osmo" }
        );
        const [firstAccount] = await wallet.getAccounts();
        signer = wallet;
        address = firstAccount.address;
        setWalletType("mnemonic");
      }

      // ✅ Connect client
      const signingClient = await SigningStargateClient.connectWithSigner(rpcEndpoint, signer);
      setClient(signingClient);
      setAccount(address);
    } catch (err) {
      console.error("❌ Wallet connection failed:", err);
      throw err;
    }
  };

  const disconnect = () => {
    setClient(null);
    setAccount(null);
    setWalletType(null);
  };

  return { client, account, walletType, connect, disconnect };
}
