// hooks/useWallet.ts
import { useState } from "react";
import { SigningStargateClient } from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";

// @ts-ignore – Leap injects a global provider
declare global {
  interface Window {
    keplr?: any;
    leap?: any;
    ethereum?: any;
    getOfflineSigner?: any;
  }
}

export type WalletType = "keplr" | "leap" | "metamask" | "mnemonic";

export function useWallet() {
  const [client, setClient] = useState<SigningStargateClient | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType | null>(null);

  const connect = async () => {
    try {
      let signer: any;
      let address: string;
      const chainId = "osmosis-1";
      const rpcEndpoint = "https://rpc.osmosis.zone";

      // 1️⃣ Try Keplr first
      if (window.keplr) {
        // Enable Keplr for the chain
        await window.keplr.enable(chainId);
        signer = window.getOfflineSigner(chainId);
        const accounts = await signer.getAccounts();
        address = accounts[0].address;
        setWalletType("keplr");
      }
      // 2️⃣ Try Leap wallet (native or MetaMask bridge mode)
      else if (window.leap) {
        await window.leap.enable(chainId);
        signer = window.leap.getOfflineSigner(chainId);
        const accounts = await signer.getAccounts();
        address = accounts[0].address;
        // Detect if Leap is running in MetaMask bridge mode
        setWalletType(window.leap.isMetaMask ? "metamask" : "leap");
      }
      // 3️⃣ Optional: Plain MetaMask (read-only Cosmos address)
      else if ((window as any).ethereum && (window as any).ethereum.isMetaMask) {
        const [ethAccount] = await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        });
        address = ethAccount;
        signer = null; // MetaMask-only, cannot sign Cosmos txs without Snap
        setWalletType("metamask");
        console.warn("⚠️ MetaMask detected — signing requires Leap Snap");
      }
      // 4️⃣ Fallback: Dev mnemonic (for testing)
      else {
        console.warn("⚠️ No Keplr or Leap detected — using mnemonic fallback");
        const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
          process.env.NEXT_PUBLIC_MNEMONIC!,
          { prefix: "osmo" }
        );
        signer = wallet;
        const [firstAccount] = await wallet.getAccounts();
        address = firstAccount.address;
        setWalletType("mnemonic");
      }

      // Connect Stargate client only if signer exists
      let signingClient: SigningStargateClient | null = null;
      if (signer) {
        signingClient = await SigningStargateClient.connectWithSigner(rpcEndpoint, signer);
      }

      // Save client and account in state
      setClient(signingClient);
      setAccount(address);
    } catch (err) {
      console.error("❌ Wallet connection failed:", err);
      // Reset state on failure
      setClient(null);
      setAccount(null);
      setWalletType(null);
      throw err;
    }
  };

  // Clear wallet state
  const disconnect = () => {
    setClient(null);
    setAccount(null);
    setWalletType(null);
  };

  return { client, account, walletType, connect, disconnect };
}
