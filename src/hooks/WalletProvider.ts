import { SigningStargateClient } from "@cosmjs/stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";

export function useWallet() {
  const [client, setClient] = useState<SigningStargateClient | null>(null);
  const [account, setAccount] = useState<string | null>(null);

  const connect = async () => {
    // Example: using mnemonic for dev, replace with Keplr or Capsule login
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
      process.env.NEXT_PUBLIC_MNEMONIC!,
      { prefix: "cosmos" } // update with your chain prefix
    );

    const [firstAccount] = await wallet.getAccounts();
    setAccount(firstAccount.address);

    const rpcEndpoint = "https://rpc.your-chain.com"; // replace
    const signingClient = await SigningStargateClient.connectWithSigner(
      rpcEndpoint,
      wallet
    );

    setClient(signingClient);
  };

  return { client, account, connect };
}
