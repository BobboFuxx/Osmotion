// src/utils/blockchain.ts
import { osmosis } from 'osmojs';
import { SigningStargateClient, AminoTypes } from '@cosmjs/stargate';
import { OfflineSigner, Registry } from '@cosmjs/proto-signing';
import {
  osmosisProtoRegistry,
  osmosisAminoConverters
} from 'osmojs';

// For fees
import { FEES } from '@osmonauts/utils';
import { calcAmountWithSlippage } from '@osmonauts/math';

const { joinPool, exitPool } = osmosis.gamm.v1beta1.MessageComposer.withTypeUrl;
const { lockTokens, beginUnlocking, beginUnlockingAll } = osmosis.lockup.MessageComposer.withTypeUrl;
const { addToGauge, createGauge } = osmosis.incentives.MessageComposer.withTypeUrl;

export interface BlockchainClient {
  client: SigningStargateClient;
  signerAddress: string;
}

// Initialize signing client
export async function initClient(
  rpcEndpoint: string,
  signer: OfflineSigner
): Promise<BlockchainClient> {
  const registry = new Registry(osmosisProtoRegistry);
  const aminoTypes = new AminoTypes(osmosisAminoConverters);

  const client = await SigningStargateClient.connectWithSigner(rpcEndpoint, signer, {
    registry,
    aminoTypes,
    gasPrice: FEES.osmosis.swapExactAmountIn('medium').gasPrice // default fee
  });

  const accounts = await signer.getAccounts();
  return { client, signerAddress: accounts[0].address };
}

// Add liquidity to a pool
export async function addLiquidity(
  client: SigningStargateClient,
  sender: string,
  poolId: number,
  tokenA: { denom: string; amount: string },
  tokenB: { denom: string; amount: string },
  shareOutMin?: string // optional: min LP tokens
) {
  const msg = joinPool({
    sender,
    poolId,
    shareOutAmount: shareOutMin || '0',
    tokenInMaxs: [tokenA, tokenB]
  });

  const fee = FEES.osmosis.swapExactAmountIn('medium');
  const res = await client.signAndBroadcast(sender, [msg], fee);
  return res;
}

// Remove liquidity from a pool
export async function removeLiquidity(
  client: SigningStargateClient,
  sender: string,
  poolId: number,
  shareInAmount: string,
  tokenOutMins?: Array<{ denom: string; amount: string }>
) {
  const msg = exitPool({
    sender,
    poolId,
    shareInAmount,
    tokenOutMins
  });

  const fee = FEES.osmosis.swapExactAmountIn('medium');
  const res = await client.signAndBroadcast(sender, [msg], fee);
  return res;
}

// Lock LP tokens for incentives
export async function lockLP(
  client: SigningStargateClient,
  sender: string,
  amount: { denom: string; amount: string },
  durationSeconds: number
) {
  const msg = lockTokens({
    owner: sender,
    duration: durationSeconds,
    coins: [amount]
  });

  const fee = FEES.osmosis.swapExactAmountIn('medium');
  return client.signAndBroadcast(sender, [msg], fee);
}

// Begin unlocking LP
export async function unlockLP(
  client: SigningStargateClient,
  sender: string,
  lockId: string
) {
  const msg = beginUnlocking({ owner: sender, ID: lockId });
  const fee = FEES.osmosis.swapExactAmountIn('medium');
  return client.signAndBroadcast(sender, [msg], fee);
}

// Begin unlocking all LPs
export async function unlockAllLP(client: SigningStargateClient, sender: string) {
  const msg = beginUnlockingAll({ owner: sender });
  const fee = FEES.osmosis.swapExactAmountIn('medium');
  return client.signAndBroadcast(sender, [msg], fee);
}

// Optional: add to a gauge
export async function addLiquidityToGauge(
  client: SigningStargateClient,
  sender: string,
  gaugeId: string,
  amount: { denom: string; amount: string }
) {
  const msg = addToGauge({ sender, gaugeId, rewards: [amount] });
  const fee = FEES.osmosis.swapExactAmountIn('medium');
  return client.signAndBroadcast(sender, [msg], fee);
}

// Optional: create a gauge
export async function createNewGauge(
  client: SigningStargateClient,
  sender: string,
  isPerpetual: boolean,
  distributionStartTime: string, // ISO timestamp
  coins: Array<{ denom: string; amount: string }>,
  poolIds: number[]
) {
  const msg = createGauge({
    isPerpetual,
    owner: sender,
    distributeTo: { lockQueryType: 'ByDuration', duration: '86400' }, // example: 1 day
    coins,
    startTime: distributionStartTime,
    poolId: poolIds[0], // single pool for example
    numberOfEpochsPaidOver: 1
  });

  const fee = FEES.osmosis.swapExactAmountIn('medium');
  return client.signAndBroadcast(sender, [msg], fee);
}
