// src/utils/blockchain.ts
import { SigningStargateClient, AminoTypes } from "@cosmjs/stargate";
import { Registry, OfflineSigner } from "@cosmjs/proto-signing";
import { FEES } from "@osmonauts/utils";
import { osmosis, cosmos, ibc, cosmwasm } from "osmojs";

const { 
  joinPool, exitPool, exitSwapExternAmountOut, exitSwapShareAmountIn,
  joinSwapExternAmountIn, joinSwapShareAmountOut, swapExactAmountIn, swapExactAmountOut
} = osmosis.gamm.v1beta1.MessageComposer.withTypeUrl;

const { lockTokens, beginUnlocking, beginUnlockingAll } = osmosis.lockup.MessageComposer.withTypeUrl;
const { lockAndSuperfluidDelegate, superfluidDelegate, superfluidUndelegate, superfluidUnbondLock } =
  osmosis.superfluid.MessageComposer.withTypeUrl;
const { addToGauge, createGauge } = osmosis.incentives.MessageComposer.withTypeUrl;
const { transfer } = ibc.applications.transfer.v1.MessageComposer.withTypeUrl;

const { fundCommunityPool, setWithdrawAddress, withdrawDelegatorReward, withdrawValidatorCommission } =
  cosmos.distribution.v1beta1.MessageComposer.fromPartial;
const { multiSend, send } = cosmos.bank.v1beta1.MessageComposer.fromPartial;
const { beginRedelegate, createValidator, delegate, editValidator, undelegate } =
  cosmos.staking.v1beta1.MessageComposer.fromPartial;
const { deposit, submitProposal, vote, voteWeighted } = cosmos.gov.v1beta1.MessageComposer.fromPartial;
const { clearAdmin, executeContract, instantiateContract, migrateContract, storeCode, updateAdmin } =
  cosmwasm.wasm.v1.MessageComposer.withTypeUrl;

// Concentrated liquidity (CL) messages
const { MsgCreatePosition, MsgWithdrawPosition, MsgCreatePool, MsgCollectSpreadRewards, MsgFungifyChargedPositions } =
  osmosis.concentratedliquidity.v1beta1.MessageComposer.withTypeUrl;

export interface BlockchainClient {
  client: SigningStargateClient;
  signerAddress: string;
}

// --- Initialize signing client ---
export async function initClient(rpcEndpoint: string, signer: OfflineSigner): Promise<BlockchainClient> {
  const registry = new Registry(osmosis.osmosisProtoRegistry);
  const aminoTypes = new AminoTypes(osmosis.osmosisAminoConverters);

  const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, signer, {
    registry,
    aminoTypes,
    gasPrice: FEES.osmosis.swapExactAmountIn("medium").gasPrice,
  });

  const accounts = await signer.getAccounts();
  return { client, signerAddress: accounts[0].address };
}

// --- Generic helper to sign and broadcast ---
async function signAndBroadcast(client: SigningStargateClient, sender: string, msgs: any[], feeType = "medium") {
  const fee = FEES.osmosis.swapExactAmountIn(feeType);
  const res = await client.signAndBroadcast(sender, msgs, fee);
  return res.txHash;
}

// --- GAMM / Liquidity Functions ---
export async function addLiquidity(client: SigningStargateClient, sender: string, poolId: number, tokenA: { denom: string, amount: string }, tokenB: { denom: string, amount: string }, shareOutMin?: string) {
  const msg = joinPool({ sender, poolId, shareOutAmount: shareOutMin || "0", tokenInMaxs: [tokenA, tokenB] });
  return signAndBroadcast(client, sender, [msg]);
}

export async function removeLiquidity(client: SigningStargateClient, sender: string, poolId: number, shareInAmount: string, tokenOutMins?: Array<{ denom: string; amount: string }>) {
  const msg = exitPool({ sender, poolId, shareInAmount, tokenOutMins: tokenOutMins || [] });
  return signAndBroadcast(client, sender, [msg]);
}

export async function swapExact(client: SigningStargateClient, sender: string, tokenIn: { denom: string; amount: string }, tokenOutDenom: string, slippage = 0.01) {
  const msg = swapExactAmountIn({ sender, tokenIn, tokenOutDenom, tokenOutMinAmount: "0" }); // optional: calculate min with slippage
  return signAndBroadcast(client, sender, [msg]);
}

// --- Lockup & Superfluid ---
export async function lockLP(client: SigningStargateClient, sender: string, amount: { denom: string; amount: string }, durationSeconds: number) {
  const msg = lockTokens({ owner: sender, coins: [amount], duration: durationSeconds.toString() });
  return signAndBroadcast(client, sender, [msg]);
}

export async function superfluidDelegateLP(client: SigningStargateClient, sender: string, lockId: string, validator: string) {
  const msg = superfluidDelegate({ sender, lockId, valAddr: validator });
  return signAndBroadcast(client, sender, [msg]);
}

// --- Gauges / Incentives ---
export async function addToGaugeTx(client: SigningStargateClient, sender: string, gaugeId: string, rewards: Array<{ denom: string, amount: string }>) {
  const msg = addToGauge({ sender, gaugeId, rewards });
  return signAndBroadcast(client, sender, [msg]);
}

// --- IBC Transfer ---
export async function ibcTransfer(client: SigningStargateClient, sender: string, receiver: string, denom: string, amount: string, sourcePort: string, sourceChannel: string, timeoutHeight?: any, timeoutTimestamp?: number) {
  const msg = transfer({ sender, receiver, token: { denom, amount }, sourcePort, sourceChannel, timeoutHeight, timeoutTimestamp });
  return signAndBroadcast(client, sender, [msg]);
}

// --- Spot Price Query (PoolManager) ---
export async function getSpotPrice(client: SigningStargateClient, poolId: number, tokenInDenom: string, tokenOutDenom: string) {
  const query = await osmosis.gamm.v1beta1.QueryClient.create(client);
  return query.spotPrice({ poolId, tokenInDenom, tokenOutDenom });
}

// --- On-chain Limit Orders ---
export async function placeLimitOrder(
  client: SigningStargateClient,
  sender: string,
  poolId: number,
  tokenIn: { denom: string; amount: string },
  tokenOutDenom: string,
  targetPrice: number,
  side: "buy" | "sell"
) {
  const priceResponse = await getSpotPrice(client, poolId, tokenIn.denom, tokenOutDenom);
  const currentPrice = parseFloat(priceResponse.price);

  const shouldExecute =
    (side === "buy" && currentPrice <= targetPrice) ||
    (side === "sell" && currentPrice >= targetPrice);

  if (!shouldExecute) {
    console.log(`Limit order not triggered. Current: ${currentPrice}, target: ${targetPrice}`);
    return null;
  }

  const msg = swapExactAmountIn({
    sender,
    tokenIn,
    tokenOutDenom,
    tokenOutMinAmount: "0" // could calculate slippage here
  });

  return signAndBroadcast(client, sender, [msg]);
}

export async function processLimitOrders(
  client: SigningStargateClient,
  orders: Array<{
    sender: string;
    poolId: number;
    tokenIn: { denom: string; amount: string };
    tokenOutDenom: string;
    targetPrice: number;
    side: "buy" | "sell";
  }>
) {
  for (const order of orders) {
    await placeLimitOrder(
      client,
      order.sender,
      order.poolId,
      order.tokenIn,
      order.tokenOutDenom,
      order.targetPrice,
      order.side
    );
  }
}

// --- CosmWasm Contract Helper ---
export async function executeWasm(client: SigningStargateClient, sender: string, contract: string, msg: any, funds?: Array<{ denom: string; amount: string }>) {
  const wasmMsg = executeContract({ sender, contract, msg, funds: funds || [] });
  return signAndBroadcast(client, sender, [wasmMsg]);
}

// --- Concentrated Liquidity Example ---
export async function createCLPosition(client: SigningStargateClient, sender: string, poolId: number, lowerTick: string, upperTick: string, liquidity: string) {
  const msg = MsgCreatePosition({ sender, poolId, lowerTick, upperTick, liquidity });
  return signAndBroadcast(client, sender, [msg]);
}
